"""Interactive dashboard for Ghana savanna seasonal indicators.

The dashboard is intentionally lightweight: anything computationally expensive is
handled by ``climate_indicators.dashboard_precompute``.  This script simply loads
the resulting NetCDF/GeoJSON artefacts and wires them into a Panel + HoloViews
interface with clickable maps and linked detail views.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
import panel as pn
import holoviews as hv
import holoviews.streams as streams
import param
import xarray as xr

pn.extension(sizing_mode="stretch_width")
hv.extension("bokeh")

# ---------------------------------------------------------------------------
# Files produced by the pre-computation step
# ---------------------------------------------------------------------------

_DEFAULT_DATA_DIR = Path(__file__).resolve().parent / "data"
_ALT_DATA_DIR = Path(__file__).resolve().parent.parent / "climate_indicators" / "dashboard" / "data"

def _resolve_data_dir() -> Path:
    env_dir = os.environ.get("SEASONAL_DASHBOARD_DATA_DIR")
    if env_dir:
        candidate = Path(env_dir).expanduser().resolve()
        if candidate.exists():
            return candidate

    if _DEFAULT_DATA_DIR.exists():
        return _DEFAULT_DATA_DIR
    if _ALT_DATA_DIR.exists():
        return _ALT_DATA_DIR

    # fall back to default path even if missing; load_dataset will raise a helpful error
    return _DEFAULT_DATA_DIR


DATA_DIR = _resolve_data_dir()
FORECAST_FILE = DATA_DIR / "forecast_summary.nc"
SKILL_FILE = DATA_DIR / "skill_summary.nc"
BOUNDARY_FILE = DATA_DIR / "domain_boundary.geojson"

# ---------------------------------------------------------------------------
# Visual configuration
# ---------------------------------------------------------------------------

CRPS_THRESHOLDS = (7.0, 14.0)
BRIER_THRESHOLDS = (0.20, 0.40)
CATEGORY_ORDER = ("two_plus", "one", "zero")
CATEGORY_COLORS = {
    "two_plus": "#8c1d18",
    "one": "#f57c00",
    "zero": "#bdbdbd",
}
MONTH_LABELS = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
}


def load_dataset(path: Path) -> xr.Dataset:
    if not path.exists():
        raise FileNotFoundError(
            f"Required dataset '{path}' is missing. Run the pre-computation script first."
        )
    return xr.open_dataset(path)


def _grid_edges(coords: np.ndarray) -> np.ndarray:
    coords = np.asarray(coords, dtype="float64")
    if coords.size < 2:
        return np.array([coords[0] - 0.05, coords[0] + 0.05], dtype="float64")
    deltas = np.diff(coords) / 2.0
    edges = np.empty(coords.size + 1, dtype="float64")
    edges[1:-1] = coords[:-1] + deltas
    edges[0] = coords[0] - deltas[0]
    edges[-1] = coords[-1] + deltas[-1]
    return edges


def _gridmask_to_polygons(mask: xr.DataArray, *, label: str, color: str) -> hv.Polygons:
    mask = mask.load()
    if mask.notnull().sum() == 0:
        return hv.Polygons([])

    lat_dim = next(d for d in mask.dims if "lat" in d.lower())
    lon_dim = next(d for d in mask.dims if "lon" in d.lower())
    lat_values = np.asarray(mask[lat_dim])
    lon_values = np.asarray(mask[lon_dim])
    lat_edges = _grid_edges(lat_values)
    lon_edges = _grid_edges(lon_values)

    polys: list[dict[str, list[float]]] = []
    for i, lat_val in enumerate(lat_values):
        for j, lon_val in enumerate(lon_values):
            val = mask.isel({lat_dim: i, lon_dim: j}).item()
            if not bool(val):
                continue
            y0, y1 = lat_edges[i], lat_edges[i + 1]
            x0, x1 = lon_edges[j], lon_edges[j + 1]
            polys.append(
                {
                    "x": [x0, x1, x1, x0, x0],
                    "y": [y0, y0, y1, y1, y0],
                    "label": label,
                }
            )

    poly = hv.Polygons(polys, vdims="label")
    if not polys:
        return poly

    return poly.opts(
        fill_alpha=0,
        line_color=color,
        line_width=2,
    )


def _load_boundary_path() -> hv.Path:
    if not BOUNDARY_FILE.exists():
        return hv.Path([])
    payload = json.loads(BOUNDARY_FILE.read_text())
    paths = []
    for feature in payload.get("features", []):
        geom = feature.get("geometry", {})
        coords = geom.get("coordinates", [])
        if geom.get("type") == "Polygon":
            sequences = coords
        elif geom.get("type") == "MultiPolygon":
            sequences = [ring for polygon in coords for ring in polygon]
        else:
            continue
        for ring in sequences:
            xs, ys = zip(*ring)
            paths.append((xs, ys))
    return hv.Path(paths).opts(color="black", line_width=1.0)


def _doy_to_datetime(doy: float, ref_year: int) -> pd.Timestamp:
    base = pd.Timestamp(f"{ref_year}-01-01")
    return base + pd.Timedelta(days=float(doy) - 1)


def _classify(value: float, thresholds: tuple[float, float]) -> str:
    if not np.isfinite(value):
        return "NA"
    low, high = thresholds
    if value <= low:
        return "Good"
    if value <= high:
        return "Caution"
    return "Poor"


class SeasonalDashboard(param.Parameterized):
    """Encapsulates all state and reactive views for the dashboard."""

    target_date = param.ObjectSelector()
    dry_threshold = param.ObjectSelector()
    dry_view = param.ObjectSelector(default="Season", objects=["Season", "Month"])
    dry_season = param.ObjectSelector()
    dry_month = param.ObjectSelector()
    show_onset_skill = param.Boolean(default=True)
    show_dry_skill = param.Boolean(default=True)
    lon = param.Number()
    lat = param.Number()

    def __init__(self, **params):
        self.forecast = load_dataset(FORECAST_FILE)
        self.skill = load_dataset(SKILL_FILE)

        self.ref_year = int(self.forecast.attrs.get("ref_year", 2023))
        self.target_dates = [str(v) for v in self.forecast["target_date"].values]
        self.thresholds = [int(v) for v in self.forecast["dryspell_prob_month"]["threshold"].values]
        self.months = [int(v) for v in self.forecast["dryspell_prob_month"]["month"].values]
        self.season_mapping = json.loads(self.forecast.attrs.get("seasons", "{}"))
        self.seasons = list(self.season_mapping.keys())

        lat_dim = next(d for d in self.forecast.dims if "lat" in d.lower())
        lon_dim = next(d for d in self.forecast.dims if "lon" in d.lower())
        self.lat_values = np.asarray(self.forecast[lat_dim], dtype="float64")
        self.lon_values = np.asarray(self.forecast[lon_dim], dtype="float64")

        params.setdefault("target_date", self.target_dates[0])
        params.setdefault("dry_threshold", self.thresholds[0])
        params.setdefault("dry_season", self.seasons[0] if self.seasons else None)
        params.setdefault("dry_month", self.months[0])
        params.setdefault("lon", float(self.lon_values.mean()))
        params.setdefault("lat", float(self.lat_values.mean()))

        super().__init__(**params)

        self.param.target_date.objects = self.target_dates
        self.param.dry_threshold.objects = self.thresholds
        self.param.dry_season.objects = self.seasons or [None]
        self.param.dry_month.objects = self.months

        self.boundary = _load_boundary_path()

        self.onset_stream = streams.Tap(source=hv.Curve([]))
        self.dry_stream = streams.Tap(source=hv.Curve([]))
        self.onset_stream.add_subscriber(lambda **kw: self._update_location(kw.get("x"), kw.get("y")))
        self.dry_stream.add_subscriber(lambda **kw: self._update_location(kw.get("x"), kw.get("y")))

    # ------------------------------------------------------------------
    # Selection helpers
    # ------------------------------------------------------------------

    def _update_location(self, lon: float | None, lat: float | None) -> None:
        if lon is None or lat is None:
            return
        lon_idx = int(np.abs(self.lon_values - lon).argmin())
        lat_idx = int(np.abs(self.lat_values - lat).argmin())
        self.lon = float(self.lon_values[lon_idx])
        self.lat = float(self.lat_values[lat_idx])

    @property
    def selected_point(self) -> hv.Points:
        return hv.Points([(self.lon, self.lat)], kdims=["longitude", "latitude"]).opts(color="black", marker="x", size=10)

    # ------------------------------------------------------------------
    # Skill overlays (cached)
    # ------------------------------------------------------------------

    @lru_cache(maxsize=16)
    def onset_skill_overlay(self) -> hv.Overlay:
        crps = self.skill["onset_crps_mean"]
        caution = xr.where((crps >= CRPS_THRESHOLDS[0]) & (crps <= CRPS_THRESHOLDS[1]), 1, np.nan)
        poor = xr.where(crps > CRPS_THRESHOLDS[1], 1, np.nan)
        overlays = []
        if caution.notnull().any():
            overlays.append(_gridmask_to_polygons(caution, label="CRPS 7–14 d", color="#ffb74d"))
        if poor.notnull().any():
            overlays.append(_gridmask_to_polygons(poor, label="CRPS > 14 d", color="#c62828"))
        return hv.Overlay(overlays) if overlays else hv.Overlay([])

    @lru_cache(maxsize=64)
    def dry_skill_overlay(self, threshold: int, months_key: tuple[int, ...]) -> hv.Overlay:
        brier = self.skill["dryspell_brier_score"].sel(threshold=threshold)
        brier_sel = brier.sel(month=list(months_key)).mean("month") if len(months_key) > 1 else brier.sel(month=months_key[0])
        caution = xr.where((brier_sel > BRIER_THRESHOLDS[0]) & (brier_sel <= BRIER_THRESHOLDS[1]), 1, np.nan)
        poor = xr.where(brier_sel > BRIER_THRESHOLDS[1], 1, np.nan)
        overlays = []
        if caution.notnull().any():
            overlays.append(_gridmask_to_polygons(caution, label="Brier 0.20–0.40", color="#ffb74d"))
        if poor.notnull().any():
            overlays.append(_gridmask_to_polygons(poor, label="Brier > 0.40", color="#c62828"))
        return hv.Overlay(overlays) if overlays else hv.Overlay([])

    # ------------------------------------------------------------------
    # Map renderers
    # ------------------------------------------------------------------

    def _render_onset_map(self, target_date: str, show_skill: bool, lon: float, lat: float) -> hv.Overlay:
        data = self.forecast["onset_poe"].sel(target_date=target_date)
        img = hv.Image(
            data.transpose("longitude", "latitude"),
            kdims=["longitude", "latitude"],
            vdims="probability",
        ).opts(
            cmap="YlOrBr",
            clim=(0, 1),
            colorbar=True,
            tools=["hover", "tap", "wheel_zoom", "reset"],
            active_tools=["wheel_zoom"],
            width=440,
            height=400,
            title=f"Onset PoE ≤ {target_date}",
            hover_tooltips=[("lon", "@longitude"), ("lat", "@latitude"), ("prob", "@probability{0.00%}")],
        )

        overlays: list[hv.Element] = [img, self.boundary, self.selected_point]
        if show_skill:
            overlays.append(self.onset_skill_overlay())

        overlay = hv.Overlay(overlays)
        self.onset_stream.source = overlay
        return overlay

    def _render_dry_map(
        self,
        threshold: int,
        dry_view: str,
        dry_season: str,
        dry_month: int,
        show_skill: bool,
        lon: float,
        lat: float,
    ) -> hv.Overlay:
        if dry_view == "Season" and dry_season in self.season_mapping:
            months_key = tuple(int(m) for m in self.season_mapping[dry_season])
            data = self.forecast["dryspell_prob_season"].sel(season=dry_season, threshold=threshold)
            title = f"Dry-spell Prob ≥{threshold} d ({dry_season})"
        else:
            months_key = (int(dry_month),)
            data = self.forecast["dryspell_prob_month"].sel(month=dry_month, threshold=threshold)
            title = f"Dry-spell Prob ≥{threshold} d ({MONTH_LABELS.get(dry_month, dry_month)})"

        img = hv.Image(
            data.transpose("longitude", "latitude"),
            kdims=["longitude", "latitude"],
            vdims="probability",
        ).opts(
            cmap="Reds",
            clim=(0, 1),
            colorbar=True,
            tools=["hover", "tap", "wheel_zoom", "reset"],
            active_tools=["wheel_zoom"],
            width=440,
            height=400,
            title=title,
            hover_tooltips=[("lon", "@longitude"), ("lat", "@latitude"), ("prob", "@probability{0.00%}")],
        )

        overlays: list[hv.Element] = [img, self.boundary, self.selected_point]
        if show_skill:
            overlays.append(self.dry_skill_overlay(threshold, months_key))

        overlay = hv.Overlay(overlays)
        self.dry_stream.source = overlay
        return overlay

    # ------------------------------------------------------------------
    # Panel A — Onset CDF
    # ------------------------------------------------------------------

    def _render_panel_a(self, target_date: str, lon: float, lat: float) -> pn.Column:
        ensemble = self.forecast["onset_ensemble"].sel(latitude=lat, longitude=lon, method="nearest")
        ens_vals = ensemble.dropna("number").values

        if ens_vals.size == 0:
            return pn.Column(
                pn.pane.Markdown(
                    "### Panel A — Onset CDF\nNo forecast ensemble values available for this grid cell.",
                    height=360,
                )
            )

        clim = self.forecast["onset_climatology"].sel(latitude=lat, longitude=lon, method="nearest")
        clim_vals = clim.dropna("year").values

        ens_sorted = np.sort(ens_vals)
        ens_prob = np.arange(1, ens_sorted.size + 1) / (ens_sorted.size + 1)
        ens_dates = [_doy_to_datetime(val, self.ref_year) for val in ens_sorted]
        fc_curve = hv.Curve((ens_dates, ens_prob), label="Forecast").opts(color="#b71c1c", line_width=2)

        overlays: list[hv.Element] = [fc_curve]

        if clim_vals.size:
            clim_sorted = np.sort(clim_vals)
            clim_prob = np.arange(1, clim_sorted.size + 1) / (clim_sorted.size + 1)
            clim_dates = [_doy_to_datetime(val, self.ref_year) for val in clim_sorted]
            clim_curve = hv.Curve((clim_dates, clim_prob), label="Climatology").opts(color="#1e88e5", line_dash="dashed", line_width=2)
            overlays.append(clim_curve)

        q25, q50, q75 = np.percentile(ens_sorted, [25, 50, 75])
        q25_dt = _doy_to_datetime(q25, self.ref_year)
        q75_dt = _doy_to_datetime(q75, self.ref_year)
        iqr_span = hv.VSpan(q25_dt, q75_dt).opts(color="#ef9a9a", alpha=0.2)
        overlays.append(iqr_span)
        overlays.append(hv.VLine(_doy_to_datetime(q50, self.ref_year)).opts(color="#d32f2f", line_width=1.5))

        target_ts = pd.Timestamp(f"{self.ref_year}-{target_date}")
        target_dt = _doy_to_datetime(target_ts.dayofyear, self.ref_year)
        poe = float((ens_vals <= target_ts.dayofyear).sum() / ens_vals.size)
        overlays.append(hv.Scatter(([target_dt], [poe]), label="PoE").opts(color="black", marker="o", size=8))

        overlay = hv.Overlay(overlays).opts(
            width=440,
            height=360,
            ylabel="Cumulative Probability",
            xlabel="Date",
            ylim=(0, 1),
            show_grid=True,
            legend_position="top_left",
            title=f"Panel A — Onset CDF (lat={lat:.2f}, lon={lon:.2f})",
        )

        crps = float(self.skill["onset_crps_mean"].sel(latitude=lat, longitude=lon, method="nearest"))
        crps_class = _classify(crps, CRPS_THRESHOLDS)
        brier_text = "NA"
        if "onset_brier_score" in self.skill:
            brier = float(
                self.skill["onset_brier_score"].sel(target_date=target_date).sel(latitude=lat, longitude=lon, method="nearest")
            )
            brier_text = f"{brier:.2f} ({_classify(brier, BRIER_THRESHOLDS)})"

        info = pn.pane.Markdown(
            f"**Skill @ cell**  CRPS: {crps:.1f} d ({crps_class}) | Brier: {brier_text} | PoE: {poe:.0%}",
            margin=(10, 0, 0, 0),
        )

        return pn.Column(pn.pane.HoloViews(overlay, sizing_mode="stretch_width"), info)

    # ------------------------------------------------------------------
    # Panel B — Ensemble composition
    # ------------------------------------------------------------------

    def _render_panel_b(self, threshold: int, lon: float, lat: float) -> pn.Column:
        frac = self.forecast["dryspell_fraction_category"].sel(
            threshold=threshold, latitude=lat, longitude=lon, method="nearest"
        )
        if frac.isnull().all():
            return pn.Column(
                pn.pane.Markdown(
                    "### Panel B — Dry-spell distribution\nNo dry-spell statistics available for this grid cell.",
                    height=360,
                )
            )

        df = (
            frac.to_series()
            .reset_index(name="fraction")
            .assign(
                category=lambda d: pd.Categorical(
                    d["category"], categories=CATEGORY_ORDER, ordered=True
                )
            )
        )

        bars = hv.Bars(df, kdims=["month", "category"], vdims="fraction").opts(
            stacked=True,
            color=hv.dim("category").categorize(CATEGORY_COLORS),
            width=440,
            height=360,
            ylim=(0, 1),
            tools=["hover"],
            xlabel="Month",
            ylabel="Fraction of members",
            legend_position="top_left",
            xticks=[(m, MONTH_LABELS.get(m, str(m))) for m in self.months],
        )

        climo = self.skill["dryspell_climo_prob"].sel(
            threshold=threshold, latitude=lat, longitude=lon, method="nearest", month=self.months
        )
        curve = hv.Curve((self.months, climo.values), label="Climatology P(≥1)").opts(color="#1565c0", line_width=3)
        scatter = hv.Scatter((self.months, climo.values)).opts(color="#1565c0", size=6)

        brier = self.skill["dryspell_brier_score"].sel(
            threshold=threshold, latitude=lat, longitude=lon, method="nearest", month=self.months
        )
        brier_table = pd.DataFrame(
            {
                "Month": [MONTH_LABELS.get(m, str(m)) for m in self.months],
                "Brier": [f"{val:.2f}" if np.isfinite(val) else "NA" for val in brier.values],
                "Class": [_classify(float(val), BRIER_THRESHOLDS) if np.isfinite(val) else "NA" for val in brier.values],
            }
        )

        overlay = (bars * curve * scatter).opts(
            title=f"Panel B — Dry-spell fractions ≥{threshold} d",
        )

        return pn.Column(
            pn.pane.HoloViews(overlay, sizing_mode="stretch_width"),
            pn.pane.DataFrame(brier_table, index=False, width=440),
        )

    # ------------------------------------------------------------------
    # Public layout
    # ------------------------------------------------------------------

    def panel(self) -> pn.Column:
        widgets = pn.Param(
            self,
            parameters=[
                "target_date",
                "dry_threshold",
                "dry_view",
                "dry_season",
                "dry_month",
                "show_onset_skill",
                "show_dry_skill",
            ],
            widgets={
                "target_date": pn.widgets.Select,
                "dry_threshold": pn.widgets.Select,
                "dry_view": pn.widgets.RadioButtonGroup,
                "dry_season": pn.widgets.Select,
                "dry_month": pn.widgets.Select,
                "show_onset_skill": pn.widgets.Toggle,
                "show_dry_skill": pn.widgets.Toggle,
            },
            show_name=False,
        )

        @pn.depends(self.param.dry_view, watch=True)
        def _toggle_view(view: str) -> None:
            widgets.widgets["dry_season"].visible = view == "Season"
            widgets.widgets["dry_month"].visible = view == "Month"

        _toggle_view(self.dry_view)

        coord_display = pn.pane.Markdown(
            pn.bind(lambda lon, lat: f"**Selected cell** lon={lon:.3f}, lat={lat:.3f}", self.param.lon, self.param.lat)
        )

        onset_bind = pn.bind(
            self._render_onset_map,
            target_date=self.param.target_date,
            show_skill=self.param.show_onset_skill,
            lon=self.param.lon,
            lat=self.param.lat,
        )
        dry_bind = pn.bind(
            self._render_dry_map,
            threshold=self.param.dry_threshold,
            dry_view=self.param.dry_view,
            dry_season=self.param.dry_season,
            dry_month=self.param.dry_month,
            show_skill=self.param.show_dry_skill,
            lon=self.param.lon,
            lat=self.param.lat,
        )

        maps = pn.Row(
            pn.pane.HoloViews(onset_bind, sizing_mode="stretch_width"),
            pn.pane.HoloViews(dry_bind, sizing_mode="stretch_width"),
        )

        panel_a_bind = pn.bind(
            self._render_panel_a,
            target_date=self.param.target_date,
            lon=self.param.lon,
            lat=self.param.lat,
        )
        panel_b_bind = pn.bind(
            self._render_panel_b,
            threshold=self.param.dry_threshold,
            lon=self.param.lon,
            lat=self.param.lat,
        )

        panels = pn.Row(panel_a_bind, panel_b_bind)

        lonlat_panel = pn.Param(
            self,
            parameters=["lon", "lat"],
            widgets={"lon": pn.widgets.StaticText, "lat": pn.widgets.StaticText},
            show_name=False,
        )

        return pn.Column(widgets, coord_display, lonlat_panel, maps, panels)


def main() -> pn.Column:
    dashboard = SeasonalDashboard()
    return dashboard.panel()


app = main()
app.servable("Seasonal Indicators Dashboard")
