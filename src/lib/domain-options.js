/**
 * Options the UI offers: countries, datasets and boundary levels.
 *
 * Only lists shared by more than one route belong here. Crop lists are
 * deliberately absent — the yield forecast reads its crops from the published
 * catalog, so hard-coding a second list here would create a source of truth
 * that silently drifts from the data.
 */
export const COUNTRY_OPTIONS = [
	{
		value: 'ghana',
		label: 'Ghana',
		view: { center: [-1.02, 7.95], zoom: 4.3 }
	},
	{
		value: 'kenya',
		label: 'Kenya',
		view: { center: [37.91, 0.15], zoom: 4.3 }
	},
	{
		value: 'zimbabwe',
		label: 'Zimbabwe',
		view: { center: [29.15, -19.02], zoom: 4.3 }
	}
];

export const COUNTRY_LABELS = Object.fromEntries(
	COUNTRY_OPTIONS.map(({ value, label }) => [value, label])
);

export const COUNTRY_VIEWS = Object.fromEntries(
	COUNTRY_OPTIONS.map(({ value, view }) => [value, view])
);

export const OBSERVED_DATASET_LABELS = {
	yield: 'Observed yield',
	production: 'Observed production',
	harvested_area: 'Observed harvested area'
};

export const OBSERVED_DATASET_OPTIONS = Object.entries(OBSERVED_DATASET_LABELS).map(
	([value, label]) => ({ value, label })
);

export const OBSERVED_BOUNDARY_OPTIONS = [
	{ value: 'country', label: 'Country' },
	{ value: 'admin1', label: 'Admin 1' },
	{ value: 'admin2', label: 'Admin 2' }
];

export const OBSERVED_BOUNDARY_LABELS = Object.fromEntries(
	OBSERVED_BOUNDARY_OPTIONS.map(({ value, label }) => [value, label])
);

// The level the forecast is reported at. Not a boundary choice: it changes what
// the numbers are, from a 0.1 degree cell's percentile to an area-weighted
// aggregate over a whole unit. The forecast is published per grid cell, so that
// is the default.
export const YIELD_FORECAST_AGGREGATION_OPTIONS = [
	{ value: 'grid', label: 'Grid cells' },
	...OBSERVED_BOUNDARY_OPTIONS
];

export const CALENDAR_DATASET_LABELS = {
	sowing_date: 'Sowing date',
	harvest_date: 'Harvest date'
};

export const CALENDAR_DATASET_OPTIONS = Object.entries(CALENDAR_DATASET_LABELS).map(
	([value, label]) => ({ value, label })
);
