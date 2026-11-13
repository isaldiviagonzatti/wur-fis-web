import {
	CALENDAR_OUTLINE_BASE,
	buildCalendarFillExpression,
	buildCalendarNoDataOpacityExpression,
	getAezFeatureExpression,
	getAezFeatureKey
} from '$lib/calendar.js';
import { showView } from '$lib/map-camera.js';

const AEZ_SOURCE = 'aez';
const AEZ_FIT_OPTIONS = { padding: 40, maxZoom: 9, duration: 900 };
const AEZ_HATCH_LAYER = 'aez-hatch';
const AEZ_FILL_LAYER = 'aez-fill';
const AEZ_SELECTED_FILL_LAYER = 'aez-selected-fill';
const AEZ_OUTLINE_LAYER = 'aez-outline';

export function updateCalendarAezFill(map, { calendarData, crop, season, dataset, selectedAezKey }) {
	if (!map) return;

	const colorExpr = buildCalendarFillExpression(calendarData, crop, season, dataset);
	const noDataOpacityExpr = buildCalendarNoDataOpacityExpression(calendarData, crop, season, dataset);

	if (map.getLayer(AEZ_HATCH_LAYER)) {
		map.setPaintProperty(AEZ_HATCH_LAYER, 'fill-opacity', noDataOpacityExpr);
	}

	if (map.getLayer(AEZ_FILL_LAYER)) {
		map.setPaintProperty(AEZ_FILL_LAYER, 'fill-color', colorExpr);
		map.setPaintProperty(
			AEZ_FILL_LAYER,
			'fill-opacity',
			selectedAezKey ? 0.4 : crop && season ? 0.88 : 0.7
		);
	}

	if (map.getLayer(AEZ_SELECTED_FILL_LAYER)) {
		map.setPaintProperty(AEZ_SELECTED_FILL_LAYER, 'fill-color', colorExpr);
		map.setPaintProperty(AEZ_SELECTED_FILL_LAYER, 'fill-opacity', selectedAezKey ? 1 : 0);
		map.setFilter(
			AEZ_SELECTED_FILL_LAYER,
			['==', getAezFeatureExpression(), selectedAezKey || '__none__']
		);
	}
}

export function updateAezOutline(map, { isCalendarDataset, selectedAezKey }) {
	if (!map || !map.getLayer(AEZ_OUTLINE_LAYER)) return;

	if (!isCalendarDataset) {
		map.setPaintProperty(AEZ_OUTLINE_LAYER, 'line-color', '#2c5f8a');
		map.setPaintProperty(AEZ_OUTLINE_LAYER, 'line-width', 1);
		map.setPaintProperty(AEZ_OUTLINE_LAYER, 'line-opacity', 1);
		return;
	}

	map.setPaintProperty(AEZ_OUTLINE_LAYER, 'line-color', CALENDAR_OUTLINE_BASE);
	map.setPaintProperty(AEZ_OUTLINE_LAYER, 'line-width', 0.65);
	map.setPaintProperty(AEZ_OUTLINE_LAYER, 'line-opacity', selectedAezKey ? 0.35 : 0.55);
}

/** Grow `box` ([[west, south], [east, north]], or undefined) to take in a GeoJSON geometry's coordinates. */
function extendBox(box, coordinates) {
	if (typeof coordinates[0] !== 'number') {
		return coordinates.reduce(extendBox, box);
	}
	const [lon, lat] = coordinates;
	if (!box) return [[lon, lat], [lon, lat]];
	const [[west, south], [east, north]] = box;
	return [
		[Math.min(west, lon), Math.min(south, lat)],
		[Math.max(east, lon), Math.max(north, lat)]
	];
}

/**
 * Keep `known` (a Map of zone key to outline box) filled with every zone wholly
 * in view each time the map settles: its tiles are then all loaded, so the box
 * is whole. The map opens on all three countries, so after the first settle
 * every zone is known and zoomToAez flies to any of them in one move. Zones
 * already known are skipped, so later settles cost next to nothing. Returns a
 * function that stops tracking.
 */
export function trackAezBounds(map, known) {
	const collect = () => {
		if (!map.getSource(AEZ_SOURCE) || !map.areTilesLoaded()) return;
		const boxes = new Map();
		for (const feature of map.querySourceFeatures(AEZ_SOURCE, { sourceLayer: AEZ_SOURCE })) {
			const { country, aez_name: aezName } = feature.properties ?? {};
			const key = getAezFeatureKey(country, aezName);
			if (!country || !aezName || known.has(key)) continue;
			boxes.set(key, extendBox(boxes.get(key), feature.geometry.coordinates));
		}
		const inView = map.getBounds();
		for (const [key, box] of boxes) {
			if (box.every((corner) => inView.contains(corner))) known.set(key, box);
		}
	};
	collect();
	map.on('idle', collect);
	return () => map.off('idle', collect);
}

/**
 * Fit the camera to one zone, in one move when its outline box is in `known`
 * (trackAezBounds). Before that, the camera first shows the zone's country
 * (`countryView`) and fits once the tracker has read the zone there. Returns a
 * function that cancels a fit still waiting.
 */
export function zoomToAez(map, known, { country, aezName, countryView }) {
	const key = getAezFeatureKey(country, aezName);
	const fit = () => {
		if (known.has(key)) map.fitBounds(known.get(key), AEZ_FIT_OPTIONS);
	};
	if (known.has(key)) {
		fit();
		return () => {};
	}
	showView(map, countryView);
	// The tracker's own 'idle' listener runs before this one-time one.
	map.once('idle', fit);
	return () => map.off('idle', fit);
}

export function getAezFeatureAtPoint(map, point) {
	if (!map) return null;
	const [feature] = map.queryRenderedFeatures(point, {
		layers: [AEZ_SELECTED_FILL_LAYER, AEZ_FILL_LAYER]
	});
	return feature ?? null;
}

export function readAezFeature(feature) {
	const props = feature?.properties ?? {};
	const aezName = props.aez_name;
	const country = props.country;
	if (!country || !aezName) return null;
	return { country, aezName };
}

export function bindAezSelection(map, onSelect) {
	if (!map) return () => {};

	const handleClick = (event) => {
		onSelect(readAezFeature(getAezFeatureAtPoint(map, event.point)));
	};

	map.on('click', handleClick);
	map.getCanvas().style.cursor = '';

	return () => {
		map.off('click', handleClick);
		map.getCanvas().style.cursor = '';
	};
}

export function attachCalendarHoverPopup(map, buildPopupContent) {
	if (!map) return () => {};

	let cancelled = false;
	let popup = null;
	let removeListeners = () => {};

	import('maplibre-gl').then(({ Popup }) => {
		if (cancelled) return;

		popup = new Popup({
			closeButton: false,
			closeOnClick: false,
			closeOnMove: false,
			className: 'calendar-map-popup',
			offset: 14
		});

		const hidePopup = () => {
			map.getCanvas().style.cursor = '';
			popup?.remove();
		};

		const handleMove = (event) => {
			const match = readAezFeature(getAezFeatureAtPoint(map, event.point));
			if (!match) {
				hidePopup();
				return;
			}

			map.getCanvas().style.cursor = 'pointer';
			popup.setLngLat(event.lngLat).setDOMContent(buildPopupContent(match)).addTo(map);
		};

		map.on('mousemove', handleMove);
		map.on('mouseout', hidePopup);
		removeListeners = () => {
			map.off('mousemove', handleMove);
			map.off('mouseout', hidePopup);
			hidePopup();
		};
	});

	return () => {
		cancelled = true;
		removeListeners();
	};
}
