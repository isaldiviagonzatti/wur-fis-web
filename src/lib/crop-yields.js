/**
 * Historical crop yields: data access, map variables, colour scales and chart
 * colours for the crop-yields page.
 *
 * Reported statistics come from HarvestStat (admin 1, summed to country) and
 * FAO (country). The model is LPJmL forced with ERA5-Land, and only its
 * standardised anomalies are published: its absolute yields diverge from the
 * statistics by design. Every anomaly is the detrended value divided by its
 * own standard deviation, so model and statistics share one unitless scale.
 *
 * Zone and grid payloads align every series to the catalog's years, so a year
 * is an index shared by the map, the slider and the charts.
 */
import {
	CROP_YIELDS_CATALOG_URL,
	cropYieldsCropMixUrl,
	cropYieldsGridUrl,
	cropYieldsLanduseUrl,
	cropYieldsZonesUrl
} from '$lib/data-sources.js';
import { cellSquare } from '$lib/cell-grid-map.js';
import { fetchJson } from '$lib/fetch-json.js';
import { PERCENTILE_COLORS } from '$lib/yield-forecast.js';

export const SOURCE_LABELS = {
	model: 'LPJmL model',
	harveststat: 'HarvestStat',
	fao: 'FAOSTAT'
};

/**
 * What the map can show. `levels` lists where it exists: the statistics have no
 * grid, and agreement is one number per unit for the whole period.
 */
export const VARIABLES = {
	yield: {
		label: 'Reported yield',
		kind: 'reported',
		field: 'yield',
		unit: 't/ha',
		levels: ['admin1', 'country']
	},
	area: {
		label: 'Harvested area',
		kind: 'reported',
		field: 'area',
		unit: 'ha',
		levels: ['admin1', 'country']
	},
	production: {
		label: 'Production',
		kind: 'reported',
		field: 'production',
		unit: 't',
		levels: ['admin1', 'country']
	},
	reported_anomaly: {
		label: 'Reported yield anomaly',
		kind: 'anomaly',
		source: 'reported',
		levels: ['admin1', 'country']
	},
	model_anomaly: {
		label: 'Model yield anomaly',
		kind: 'anomaly',
		source: 'model',
		levels: ['grid', 'admin1', 'country']
	},
	agreement: {
		label: 'Model–reported agreement',
		kind: 'agreement',
		levels: ['admin1', 'country']
	}
};

export const VARIABLE_OPTIONS = Object.entries(VARIABLES).map(([value, { label }]) => ({
	value,
	label
}));

export const LEVEL_LABELS = { grid: 'Grid cells', admin1: 'Admin 1', country: 'Country' };

// Brown below the trend, teal above: the forecast's percentile scale, so the
// same colour means "worse than usual" on both pages.
export const ANOMALY_COLORS = PERCENTILE_COLORS;
export const ANOMALY_STOPS = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
export const ANOMALY_LEGEND_LABELS = ['−2', '', '−1', '', '0', '', '+1', '', '+2'];

// ColorBrewer PRGn: purple where model and statistics move in opposite
// directions, green where they move together. Kept apart from the anomaly
// scale's brown-teal so the two are never read as one quantity.
export const AGREEMENT_COLORS = [
	'#762a83',
	'#9970ab',
	'#c2a5cf',
	'#e7d4e8',
	'#f7f7f7',
	'#d9f0d3',
	'#a6dba0',
	'#5aae61',
	'#1b7837'
];
export const AGREEMENT_STOPS = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
export const AGREEMENT_LEGEND_LABELS = ['−1', '', '−0.5', '', '0', '', '0.5', '', '1'];

// One sequential hue per reported quantity, so switching variable visibly
// changes what the colours mean (ColorBrewer YlGn, Blues, Purples).
const SEQUENTIAL_COLORS = {
	yield: ['#ffffcc', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#005a32'],
	area: ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'],
	production: ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#4a1486']
};

// fis-style's qualitative palette (Paul Tol muted), as on the forecast page:
// the model in rose, the reference statistics in indigo. FAO takes green, sand
// on the dark background where green loses contrast; both pass the colourblind
// separation check against the other two.
const SERIES_COLORS = {
	light: { model: '#CC6677', harveststat: '#332288', fao: '#117733' },
	dark: { model: '#CC6677', harveststat: '#88CCEE', fao: '#DDCC77' }
};

export function seriesColors(dark) {
	return SERIES_COLORS[dark ? 'dark' : 'light'];
}

export function loadCatalog() {
	return fetchJson(CROP_YIELDS_CATALOG_URL);
}

export function loadZones(level, crop) {
	return fetchJson(cropYieldsZonesUrl(level, crop));
}

export function loadLanduse(country) {
	return fetchJson(cropYieldsLanduseUrl(country));
}

export function loadCropMix(level) {
	return fetchJson(cropYieldsCropMixUrl(level));
}

/** One country's grid for a crop, decoded into cells; anomalies stay year-major. */
export async function loadGrid(country, crop) {
	const payload = await fetchJson(cropYieldsGridUrl(country, crop));
	const [lat, lon, area] = payload.cells;
	const zoneOf = (level, index) => {
		const zone = payload.zones?.[level];
		const position = zone?.cells[index] ?? -1;
		return position >= 0 ? zone.ids[position] : null;
	};
	const cells = lat.map((cellLat, index) => ({
		index,
		lat: cellLat,
		lon: lon[index],
		areaHa: area[index],
		zones: { country: zoneOf('country', index), admin1: zoneOf('admin1', index) }
	}));
	return { ...payload, cells };
}

/**
 * The statistic a unit is compared against: HarvestStat for admin-1 units, FAO
 * for countries, falling back to summed HarvestStat for a single season, which
 * FAO does not report.
 */
export function reportedSource(level, zone) {
	if (level === 'country' && zone?.series?.fao) return 'fao';
	return 'harveststat';
}

/** A unit's value for a variable in one year (index into the payload's years). */
export function zoneValue(level, zone, variable, yearIndex) {
	const spec = VARIABLES[variable];
	const source = reportedSource(level, zone);
	if (spec.kind === 'reported') return zone.series[source]?.[spec.field]?.[yearIndex] ?? null;
	if (spec.kind === 'agreement') return zone.agreement?.[`model_vs_${source}`]?.r ?? null;
	const series = spec.source === 'model' ? zone.series.model : zone.series[source];
	return series?.anomaly?.[yearIndex] ?? null;
}

/**
 * Units the variable exists for at all. A unit in this list without a value
 * for the chosen year is hatched; a unit outside it is not drawn.
 */
export function zonesWithVariable(level, zones, variable) {
	const spec = VARIABLES[variable];
	return zones.filter((zone) => {
		if (spec.kind === 'anomaly' && spec.source === 'model') return Boolean(zone.series.model);
		if (spec.kind === 'agreement') return zoneValue(level, zone, variable, 0) !== null;
		return Boolean(zone.series[reportedSource(level, zone)]);
	});
}

/**
 * The year the map opens on, as an index, or -1 when nothing has data.
 *
 * The latest year that every shown country with this variable reports, so the
 * first view is not one country coloured and the rest hatched because their
 * statistics end earlier. Countries whose records never overlap fall back to
 * the latest year any unit reports. Agreement has no year of its own, so the
 * panel below the map opens on the latest reported yield instead.
 */
export function latestYearIndex(level, zones, variable, nYears) {
	const yearly = VARIABLES[variable].kind === 'agreement' ? 'yield' : variable;
	const hasValue = (zone, index) => Number.isFinite(zoneValue(level, zone, yearly, index));
	const countries = [...new Set(zones.map((zone) => zone.country))];
	for (let index = nYears - 1; index >= 0; index -= 1) {
		const reporting = countries.filter((country) =>
			zones.some((zone) => zone.country === country && hasValue(zone, index))
		);
		if (reporting.length && reporting.length === countries.length) return index;
	}
	for (let index = nYears - 1; index >= 0; index -= 1) {
		if (zones.some((zone) => hasValue(zone, index))) return index;
	}
	return -1;
}

function quantile(sorted, fraction) {
	const position = (sorted.length - 1) * fraction;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/** Round to two significant digits, so legend stops read as plain numbers. */
function roundStop(value) {
	if (value === 0) return 0;
	const magnitude = 10 ** (Math.floor(Math.log10(Math.abs(value))) - 1);
	return Math.round(value / magnitude) * magnitude;
}

/**
 * Stops at quantiles of every value the units take over all years.
 *
 * Over all years rather than the shown one, so the legend stays put while the
 * year slider moves and a colour means the same amount in every year.
 */
function sequentialStops(values, count) {
	const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
	if (!sorted.length) return null;
	const stops = [];
	for (let step = 0; step < count; step += 1) {
		const value = roundStop(quantile(sorted, step / (count - 1)));
		// Interpolation needs strictly increasing stops.
		stops.push(step && value <= stops[step - 1] ? stops[step - 1] * 1.001 + 1e-9 : value);
	}
	return stops;
}

/**
 * How to colour units for a variable: the value reader, stops, colours and
 * legend labels. `zones` are the shown units; their full series set the
 * sequential stops.
 */
export function buildScale(level, zones, variable, yearIndex, nYears) {
	const spec = VARIABLES[variable];
	const value = (zone) => zoneValue(level, zone, variable, yearIndex);
	if (spec.kind === 'anomaly') {
		return { value, stops: ANOMALY_STOPS, colors: ANOMALY_COLORS, labels: ANOMALY_LEGEND_LABELS };
	}
	if (spec.kind === 'agreement') {
		return {
			value,
			stops: AGREEMENT_STOPS,
			colors: AGREEMENT_COLORS,
			labels: AGREEMENT_LEGEND_LABELS
		};
	}
	const colors = SEQUENTIAL_COLORS[variable];
	const all = zones.flatMap((zone) =>
		Array.from({ length: nYears }, (_, index) => zoneValue(level, zone, variable, index))
	);
	const stops = sequentialStops(all, colors.length);
	if (!stops) return null;
	return {
		value,
		stops,
		colors,
		labels: stops.map((stop, index) => (index % 2 === 0 ? formatCompact(stop) : ''))
	};
}

/** GeoJSON squares for one country's cells, carrying the year's anomaly. */
export function buildAnomalyCellFeatures(grid, yearIndex) {
	const half = (grid.resolution_deg ?? 0.1) / 2;
	const values = grid.anomaly[yearIndex] ?? [];
	return grid.cells.map((cell) => ({
		type: 'Feature',
		properties: {
			uid: `${grid.country}:${cell.index}`,
			country: grid.country,
			index: cell.index,
			value: values[cell.index]
		},
		geometry: cellSquare(cell.lon, cell.lat, half)
	}));
}

export function anomalyFillExpression() {
	const stops = ANOMALY_STOPS.flatMap((stop, index) => [stop, ANOMALY_COLORS[index]]);
	return ['interpolate', ['linear'], ['coalesce', ['get', 'value'], 0], ...stops];
}

// The validation's minimum overlap for a correlation to be reported, and the
// overlap below which its figures mark one for caution.
export const MIN_AGREEMENT_YEARS = 10;
export const CAUTION_AGREEMENT_YEARS = 20;

// HarvestStat country totals are published only for years whose reporting
// regions hold this share of the crop's area (MIN_COUNTRY_COVERAGE in
// lpjml-analysis run_crop_yield_history.py); quoted in the panel and the guide.
export const MIN_COUNTRY_COVERAGE = 0.75;

/** "13 years", flagged when too few to read much into. */
export function describeOverlap(years) {
	return years < CAUTION_AGREEMENT_YEARS ? `${years} years, read with caution` : `${years} years`;
}

/**
 * Pearson correlation over the years both series have, or null below the
 * minimum overlap. Used for a grid cell against its province, which no
 * published table covers.
 */
export function correlation(left, right, minYears = MIN_AGREEMENT_YEARS) {
	const pairs = left
		.map((value, index) => [value, right[index]])
		.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
	if (pairs.length < minYears) return null;
	const meanOf = (values) => values.reduce((total, value) => total + value, 0) / values.length;
	const meanLeft = meanOf(pairs.map(([a]) => a));
	const meanRight = meanOf(pairs.map(([, b]) => b));
	let covariance = 0;
	let varianceLeft = 0;
	let varianceRight = 0;
	for (const [a, b] of pairs) {
		covariance += (a - meanLeft) * (b - meanRight);
		varianceLeft += (a - meanLeft) ** 2;
		varianceRight += (b - meanRight) ** 2;
	}
	if (!(varianceLeft > 0 && varianceRight > 0)) return null;
	return { r: covariance / Math.sqrt(varianceLeft * varianceRight), n: pairs.length };
}

/** 1234 as "1.2k", 2500000 as "2.5M"; small values keep two significant digits. */
export function formatCompact(value) {
	if (!Number.isFinite(value)) return '—';
	const size = Math.abs(value);
	if (size >= 1e6) return `${trim(value / 1e6)}M`;
	if (size >= 1e3) return `${trim(value / 1e3)}k`;
	if (size >= 10) return String(Math.round(value));
	return trim(value);
}

function trim(value) {
	const size = Math.abs(value);
	const digits = size >= 100 ? 0 : size >= 10 ? 1 : 2;
	return String(Number(value.toFixed(digits)));
}

/** A variable's value with its unit, for the panel and tooltips. */
export function formatVariableValue(variable, value) {
	if (!Number.isFinite(value)) return '—';
	const spec = VARIABLES[variable];
	if (spec.kind === 'agreement') return `r = ${value.toFixed(2)}`;
	if (spec.kind === 'anomaly') return `${value > 0 ? '+' : ''}${value.toFixed(1)} SD`;
	return `${formatCompact(value)} ${spec.unit}`;
}
