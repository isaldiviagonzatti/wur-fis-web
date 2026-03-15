import { CALENDAR_OUTLINE_BASE, buildCalendarFillExpression, getAezFeatureExpression } from '$lib/calendar.js';

const AEZ_FILL_LAYER = 'aez-fill';
const AEZ_SELECTED_FILL_LAYER = 'aez-selected-fill';
const AEZ_OUTLINE_LAYER = 'aez-outline';

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
		map.setFilter(AEZ_SELECTED_FILL_LAYER, ['==', ['get', 'aez_name'], '__none__']);
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
