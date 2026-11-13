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

/**
 * Height classes of the map tools' MapFrame (the map and the legend under it;
 * the legend takes its room from the map). Below xl: 52% of the window, within
 * 340-620 px. On xl, beside the place card: the height the page matches to its
 * card (`mapHeight` on MapToolLayout, about 640 px before anything is clicked),
 * never taller than the window it stays in.
 */
export const TOOL_MAP_FRAME_HEIGHT =
	'h-[52vh] min-h-[340px] max-h-[620px] xl:h-[min(var(--map-match-height,640px),calc(100dvh_-_var(--header-height)_-_1.5rem))] xl:max-h-none';

// A section holding a line of text instead of a chart ("Not sown yet") would
// otherwise end the map a hand's width below its top.
const MIN_MATCHED_MAP_HEIGHT = 480;

/**
 * Where beside the place card (xl) a tool's map ends: at the bottom of the first
 * of `sections` (their heights, top to bottom, under the card's header) that ends
 * at least MIN_MATCHED_MAP_HEIGHT px down the card, else at the last. A CSS length
 * for MapToolLayout's `mapHeight`, or null until all are measured (a section of
 * height 0 is measured: it adds nothing).
 */
export function placeCardMapHeight(headerHeight, sections) {
	if (!headerHeight || !sections.length || sections.some((height) => height == null)) return null;
	let bottom = headerHeight;
	for (const height of sections) {
		bottom += height;
		if (bottom >= MIN_MATCHED_MAP_HEIGHT) break;
	}
	return `${bottom}px`;
}
