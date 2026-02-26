/**
 * Map configuration constants.
 * To switch basemap providers, change BASEMAP_STYLE_URL only.
 *
 * Current: OpenFreeMap (free, no API key, OSM-based)
 * Future:  PMTiles on R2 — replace with your R2 bucket URL + protomaps style
 */
export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export const MAP_DEFAULTS = {
	center: [20, 0],   // centred on Africa
	zoom: 1.5,
	minZoom: 0
};
