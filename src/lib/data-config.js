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

export const OBSERVED_CROP_OPTIONS = [
	{ value: 'maize', label: 'Maize' },
	{ value: 'sorghum', label: 'Sorghum' }
];

export const ADMIN_PMTILES_URLS = {
	country: `${R2_BASE}/admin/v1/country.pmtiles`,
	admin1: `${R2_BASE}/admin/v1/admin1.pmtiles`,
	admin2: `${R2_BASE}/admin/v1/admin2.pmtiles`,
	aez: `${R2_BASE}/admin/v1/aez.pmtiles`
};
