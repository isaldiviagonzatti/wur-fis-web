/**
 * Place search via the Mapbox Geocoding API.
 *
 * Restricted to the three study countries so the results are always somewhere
 * the dashboard could have data. The token is a public (`pk.`) one, URL-locked
 * in the Mapbox account; the account carries no payment method, which is what
 * actually caps spend — usage notifications only send email, they never pause
 * the service.
 */
import { env } from '$env/dynamic/public';

const ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';
const COUNTRIES = 'gh,ke,zw';
const RESULT_LIMIT = 5;

export const isGeocodingAvailable = () => Boolean(env.PUBLIC_MAPBOX_TOKEN);

/**
 * Forward-geocode a place name.
 *
 * @param {string} query
 * @param {AbortSignal} [signal] so a superseded keystroke cancels its request
 * @returns {Promise<Array<{id: string, name: string, context: string, lat: number, lon: number}>>}
 */
export async function searchPlaces(query, signal) {
	const token = env.PUBLIC_MAPBOX_TOKEN;
	if (!token || !query.trim()) return [];

	const url = new URL(ENDPOINT);
	url.searchParams.set('q', query.trim());
	url.searchParams.set('country', COUNTRIES);
	url.searchParams.set('limit', String(RESULT_LIMIT));
	url.searchParams.set('access_token', token);

	const response = await fetch(url, { signal });
	if (!response.ok) throw new Error(`Place search failed (${response.status})`);
	const payload = await response.json();

	return (payload.features ?? [])
		.map((feature) => {
			const [lon, lat] = feature.geometry?.coordinates ?? [];
			const properties = feature.properties ?? {};
			return {
				id: feature.id ?? `${lat},${lon}`,
				name: properties.name ?? properties.full_address ?? query,
				context: properties.place_formatted ?? '',
				lat,
				lon
			};
		})
		.filter((result) => Number.isFinite(result.lat) && Number.isFinite(result.lon));
}
