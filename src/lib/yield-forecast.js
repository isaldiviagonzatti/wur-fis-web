/**
 * Yield forecast data access, colour scale and distribution helpers.
 *
 * Payloads are column-major (one array per field) to keep them small, so this
 * module decodes them once into row-oriented cells the map and chart can use.
 * Grid and density files for a crop share one cell order, so a clicked cell is
 * looked up by index in both.
 *
 * The map is coloured by percentile, not by percent anomaly: LPJmL's
 * interannual variability differs by an order of magnitude between these
 * countries, so a single percent scale would not be comparable across them.
 */
import {
	YIELD_FORECAST_CATALOG_URL,
	yieldForecastDensityUrl,
	yieldForecastGridUrl
} from '$lib/data-sources.js';

// ColorBrewer BrBG, colourblind-safe: brown below normal, teal above.
export const PERCENTILE_COLORS = [
	'#8c510a',
	'#bf812d',
	'#dfc27d',
	'#f6e8c3',
	'#f5f5f5',
	'#c7eae5',
	'#80cdc1',
	'#35978f',
	'#01665e'
];
export const PERCENTILE_STOPS = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
// One label per colour: the legend only renders labels when the counts match,
// and blanks keep every number aligned under its own swatch.
export const PERCENTILE_LEGEND_LABELS = ['0', '', '25', '', '50', '', '75', '', '100'];

// Sequential teal for CRPSS, which is only published where it is positive.
export const SKILL_COLORS = ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'];
export const SKILL_STOPS = [0, 0.25, 0.5, 0.75, 1];
export const SKILL_LEGEND_LABELS = ['0', '0.25', '0.5', '0.75', '1'];

export const FORECAST_COLOR = '#35978f';
export const HISTORICAL_COLOR = '#8c510a';

const cache = new Map();

async function fetchJson(url) {
	if (cache.has(url)) return cache.get(url);
	const request = fetch(url).then((response) => {
		if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
		return response.json();
	});
	cache.set(url, request);
	return request;
}

export function loadCatalog() {
	return fetchJson(YIELD_FORECAST_CATALOG_URL);
}

/**
 * Load one crop's map layer and decode the column-major payload into cells.
 */
export async function loadGrid(runId, country, crop) {
	const payload = await fetchJson(yieldForecastGridUrl(runId, country, crop));
	const columns = Object.fromEntries(
		payload.columns.map((name, index) => [name, payload.cells[index]])
	);
	const cells = columns.lat.map((lat, index) => ({
		index,
		lat,
		lon: columns.lon[index],
		percentile: columns.percentile[index],
		anomalyPct: columns.anomaly_pct[index],
		probBelow: columns.prob_below[index],
		probNear: columns.prob_near[index],
		probAbove: columns.prob_above[index],
		skill: columns.skill[index],
		histCvPct: columns.hist_cv_pct[index],
		areaHa: columns.area_ha[index]
	}));
	return { ...payload, cells };
}

export function loadDensity(runId, country, crop) {
	return fetchJson(yieldForecastDensityUrl(runId, country, crop));
}

/**
 * Invert the catalog into one entry per crop, listing the countries that have
 * it, so the crop selector can be the primary control and still say where each
 * crop is available for this initialization.
 */
export function buildCropIndex(catalog) {
	const crops = new Map();
	for (const [country, entry] of Object.entries(catalog?.countries ?? {})) {
		for (const crop of entry.crops ?? []) {
			if (!crops.has(crop.id)) {
				crops.set(crop.id, { id: crop.id, label: crop.label, countries: [] });
			}
			crops.get(crop.id).countries.push(country);
		}
	}
	return [...crops.values()].sort((left, right) => left.label.localeCompare(right.label));
}

const COUNTRY_TITLES = { ghana: 'Ghana', kenya: 'Kenya', zimbabwe: 'Zimbabwe' };

export function formatCountryList(countries) {
	return countries.map((country) => COUNTRY_TITLES[country] ?? country).join(', ');
}

/**
 * GeoJSON squares for a crop's cells, one per grid cell centre.
 *
 * `uid` combines country and index because the index is only unique within one
 * country's payload, and a crop is drawn for every country that has it.
 */
export function buildCellFeatures(grid, country = grid.country) {
	const half = (grid.resolution_deg ?? 0.1) / 2;
	return {
		type: 'FeatureCollection',
		features: grid.cells.map((cell) => ({
			type: 'Feature',
			properties: {
				uid: `${country}:${cell.index}`,
				country,
				index: cell.index,
				percentile: cell.percentile,
				skill: cell.skill
			},
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[cell.lon - half, cell.lat - half],
						[cell.lon + half, cell.lat - half],
						[cell.lon + half, cell.lat + half],
						[cell.lon - half, cell.lat + half],
						[cell.lon - half, cell.lat - half]
					]
				]
			}
		}))
	};
}

/**
 * Snap a coordinate to the centre of the 0.1 degree cell containing it.
 *
 * The forecast grid is a regular lattice with centres on x.x5, so the containing
 * cell is arithmetic — no spatial index or point-in-polygon test is needed.
 */
export function snapToCellCentre(value, resolution = 0.1) {
	const steps = Math.floor(value / resolution + 1e-9);
	return Number(((steps + 0.5) * resolution).toFixed(6));
}

/**
 * Gaussian kernel density estimate, for drawing a distribution as a curve.
 *
 * Silverman's rule sets the bandwidth. A degenerate sample (every value equal,
 * which happens where the ensemble fully agrees) has no width to smooth over
 * and returns nothing, so callers fall back to drawing the raw points.
 */
export function kernelDensity(values, gridPoints = 64, padding = 0.15) {
	const sample = values.filter((value) => Number.isFinite(value));
	if (sample.length < 2) return [];

	const min = Math.min(...sample);
	const max = Math.max(...sample);
	if (max === min) return [];

	const mean = sample.reduce((total, value) => total + value, 0) / sample.length;
	const variance =
		sample.reduce((total, value) => total + (value - mean) ** 2, 0) / (sample.length - 1);
	const sorted = [...sample].sort((left, right) => left - right);
	const quartile = (fraction) => {
		const position = (sorted.length - 1) * fraction;
		const lower = Math.floor(position);
		const upper = Math.ceil(position);
		return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
	};
	const spread = Math.min(
		Math.sqrt(variance),
		(quartile(0.75) - quartile(0.25)) / 1.349 || Math.sqrt(variance)
	);
	const bandwidth = 0.9 * spread * sample.length ** (-1 / 5);
	if (!(bandwidth > 0)) return [];

	const range = max - min;
	const start = min - range * padding;
	const end = max + range * padding;
	const step = (end - start) / (gridPoints - 1);
	const scale = 1 / (sample.length * bandwidth * Math.sqrt(2 * Math.PI));

	return Array.from({ length: gridPoints }, (_, index) => {
		const x = start + index * step;
		const density = sample.reduce(
			(total, value) => total + Math.exp(-0.5 * ((x - value) / bandwidth) ** 2),
			0
		);
		return { x, y: density * scale };
	});
}

export function quantile(values, fraction) {
	const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
	if (!sorted.length) return null;
	const position = (sorted.length - 1) * fraction;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function mean(values) {
	const sample = values.filter((value) => Number.isFinite(value));
	if (!sample.length) return null;
	return sample.reduce((total, value) => total + value, 0) / sample.length;
}

export function formatSigned(value, digits = 1) {
	if (!Number.isFinite(value)) return '—';
	return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
}

/**
 * Round the three tercile probabilities to integers that still sum to 100.
 *
 * Rounding each independently can show 26 / 75 / 0, which reads as a mistake.
 * Largest-remainder assigns the leftover unit to the value that lost most.
 */
export function formatTercileSplit(below, near, above) {
	const raw = [below, near, above];
	if (raw.some((value) => !Number.isFinite(value))) return ['—', '—', '—'];
	const floors = raw.map(Math.floor);
	let remaining = 100 - floors.reduce((total, value) => total + value, 0);
	const order = raw
		.map((value, index) => ({ index, remainder: value - floors[index] }))
		.sort((left, right) => right.remainder - left.remainder);
	const result = [...floors];
	for (const { index } of order) {
		if (remaining <= 0) break;
		result[index] += 1;
		remaining -= 1;
	}
	return result.map(String);
}

/**
 * Plain-language reading of a percentile, for the click panel.
 */
export function describePercentile(percentile) {
	if (!Number.isFinite(percentile)) return '';
	if (percentile >= 80) return 'well above the reference range';
	if (percentile >= 60) return 'above the reference median';
	if (percentile > 40) return 'near the reference median';
	if (percentile > 20) return 'below the reference median';
	return 'well below the reference range';
}
