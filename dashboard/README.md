# Seasonal Indicators Dashboard

Steps to refresh the dashboard inputs and launch the interactive app:

1. **Generate lightweight artefacts** (only when the forecast or skill files change):

   ```bash
   python -m climate_indicators.dashboard_precompute \
       --forecast /path/to/tp_YYYYMM_target_bcca.nc \
       --skill /path/to/hindcast_onset_skill.nc \
       --onset-climatology /path/to/threshold_onset_20mm_3day_ghana_guinea.nc \
       --boundary-shape /path/to/agroEcologicalZones/ghana.geojson \
       --output-dir dashboard/data \
       --forecast-label "SEAS5 Mar 2023"
   ```

   Tailor the paths as needed; the command writes three small files into
   `dashboard/data/` that the dashboard loads at runtime.

2. **Serve the dashboard locally** (after activating the desired environment):

   ```bash
   panel serve dashboard/seasonal_dashboard.py --autoreload --show
   ```

   When deployed on a server, omit `--show` and front the endpoint with your
   preferred web framework/proxy.

The click interaction works on either map; the detailed panels refresh based on
the most recent click.  Use the toggles to overlay the CRPS (onset) and Brier
(dry-spell) skill hatching.

