/**
 * Where published data artifacts live.
 *
 * This module is only about locations — base URLs and the path builders for
 * each artifact family. What the UI offers the user (country lists, dataset
 * and boundary options) lives in domain-options.js, because those change for
 * entirely different reasons.
 */
import { env } from '$env/dynamic/public';

export const R2_BASE = 'https://pub-0a56875e3f4c46ad97b50538897150d9.r2.dev';

// Set PUBLIC_DATA_BASE (e.g. /dev-data) to read artifacts from a local copy
// under static/ instead of R2, so a run can be reviewed before it is published.
export const DATA_BASE = env.PUBLIC_DATA_BASE || R2_BASE;

export const CALENDAR_URL = `${DATA_BASE}/agriculture/v1/crop_calendar.json`;

export const ADMIN_PMTILES_URLS = {
	country: `${R2_BASE}/admin/v1/country.pmtiles`,
	admin1: `${R2_BASE}/admin/v1/admin1.pmtiles`,
	admin2: `${R2_BASE}/admin/v1/admin2.pmtiles`,
	aez: `${R2_BASE}/admin/v1/aez.pmtiles`
};

export const YIELD_FORECAST_BASE = `${DATA_BASE}/yield-forecast`;
export const YIELD_FORECAST_CATALOG_URL = `${YIELD_FORECAST_BASE}/catalog.json`;

export function yieldForecastGridUrl(runId, country, crop) {
	return `${YIELD_FORECAST_BASE}/runs/${runId}/grid/${country}/${crop}.json`;
}

export function yieldForecastDensityUrl(runId, country, crop) {
	return `${YIELD_FORECAST_BASE}/runs/${runId}/density/${country}/${crop}.json`;
}
