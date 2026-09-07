/**
 * Paint the admin boundary tiles with aggregated forecast values.
 *
 * The polygons come from the existing admin PMTiles that Map.svelte already
 * loads, so this only recolours them. Payload rows join to tile features on the
 * GADM id the tiles carry — verified present for every published zone at all
 * three levels. Note GADM is internally inconsistent about that id's format
 * (Ghana uses `GHA1_2`, Kenya and Zimbabwe `KEN.1_1`), but both the tiles and
 * the zone lookups carry the same strings, so a plain match works.
 */
import { PERCENTILE_COLORS, PERCENTILE_STOPS } from '$lib/yield-forecast.js';

const GID_PROPERTY = { country: 'GID_0', admin1: 'GID_1', admin2: 'GID_2' };
const NO_SELECTION = '__none__';
const UNCOVERED_COLOR = 'rgba(0,0,0,0)';

export const isAdminLevel = (level) => level in GID_PROPERTY;
export const zoneIdProperty = (level) => GID_PROPERTY[level];

function selectedLayerId(level) {
	return `yield-forecast-${level}-selected`;
}

/**
 * Colour one level's fill layer from the zone rows, leaving unpublished units
 * transparent so the map shows where there is no aggregate rather than
 * inventing one.
 */
export function paintZones(map, level, zones, opacity = 0.85) {
	const layer = `${level}-fill`;
	if (!map || !map.getLayer(layer) || !isAdminLevel(level)) return;

	if (!zones?.length) {
		map.setPaintProperty(layer, 'fill-color', UNCOVERED_COLOR);
		setPublishedFilter(map, level, null);
		return;
	}
	// Draw only the units that carry an aggregate. Otherwise a crop grown in one
	// country still outlines every province in all three, and clicking an empty
	// one silently does nothing.
	setPublishedFilter(map, level, zones.map((zone) => zone.gid));
	const stops = PERCENTILE_STOPS.flatMap((stop, index) => [stop, PERCENTILE_COLORS[index]]);
	const cases = zones.flatMap((zone) => [zone.gid, zone.percentile]);
	map.setPaintProperty(layer, 'fill-color', [
		'interpolate',
		['linear'],
		['match', ['get', GID_PROPERTY[level]], ...cases, -1],
		-1,
		UNCOVERED_COLOR,
		...stops
	]);
	map.setPaintProperty(layer, 'fill-opacity', opacity);
}

/**
 * Restrict a level's fill and outline to the given ids, or show everything again
 * when passed null.
 */
function setPublishedFilter(map, level, gids) {
	const filter = gids
		? ['in', ['get', GID_PROPERTY[level]], ['literal', gids]]
		: null;
	for (const suffix of ['fill', 'outline']) {
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

export function clearZoneLayers(map) {
	if (!map) return;
	for (const level of Object.keys(GID_PROPERTY)) {
		if (map.getLayer(`${level}-fill`)) {
			map.setPaintProperty(`${level}-fill`, 'fill-color', UNCOVERED_COLOR);
		}
		// Hand the boundaries back unfiltered: other views share these layers.
		setPublishedFilter(map, level, null);
		setSelectedZone(map, level, null);
	}
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
