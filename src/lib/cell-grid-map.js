/**
 * MapLibre layers for a regular 0.1 degree grid drawn as GeoJSON squares.
 *
 * Model output per crop is a few thousand cells per country, so it ships as
 * plain coordinates and is drawn client-side rather than as a raster tile
 * pyramid. Pages own their cells through a layer prefix, so two views of the
 * grid never collide on source or layer ids, and colour their cells with any
 * MapLibre expression over the feature properties they set.
 *
 * Each feature carries a `uid` of `<country>:<index>`: an index is only unique
 * within its own country's payload, and one crop is drawn for every country
 * that has it.
 */
import { createNoDataPatternImage } from '$lib/no-data-pattern.js';

// The site-wide no-data hatch, so shading means the same thing here as on the
// admin layers and the crop calendars.
const NO_DATA_PATTERN_ID = 'fis-no-data-hatch';
const EMPTY_COLLECTION = { type: 'FeatureCollection', features: [] };
const NO_SELECTION = '__none__';
const HATCH_OPACITY = 0.7;

function ids(prefix) {
	return {
		source: `${prefix}-cells`,
		fill: `${prefix}-fill`,
		outline: `${prefix}-outline`,
		selected: `${prefix}-selected`,
		hatchSource: `${prefix}-no-data`,
		hatch: `${prefix}-no-data-fill`
	};
}

/**
 * Snap a coordinate to the centre of the cell containing it.
 *
 * The grid is a regular lattice with centres on x.x5, so the containing cell is
 * arithmetic — no spatial index or point-in-polygon test is needed.
 */
export function snapToCellCentre(value, resolution = 0.1) {
	const steps = Math.floor(value / resolution + 1e-9);
	return Number(((steps + 0.5) * resolution).toFixed(6));
}

export function cellSquare(lon, lat, half) {
	return {
		type: 'Polygon',
		coordinates: [
			[
				[lon - half, lat - half],
				[lon + half, lat - half],
				[lon + half, lat + half],
				[lon - half, lat + half],
				[lon - half, lat - half]
			]
		]
	};
}

/** Index of the cell centred at the snapped position of a point, or -1. */
export function findCellIndex(cells, lat, lon) {
	const cellLat = snapToCellCentre(lat);
	const cellLon = snapToCellCentre(lon);
	return cells.findIndex(
		(cell) => Math.abs(cell.lat - cellLat) < 1e-6 && Math.abs(cell.lon - cellLon) < 1e-6
	);
}

/**
 * Add the grid's source and layers once. Safe to call repeatedly.
 *
 * The hatch layer marks cells that exist but have nothing to show, drawn first
 * so coloured cells always sit on top of it.
 */
export function ensureCellLayers(map, prefix, fillColor) {
	const layer = ids(prefix);
	if (!map || map.getSource(layer.source)) return;

	if (!map.hasImage(NO_DATA_PATTERN_ID)) {
		map.addImage(NO_DATA_PATTERN_ID, createNoDataPatternImage());
	}

	map.addSource(layer.hatchSource, { type: 'geojson', data: EMPTY_COLLECTION, tolerance: 0 });
	map.addLayer({
		id: layer.hatch,
		type: 'fill',
		source: layer.hatchSource,
		paint: { 'fill-pattern': NO_DATA_PATTERN_ID, 'fill-opacity': HATCH_OPACITY }
	});

	map.addSource(layer.source, {
		type: 'geojson',
		data: EMPTY_COLLECTION,
		// MapLibre's default simplification collapses a 0.1 degree cell to nothing
		// below about zoom 2.5, so the layer silently vanishes at continental view.
		tolerance: 0
	});
	map.addLayer({
		id: layer.fill,
		type: 'fill',
		source: layer.source,
		paint: { 'fill-color': fillColor, 'fill-opacity': 0.85 }
	});
	map.addLayer({
		id: layer.outline,
		type: 'line',
		source: layer.source,
		paint: { 'line-color': 'rgba(0,0,0,0.12)', 'line-width': 0.3 }
	});
	map.addLayer({
		id: layer.selected,
		type: 'line',
		source: layer.source,
		filter: ['==', ['get', 'uid'], NO_SELECTION],
		paint: {
			'line-color': '#1f2937',
			'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.2, 8, 2]
		}
	});
}

/** Replace the drawn cells and the hatched cells. */
export function setCellFeatures(map, prefix, fillColor, features = [], hatchFeatures = []) {
	if (!map) return;
	ensureCellLayers(map, prefix, fillColor);
	const layer = ids(prefix);
	map.getSource(layer.source)?.setData({ type: 'FeatureCollection', features });
	map.getSource(layer.hatchSource)?.setData({ type: 'FeatureCollection', features: hatchFeatures });
}

export function setCellFillColor(map, prefix, fillColor) {
	const layer = ids(prefix);
	if (!map || !map.getLayer(layer.fill)) return;
	map.setPaintProperty(layer.fill, 'fill-color', fillColor);
}

export function setSelectedCellUid(map, prefix, uid) {
	const layer = ids(prefix);
	if (!map || !map.getLayer(layer.selected)) return;
	map.setFilter(layer.selected, ['==', ['get', 'uid'], uid ?? NO_SELECTION]);
}

/** Fill opacity of the cells, so the basemap underneath can be read. */
export function setCellOpacity(map, prefix, opacity) {
	const layer = ids(prefix);
	if (!map || !map.getLayer(layer.fill)) return;
	map.setPaintProperty(layer.fill, 'fill-opacity', opacity);
	map.setPaintProperty(layer.outline, 'line-opacity', opacity);
	map.setPaintProperty(layer.hatch, 'fill-opacity', opacity * HATCH_OPACITY);
}

export function setCellVisibility(map, prefix, visible) {
	if (!map) return;
	const layer = ids(prefix);
	for (const id of [layer.hatch, layer.fill, layer.outline, layer.selected]) {
		if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
	}
}

/**
 * Wire click and hover on the cells. Returns a teardown function.
 *
 * `onSelect` receives the clicked feature's properties.
 */
export function attachCellInteractions(map, prefix, { onSelect }) {
	if (!map) return () => {};
	const layer = ids(prefix);

	const handleClick = (event) => {
		const properties = event.features?.[0]?.properties;
		if (!properties?.uid) return;
		setSelectedCellUid(map, prefix, properties.uid);
		onSelect?.(properties);
	};
	const handleEnter = () => (map.getCanvas().style.cursor = 'pointer');
	const handleLeave = () => (map.getCanvas().style.cursor = '');

	map.on('click', layer.fill, handleClick);
	map.on('mouseenter', layer.fill, handleEnter);
	map.on('mouseleave', layer.fill, handleLeave);
	return () => {
		map.off('click', layer.fill, handleClick);
		map.off('mouseenter', layer.fill, handleEnter);
		map.off('mouseleave', layer.fill, handleLeave);
	};
}
