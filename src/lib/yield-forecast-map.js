/**
 * The yield forecast's grid layer: cells coloured by percentile or skill.
 *
 * Layer mechanics live in cell-grid-map.js; this module only decides what the
 * forecast cells carry and how they are coloured. Cells where the crop grows
 * but no forecast is published are hatched, so blank map means only "the crop
 * is not grown here".
 */
import {
	PERCENTILE_COLORS,
	PERCENTILE_STOPS,
	SKILL_COLORS,
	SKILL_STOPS,
	buildCellFeatures,
	buildNoForecastFeatures
} from '$lib/yield-forecast.js';
import {
	attachCellInteractions,
	setCellFeatures,
	setCellFillColor,
	setCellOpacity,
	setCellVisibility,
	setSelectedCellUid
} from '$lib/cell-grid-map.js';

const PREFIX = 'yield-forecast';

function buildFillColorExpression(mode = 'percentile') {
	if (mode === 'skill') {
		const stops = SKILL_STOPS.flatMap((stop, index) => [stop, SKILL_COLORS[index]]);
		return ['interpolate', ['linear'], ['coalesce', ['get', 'skill'], 0], ...stops];
	}
	const stops = PERCENTILE_STOPS.flatMap((stop, index) => [stop, PERCENTILE_COLORS[index]]);
	return ['interpolate', ['linear'], ['coalesce', ['get', 'percentile'], 50], ...stops];
}

export function setColorMode(map, mode) {
	setCellFillColor(map, PREFIX, buildFillColorExpression(mode));
}

/**
 * Replace the drawn cells with those of every supplied country.
 *
 * @param {object} map
 * @param {Array<{country: string, grid: object}>} entries
 */
export function setForecastCells(map, entries) {
	setCellFeatures(
		map,
		PREFIX,
		buildFillColorExpression(),
		(entries ?? []).flatMap(({ country, grid }) => buildCellFeatures(grid, country).features),
		(entries ?? []).flatMap(({ grid }) => buildNoForecastFeatures(grid).features)
	);
}

export function clearForecastCells(map) {
	setForecastCells(map, null);
	setSelectedCell(map, null);
}

export function setSelectedCell(map, uid) {
	setSelectedCellUid(map, PREFIX, uid);
}

export function setForecastOpacity(map, opacity) {
	setCellOpacity(map, PREFIX, opacity);
}

export function setForecastVisibility(map, visible) {
	setCellVisibility(map, PREFIX, visible);
}

export function attachForecastInteractions(map, { onSelect }) {
	return attachCellInteractions(map, PREFIX, {
		onSelect: ({ uid, country, index }) => onSelect?.({ uid, country, index })
	});
}
