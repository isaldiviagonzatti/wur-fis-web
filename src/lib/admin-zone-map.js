/**
 * Paint the admin boundary tiles with per-unit values.
 *
 * The polygons come from the admin PMTiles that Map.svelte already loads, so
 * this only recolours them. Payload rows join to tile features on the GADM id
 * the tiles carry. Note GADM is internally inconsistent about that id's format
 * (Ghana uses `GHA1_2`, Kenya and Zimbabwe `KEN.1_1`), but both the tiles and
 * the zone lookups carry the same strings, so a plain match works.
 *
 * Callers pass a scale — how to read a zone's value and the stops and colours
 * to interpolate it over — so any page can colour units by its own quantity.
 * A published unit without a value is hatched rather than left blank, so blank
 * map keeps meaning "nothing published here".
 */
import { findCellIndex } from '$lib/cell-grid-map.js';

const GID_PROPERTY = { country: 'GID_0', admin1: 'GID_1', admin2: 'GID_2' };
const NO_SELECTION = '__none__';
const UNCOVERED_COLOR = 'rgba(0,0,0,0)';
const HATCH_OPACITY = 0.7;

export const isAdminLevel = (level) => level in GID_PROPERTY;
export const zoneIdProperty = (level) => GID_PROPERTY[level];

function selectedLayerId(level) {
	return `zone-${level}-selected`;
}

/**
 * Colour one level's fill layer from the zone rows.
 *
 * @param {object} map
 * @param {string} level
 * @param {Array<{gid: string}>} zones the published units; others are hidden
 * @param {number} opacity
 * @param {{value: (zone: object) => number | null, stops: number[], colors: string[]}} scale
 */
export function paintZones(map, level, zones, opacity, scale) {
	const layer = `${level}-fill`;
	if (!map || !map.getLayer(layer) || !isAdminLevel(level)) return;

	setHatchedZones(map, level, []);
	if (!zones?.length) {
		map.setPaintProperty(layer, 'fill-color', UNCOVERED_COLOR);
		setPublishedFilter(map, level, null);
		return;
	}
	// Draw only the units that carry a value. Otherwise a crop grown in one
	// country still outlines every province in all three, and clicking an empty
	// one silently does nothing.
	setPublishedFilter(map, level, zones.map((zone) => zone.gid));

	const valued = [];
	const missing = [];
	for (const zone of zones) {
		const value = scale.value(zone);
		if (Number.isFinite(value)) valued.push([zone.gid, value]);
		else missing.push(zone.gid);
	}
	setHatchedZones(map, level, missing);
	if (!valued.length) {
		map.setPaintProperty(layer, 'fill-color', UNCOVERED_COLOR);
		return;
	}
	const property = ['get', GID_PROPERTY[level]];
	const stops = scale.stops.flatMap((stop, index) => [stop, scale.colors[index]]);
	// Interpolate clamps outside the stops, so an extreme value takes the end
	// colour; units without a value never reach it and stay transparent.
	map.setPaintProperty(layer, 'fill-color', [
		'match',
		property,
		valued.map(([gid]) => gid),
		['interpolate', ['linear'], ['match', property, ...valued.flat(), 0], ...stops],
		UNCOVERED_COLOR
	]);
	map.setPaintProperty(layer, 'fill-opacity', opacity);
}

/** Hatch the given units with the site's no-data pattern, or none for []. */
function setHatchedZones(map, level, gids) {
	const layer = `${level}-hatch`;
	if (!map.getLayer(layer)) return;
	map.setPaintProperty(
		layer,
		'fill-opacity',
		gids.length ? ['match', ['get', GID_PROPERTY[level]], gids, HATCH_OPACITY, 0] : 0
	);
}

/**
 * Restrict a level's layers to the given ids, or show everything again when
 * passed null.
 */
function setPublishedFilter(map, level, gids) {
	const filter = gids ? ['in', ['get', GID_PROPERTY[level]], ['literal', gids]] : null;
	for (const suffix of ['fill', 'outline', 'hatch']) {
		const id = `${level}-${suffix}`;
		if (map.getLayer(id)) map.setFilter(id, filter);
	}
}

export function setZoneOpacity(map, level, opacity) {
	const layer = `${level}-fill`;
	if (!map || !map.getLayer(layer)) return;
	map.setPaintProperty(layer, 'fill-opacity', opacity);
}

/** A thin outline marking the clicked zone, one lazily-added layer per level. */
export function ensureZoneSelectedLayer(map, level) {
	if (!map || !isAdminLevel(level) || map.getLayer(selectedLayerId(level))) return;
	if (!map.getSource(level)) return;
	map.addLayer({
		id: selectedLayerId(level),
		type: 'line',
		source: level,
		'source-layer': level,
		filter: ['==', ['get', GID_PROPERTY[level]], NO_SELECTION],
		paint: {
			'line-color': '#1f2937',
			'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.2, 8, 2]
		}
	});
}

export function setSelectedZone(map, level, gid) {
	if (!map || !isAdminLevel(level)) return;
	ensureZoneSelectedLayer(map, level);
	const id = selectedLayerId(level);
	if (map.getLayer(id)) {
		map.setFilter(id, ['==', ['get', GID_PROPERTY[level]], gid ?? NO_SELECTION]);
	}
}

/**
 * Outline the selected zone at one level and clear the outline at every other.
 *
 * The outline layers are added here, not by Map.svelte, so switching level does
 * not hide them: without this, the unit picked at the previous level stays
 * outlined until something happens to repaint every level.
 */
export function showSelectedZoneOnly(map, level, gid) {
	if (!map) return;
	for (const other of Object.keys(GID_PROPERTY)) {
		if (other !== level && map.getLayer(selectedLayerId(other))) setSelectedZone(map, other, null);
	}
	setSelectedZone(map, level, gid);
}

function buildPopupContent({ title, meta, value }) {
	const root = document.createElement('div');
	root.className = 'info-card';
	const header = document.createElement('div');
	header.className = 'info-card__meta';
	const heading = document.createElement('p');
	heading.className = 'info-card__title';
	heading.textContent = title;
	header.append(heading);
	if (meta) {
		const line = document.createElement('p');
		line.className = 'info-card__subtitle';
		line.textContent = meta;
		header.append(line);
	}
	const body = document.createElement('div');
	body.className = 'info-card__body';
	const number = document.createElement('p');
	number.className = 'info-card__value';
	number.textContent = value;
	body.append(number);
	root.append(header, body);
	return root;
}

/**
 * A popup following the pointer over one level's polygons. Returns a teardown.
 *
 * `describe(gid)` returns `{ title, meta, value }`: the place, a line of what
 * and when, and the value itself, or null for a unit with nothing to say.
 * Styled by info-card.css, which the page must import.
 */
export function attachZoneHoverPopup(map, level, describe) {
	if (!map || !isAdminLevel(level)) return () => {};
	const layer = `${level}-fill`;
	let cancelled = false;
	let removeListeners = () => {};

	import('maplibre-gl').then(({ Popup }) => {
		if (cancelled) return;
		const popup = new Popup({
			closeButton: false,
			closeOnClick: false,
			closeOnMove: false,
			className: 'info-card-popup',
			offset: 14
		});
		const hide = () => popup.remove();
		const handleMove = (event) => {
			const gid = event.features?.[0]?.properties?.[GID_PROPERTY[level]];
			const content = gid ? describe(gid) : null;
			if (!content) {
				hide();
				return;
			}
			popup.setLngLat(event.lngLat).setDOMContent(buildPopupContent(content)).addTo(map);
		};
		map.on('mousemove', layer, handleMove);
		map.on('mouseleave', layer, hide);
		removeListeners = () => {
			map.off('mousemove', layer, handleMove);
			map.off('mouseleave', layer, hide);
			hide();
		};
	});

	return () => {
		cancelled = true;
		removeListeners();
	};
}

export function clearZoneLayers(map) {
	if (!map) return;
	for (const level of Object.keys(GID_PROPERTY)) {
		if (map.getLayer(`${level}-fill`)) {
			map.setPaintProperty(`${level}-fill`, 'fill-color', UNCOVERED_COLOR);
		}
		setHatchedZones(map, level, []);
		// Hand the boundaries back unfiltered: other views share these layers.
		setPublishedFilter(map, level, null);
		setSelectedZone(map, level, null);
	}
}

/**
 * The zone containing a point.
 *
 * Answered first from grid payloads, whose cells record their zone ids: asking
 * the rendered map instead needs the point on screen with its tiles drawn,
 * which is a race every time the level changes. Falls back to the rendered
 * polygons for a point inside a unit but on a cell no grid covers.
 *
 * @param {Array<{cells: Array<{lat: number, lon: number, zones: object}>}>} grids
 */
export function zoneAtPoint(map, level, point, grids) {
	for (const grid of grids) {
		const index = findCellIndex(grid.cells, point.lat, point.lon);
		const gid = grid.cells[index]?.zones?.[level];
		if (gid) return gid;
	}
	if (!map) return null;
	const pixel = map.project([point.lon, point.lat]);
	const hits = map.queryRenderedFeatures(pixel, { layers: [`${level}-fill`] });
	return hits?.[0]?.properties?.[GID_PROPERTY[level]] ?? null;
}

/** Wire click and hover on one level's polygons. Returns a teardown function. */
export function attachZoneInteractions(map, level, { onSelect }) {
	if (!map || !isAdminLevel(level)) return () => {};
	const layer = `${level}-fill`;

	const handleClick = (event) => {
		const gid = event.features?.[0]?.properties?.[GID_PROPERTY[level]];
		if (!gid) return;
		// The click point becomes the anchor, so switching level re-resolves to
		// whichever unit of the new level contains the same spot.
		onSelect?.(gid, event.lngLat);
	};
	const enter = () => (map.getCanvas().style.cursor = 'pointer');
	const leave = () => (map.getCanvas().style.cursor = '');

	map.on('click', layer, handleClick);
	map.on('mouseenter', layer, enter);
	map.on('mouseleave', layer, leave);
	return () => {
		map.off('click', layer, handleClick);
		map.off('mouseenter', layer, enter);
		map.off('mouseleave', layer, leave);
	};
}
