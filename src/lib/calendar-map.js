import { CALENDAR_OUTLINE_BASE, buildCalendarFillExpression, getAezFeatureExpression } from '$lib/calendar.js';

const AEZ_FILL_LAYER = 'aez-fill';
const AEZ_SELECTED_FILL_LAYER = 'aez-selected-fill';
const AEZ_OUTLINE_LAYER = 'aez-outline';
const EMPTY_AEZ_FILTER = ['==', ['get', 'aez_name'], '__none__'];

export function updateCalendarAezFill(map, { calendarData, crop, season, dataset, selectedAezKey }) {
	if (!map) return;

	const colorExpr = buildCalendarFillExpression(calendarData, crop, season, dataset);

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

export function resetObservedAezFill(map) {
	if (!map) return;

	if (map.getLayer(AEZ_FILL_LAYER)) {
		map.setPaintProperty(AEZ_FILL_LAYER, 'fill-color', '#4a90d9');
		map.setPaintProperty(AEZ_FILL_LAYER, 'fill-opacity', 0.15);
	}

	if (map.getLayer(AEZ_SELECTED_FILL_LAYER)) {
		map.setPaintProperty(AEZ_SELECTED_FILL_LAYER, 'fill-opacity', 0);
		map.setFilter(AEZ_SELECTED_FILL_LAYER, EMPTY_AEZ_FILTER);
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
