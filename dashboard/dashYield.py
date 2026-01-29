import os
import xarray as xr
import panel as pn
import holoviews as hv
import hvplot.xarray  # enables .hvplot on xarray objects
import datashader as ds
import holoviews.operation.datashader as hd
import numpy as np

pn.extension(sizing_mode="stretch_width")
hv.extension('bokeh')

# ------------------------------
# Load your precomputed data from Zarr
# ------------------------------

dataDir = "/mnt/c/Users/saldi004/Downloads/lpjmlPostproc"

# Precomputed spatial mean datasets (for Tab 1 – yield maps)
mean_files = {
    "baseline": xr.open_zarr(os.path.join(dataDir, "countrySpatialPeriodMean_baseline.zarr")),
    "2041_2070": xr.open_zarr(os.path.join(dataDir, "countrySpatialPeriodMean_2041_2070.zarr")),
    "2071_2100": xr.open_zarr(os.path.join(dataDir, "countrySpatialPeriodMean_2071_2100.zarr"))
}

# Precomputed spatial difference datasets (for Tab 2 – percentage change)
diff_files = {
    "baseline": xr.open_zarr(os.path.join(dataDir, "countrySpatialPeriodDiff_baseline.zarr")),
    "2041_2070": xr.open_zarr(os.path.join(dataDir, "countrySpatialPeriodDiff_2041_2070.zarr")),
    "2071_2100": xr.open_zarr(os.path.join(dataDir, "countrySpatialPeriodDiff_2071_2100.zarr"))
}

# Yield (time series) datasets (one per country)
yield_files = {
    "ghana": xr.open_zarr(os.path.join(dataDir, "ghana_yield.zarr")),
    "kenya": xr.open_zarr(os.path.join(dataDir, "kenya_yield.zarr")),
    "zimbabwe": xr.open_zarr(os.path.join(dataDir, "zimbabwe_yield.zarr"))
}

# Get the list of countries and crop names (assumed to be stored as coordinates in the mean file)
countries = list(mean_files["baseline"].country.values)
crops = list(mean_files["baseline"].npft.values)  # e.g., 16 crop bands

# ------------------------------
# Helper functions to subset the data
# ------------------------------
def get_mean_ds(country, crop):
    # Subset each mean dataset for the selected country and crop.
    return {period: ds.sel(country=country, npft=crop)["harvest"] for period, ds in mean_files.items()}

def get_diff_ds(country, crop):
    # Subset each diff dataset for the selected country and crop.
    return {period: ds.sel(country=country, npft=crop)["harvest"] for period, ds in diff_files.items()}

def get_yield_ds(country, crop):
    # Subset the yield (time series) dataset.
    return yield_files[country].sel(npft=crop)["harvest"]

# ------------------------------
# Create a dynamic map function for a given set of DataArrays.
# We use hd.regrid to create a DynamicMap that will regrid (downsample) on the fly.
# ------------------------------
def create_dynamic_map(data_array, clim=None, cmap="viridis"):
    # Create a base hv.Image and then wrap it in a DynamicMap via hd.regrid
    img = hv.Image(data_array, kdims=["latitude", "longitude"], vdims=["harvest"]).opts(cmap=cmap, colorbar=True)
    if clim is not None:
        img = img.opts(clim=clim)
    return hd.regrid(img)

# ------------------------------
# Build Tab 1: Yield Maps + Time Series
# ------------------------------
def create_yield_tab(country, crop):
    mean_ds = get_mean_ds(country, crop)
    # Optionally, you might want to compute a common clim range from the baseline.
    clim = (float(mean_ds["baseline"].min()), float(mean_ds["baseline"].max()))
    # For each period, create a dynamic map.
    maps = []
    for period in ["baseline", "2041_2070", "2071_2100"]:
        dyn_map = create_dynamic_map(mean_ds[period], clim=clim, cmap="viridis")
        # Overlay the dynamic image on top of an OSM tile.
        tile = hv.element.tiles.OSM().opts(width=400, height=400)
        combined = tile * dyn_map
        combined = combined.opts(title=f"{crop} - {period}")
        maps.append(combined)
    # Arrange the three maps horizontally.
    maps_row = hv.Layout(maps).cols(3)
    # Create the time series plot (using yield data)
    yield_da = get_yield_ds(country, crop)
    ts = hv.Curve(yield_da, kdims=["time"], vdims=["harvest"]).opts(title=f"Yearly Yield - {country.title()} - {crop}")
    # Return a Panel layout with maps on top and time series below.
    return pn.Column(pn.pane.HoloViews(maps_row, sizing_mode="stretch_width"), pn.pane.HoloViews(ts, sizing_mode="stretch_width"))

# ------------------------------
# Build Tab 2: Percentage Change Maps
# For Tab 2, we assume that the diff files already contain the desired calculations.
# (Baseline diff file holds the baseline absolute values.)
# ------------------------------
def create_diff_tab(country, crop):
    diff_ds = get_diff_ds(country, crop)
    # For consistency, get a clim from the baseline diff.
    clim = (float(diff_ds["baseline"].min()), float(diff_ds["baseline"].max()))
    maps = []
    # We want to show three maps: baseline (absolute) and two future periods (percentage change)
    for period in ["baseline", "2041_2070", "2071_2100"]:
        dyn_map = create_dynamic_map(diff_ds[period], clim=clim, cmap="RdBu")
        tile = hv.element.tiles.OSM().opts(width=400, height=400)
        combined = tile * dyn_map
        combined = combined.opts(title=f"{crop} - {period}")
        maps.append(combined)
    maps_row = hv.Layout(maps).cols(3)
    return pn.Column(pn.pane.HoloViews(maps_row, sizing_mode="stretch_width"))

# ------------------------------
# Create interactive widgets for country and crop
# ------------------------------
country_select = pn.widgets.Select(name="Country", options=countries, value=countries[0])
crop_select = pn.widgets.Select(name="Crop", options=crops, value=crops[0])

# ------------------------------
# Create two tabs: one for yield maps and time series, one for percentage change maps.
# ------------------------------
@pn.depends(country_select.param.value, crop_select.param.value)
def yield_tab_view(country, crop):
    return create_yield_tab(country, crop)

@pn.depends(country_select.param.value, crop_select.param.value)
def diff_tab_view(country, crop):
    return create_diff_tab(country, crop)

tabs = pn.Tabs(
    ("Yield Maps", yield_tab_view),
    ("Percentage Change", diff_tab_view)
)

# ------------------------------
# Layout the app with the selectors and tabs.
# ------------------------------
app_panel = pn.Column(
    pn.WidgetBox(country_select, crop_select),
    tabs
)

# To serve the Panel app, run: panel serve --show myapp.py
app_panel.servable()
