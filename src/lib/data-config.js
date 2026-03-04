/**
 * R2 bucket base URL and data artifact paths.
 * Swap R2_BASE for the custom domain when one is configured.
 */
export const R2_BASE = 'https://pub-0a56875e3f4c46ad97b50538897150d9.r2.dev';

export const ADMIN_PMTILES_URLS = {
	country: `${R2_BASE}/admin/v1/country.pmtiles`,
	admin1: `${R2_BASE}/admin/v1/admin1.pmtiles`,
	admin2: `${R2_BASE}/admin/v1/admin2.pmtiles`
};
