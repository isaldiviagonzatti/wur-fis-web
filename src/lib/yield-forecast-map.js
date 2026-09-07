/**
 * MapLibre layer management for the yield forecast grid.
 *
 * The forecast is a regular 0.1 degree lattice of a few thousand cells per
 * country, so it is drawn as GeoJSON squares coloured by percentile rather than
 * as a raster tile pyramid — the whole layer for one crop is a few tens of kB.
 *
 * A crop is shown for every country that has it, so cells from several
 * countries share one source. Each feature carries a `uid` of
 * `<country>:<index>` because the cell index is only unique within its own
 * country's payload.
 */
import {
	PERCENTILE_COLORS,
	PERCENTILE_STOPS,
	SKILL_COLORS,
	SKILL_STOPS,
	buildCellFeatures
} from '$lib/yield-forecast.js';

export const FORECAST_SOURCE = 'yield-forecast-cells';
export const FORECAST_FILL_LAYER = 'yield-forecast-fill';
export const FORECAST_OUTLINE_LAYER = 'yield-forecast-outline';
export const FORECAST_SELECTED_LAYER = 'yield-forecast-selected';

const EMPTY_COLLECTION = { type: 'FeatureCollection', features: [] };
const NO_SELECTION = '__none__';

function buildFillColorExpression(mode = 'percentile') {
	if (mode === 'skill') {
		const stops = SKILL_STOPS.flatMap((stop, index) => [stop, SKILL_COLORS[index]]);
		return ['interpolate', ['linear'], ['coalesce', ['get', 'skill'], 0], ...stops];
	}
	const stops = PERCENTILE_STOPS.flatMap((stop, index) => [stop, PERCENTILE_COLORS[index]]);
	return ['interpolate', ['linear'], ['coalesce', ['get', 'percentile'], 50], ...stops];
}

export function setColorMode(map, mode) {
	if (!map || !map.getLayer(FORECAST_FILL_LAYER)) return;
	map.setPaintProperty(FORECAST_FILL_LAYER, 'fill-color', buildFillColorExpression(mode));
}

/**
 * Add the forecast source and layers once. Safe to call repeatedly.
 */
export function ensureForecastLayers(map) {
	if (!map || map.getSource(FORECAST_SOURCE)) return;

	map.addSource(FORECAST_SOURCE, {
		type: 'geojson',
		data: EMPTY_COLLECTION,
		// MapLibre's default simplification collapses a 0.1 degree cell to nothing
		// below about zoom 2.5, so the layer silently vanishes at continental view.
		tolerance: 0
	});

	map.addLayer({
		id: FORECAST_FILL_LAYER,
		type: 'fill',
		source: FORECAST_SOURCE,
		paint: { 'fill-color': buildFillColorExpression(), 'fill-opacity': 0.85 }
	});

	map.addLayer({
		id: FORECAST_OUTLINE_LAYER,
		type: 'line',
		source: FORECAST_SOURCE,
		paint: { 'line-color': 'rgba(0,0,0,0.12)', 'line-width': 0.3 }
	});

	map.addLayer({
		id: FORECAST_SELECTED_LAYER,
		type: 'line',
		source: FORECAST_SOURCE,
		filter: ['==', ['get', 'uid'], NO_SELECTION],
		paint: { 'line-color': '#111827', 'line-width': 2 }
	});
}

/**
 * Replace the drawn cells with those of every supplied country.
 *
 * @param {object} map
 * @param {Array<{country: string, grid: object}>} entries
 */
export function setForecastCells(map, entries) {
	if (!map) return;
	ensureForecastLayers(map);
	const source = map.getSource(FORECAST_SOURCE);
	if (!source) return;

	if (!entries?.length) {
		source.setData(EMPTY_COLLECTION);
		return;
	}
	source.setData({
		type: 'FeatureCollection',
		features: entries.flatMap(({ country, grid }) => buildCellFeatures(grid, country).features)
	});
}

export function clearForecastCells(map) {
	setForecastCells(map, null);
	setSelectedCell(map, null);
}

export function setSelectedCell(map, uid) {
	if (!map || !map.getLayer(FORECAST_SELECTED_LAYER)) return;
	map.setFilter(FORECAST_SELECTED_LAYER, ['==', ['get', 'uid'], uid ?? NO_SELECTION]);
}

/** Fill opacity of the forecast cells, so the basemap underneath can be read. */
export function setForecastOpacity(map, opacity) {
	if (!map || !map.getLayer(FORECAST_FILL_LAYER)) return;
	map.setPaintProperty(FORECAST_FILL_LAYER, 'fill-opacity', opacity);
	if (map.getLayer(FORECAST_OUTLINE_LAYER)) {
		map.setPaintProperty(FORECAST_OUTLINE_LAYER, 'line-opacity', opacity);
	}
}

export function setForecastVisibility(map, visible) {
	if (!map) return;
	for (const layerId of [FORECAST_FILL_LAYER, FORECAST_OUTLINE_LAYER, FORECAST_SELECTED_LAYER]) {
		if (map.getLayer(layerId)) {
			map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
		}
	}
}

/**
 * Wire click and hover on the forecast cells. Returns a teardown function.
 */
export function attachForecastInteractions(map, { onSelect }) {
	if (!map) return () => {};

	const handleClick = (event) => {
		const feature = event.features?.[0];
		if (!feature) return;
		const { uid, country, index } = feature.properties ?? {};
		if (!uid) return;
		setSelectedCell(map, uid);
		onSelect?.({ uid, country, index });
	};
	const handleEnter = () => {
		map.getCanvas().style.cursor = 'pointer';
	};
	const handleLeave = () => {
		map.getCanvas().style.cursor = '';
	};

	map.on('click', FORECAST_FILL_LAYER, handleClick);
	map.on('mouseenter', FORECAST_FILL_LAYER, handleEnter);
	map.on('mouseleave', FORECAST_FILL_LAYER, handleLeave);

	return () => {
		map.off('click', FORECAST_FILL_LAYER, handleClick);
		map.off('mouseenter', FORECAST_FILL_LAYER, handleEnter);
		map.off('mouseleave', FORECAST_FILL_LAYER, handleLeave);
	};
}
