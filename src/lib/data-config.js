/**
 * R2 bucket base URL and data artifact paths.
 * Swap R2_BASE for the custom domain when one is configured.
 */
export const R2_BASE = 'https://pub-0a56875e3f4c46ad97b50538897150d9.r2.dev';

export const CALENDAR_URL = `${R2_BASE}/agriculture/v1/crop_calendar.json`;

export const COUNTRY_OPTIONS = [
	{
		value: 'ghana',
		label: 'Ghana',
		view: { center: [-1.02, 7.95], zoom: 5 }
	},
	{
		value: 'kenya',
		label: 'Kenya',
		view: { center: [37.91, 0.15], zoom: 5 }
	},
	{
		value: 'zimbabwe',
		label: 'Zimbabwe',
		view: { center: [29.15, -19.02], zoom: 5 }
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

export const OBSERVED_CROP_OPTIONS = [
	{ value: 'maize', label: 'Maize' },
	{ value: 'sorghum', label: 'Sorghum' }
];

export const OBSERVED_CROP_LABELS = Object.fromEntries(
	OBSERVED_CROP_OPTIONS.map(({ value, label }) => [value, label])
);

export const OBSERVED_BOUNDARY_OPTIONS = [
	{ value: 'country', label: 'Country' },
	{ value: 'admin1', label: 'Admin 1' },
	{ value: 'admin2', label: 'Admin 2' }
];

export const OBSERVED_BOUNDARY_LABELS = Object.fromEntries(
	OBSERVED_BOUNDARY_OPTIONS.map(({ value, label }) => [value, label])
);

export const CALENDAR_DATASET_LABELS = {
	sowing_date: 'Sowing date',
	harvest_date: 'Harvest date'
};

export const CALENDAR_DATASET_OPTIONS = Object.entries(CALENDAR_DATASET_LABELS).map(
	([value, label]) => ({ value, label })
);

export const ADMIN_PMTILES_URLS = {
	country: `${R2_BASE}/admin/v1/country.pmtiles`,
	admin1: `${R2_BASE}/admin/v1/admin1.pmtiles`,
	admin2: `${R2_BASE}/admin/v1/admin2.pmtiles`,
	aez: `${R2_BASE}/admin/v1/aez.pmtiles`
};
