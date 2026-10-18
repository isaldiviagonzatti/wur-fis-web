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
		isoCode: 'gh',
		view: { center: [-1.02, 7.95], zoom: 4.3 },
		bounds: [
			[-3.3, 4.7],
			[1.2, 11.2]
		]
	},
	{
		value: 'kenya',
		label: 'Kenya',
		isoCode: 'ke',
		view: { center: [37.91, 0.15], zoom: 4.3 },
		bounds: [
			[33.9, -4.7],
			[41.9, 5.0]
		]
	},
	{
		value: 'zimbabwe',
		label: 'Zimbabwe',
		isoCode: 'zw',
		view: { center: [29.15, -19.02], zoom: 4.3 },
		bounds: [
			[25.2, -22.5],
			[33.1, -15.6]
		]
	}
];

export const COUNTRY_LABELS = Object.fromEntries(
	COUNTRY_OPTIONS.map(({ value, label }) => [value, label])
);

export const COUNTRY_VIEWS = Object.fromEntries(
	COUNTRY_OPTIONS.map(({ value, view }) => [value, view])
);

/**
 * The study country containing a point, from its bounding box. The three are far
 * apart, so their boxes never overlap; a point outside all of them gives ''.
 */
export function countryAt(lat, lon) {
	const match = COUNTRY_OPTIONS.find(
		({ bounds: [[west, south], [east, north]] }) =>
			lon >= west && lon <= east && lat >= south && lat <= north
	);
	return match?.value ?? '';
}

/** One box around the given countries, for framing the map on them. */
export function countriesBounds(values) {
	const boxes = COUNTRY_OPTIONS.filter(({ value }) => values.includes(value)).map(
		({ bounds }) => bounds
	);
	if (!boxes.length) return null;
	return [
		[Math.min(...boxes.map(([[west]]) => west)), Math.min(...boxes.map(([[, south]]) => south))],
		[Math.max(...boxes.map(([, [east]]) => east)), Math.max(...boxes.map(([, [, north]]) => north))]
	];
}

// The level the forecast is reported at. Not a boundary choice: it changes what
// the numbers are, from a 0.1 degree cell's percentile to an area-weighted
// aggregate over a whole unit. The forecast is published per grid cell, so that
// is the default. Ordered smallest to largest, which is the order the levels
// nest in.
export const YIELD_FORECAST_AGGREGATION_OPTIONS = [
	{ value: 'grid', label: 'Grid cells' },
	{ value: 'admin2', label: 'Admin 2' },
	{ value: 'admin1', label: 'Admin 1' },
	{ value: 'country', label: 'Country' }
];

export const CALENDAR_DATASET_LABELS = {
	sowing_date: 'Sowing date',
	harvest_date: 'Harvest date'
};

export const CALENDAR_DATASET_OPTIONS = Object.entries(CALENDAR_DATASET_LABELS).map(
	([value, label]) => ({ value, label })
);
