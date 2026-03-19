/**
 * Map configuration constants.
 * Basemap: Protomaps hosted API (light for light mode, dark for dark mode).
 */
import { env } from '$env/dynamic/public';

const FALLBACK_STYLE_URLS = {
	light: 'https://tiles.openfreemap.org/styles/positron',
	dark: 'https://tiles.openfreemap.org/styles/dark'
};

function buildProtomapsStyleUrl(theme) {
	if (!env.PUBLIC_PROTOMAPS_KEY) {
		return theme === 'dark' ? FALLBACK_STYLE_URLS.dark : FALLBACK_STYLE_URLS.light;
	}

	const url = new URL(`https://api.protomaps.com/styles/v5/${theme}/en.json`);
	url.searchParams.set('key', env.PUBLIC_PROTOMAPS_KEY);
	return url.toString();
}

export const BASEMAP_STYLE_URLS = {
	light: buildProtomapsStyleUrl('white'),
	dark: buildProtomapsStyleUrl('dark')
};

export const MAP_DEFAULTS = {
	center: [20, 0],   // centred on Africa
	maxZoom: 6,
	zoom: 1.5,
	minZoom: 1
};
