/**
 * Map configuration constants.
 * Basemap: Protomaps hosted API (light for light mode, dark for dark mode).
 */
import { env } from '$env/dynamic/public';

export const FALLBACK_STYLE_URLS = {
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

// Frames Ghana, Kenya and Zimbabwe together. Expressed as bounds rather than a
// centre and zoom: a fixed zoom is only correct for one container width, and at
// a narrower one Ghana drops off the western edge. MapLibre fits bounds to
// whatever size the map actually gets.
export const STUDY_AREA_VIEW = {
	bounds: [
		[-4.5, -23.5],
		[43.0, 12.5]
	],
	fitBoundsOptions: { padding: 24 }
};

export const MAP_DEFAULTS = {
	center: [20, 0], // centred on Africa
	// Deep enough to find a specific town. The forecast cells are 0.1 degrees, so
	// past ~10 a single cell fills much of the view; the basemap keeps its detail.
	maxZoom: 12,
	zoom: 1.5,
	minZoom: 1
};
