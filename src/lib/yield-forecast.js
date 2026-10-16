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
	yieldForecastAdminUrl,
	yieldForecastDensityUrl,
	yieldForecastGridUrl,
	yieldForecastNowcastAdminUrl,
	yieldForecastNowcastGridUrl,
	yieldForecastRunUrl
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

// Chart series in fis-style's qualitative palette (Paul Tol muted), kept clear
// of the map's brown-teal scale so no line reads as "below" or "above normal".
// Indigo vanishes on the dark background, so cyan stands in for it there.
const CHART_COLORS = {
	light: { forecast: '#CC6677', reference: '#332288' },
	dark: { forecast: '#CC6677', reference: '#88CCEE' }
};

export function chartColors(dark) {
	return CHART_COLORS[dark ? 'dark' : 'light'];
}

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

/** An older month's run.json, shaped like the catalog's `countries` and `admin_levels`. */
export function loadRunDescription(runId) {
	return fetchJson(yieldForecastRunUrl(runId));
}

/**
 * Load one crop's map layer and decode the column-major payload into cells.
 */
export async function loadGrid(runId, country, crop) {
	const payload = await fetchJson(yieldForecastGridUrl(runId, country, crop));
	const columns = Object.fromEntries(
		payload.columns.map((name, index) => [name, payload.cells[index]])
	);
	// Zone membership per cell, shipped de-duplicated as a list plus indices.
	const zoneOf = (level, index) => {
		const zone = payload.zones?.[level];
		if (!zone) return null;
		const position = zone.cells[index];
		return position >= 0 ? zone.ids[position] : null;
	};
	const cells = columns.lat.map((lat, index) => ({
		index,
		lat,
		lon: columns.lon[index],
		zones: {
			country: zoneOf('country', index),
			admin1: zoneOf('admin1', index),
			admin2: zoneOf('admin2', index)
		},
		percentile: columns.percentile[index],
		anomalyPct: columns.anomaly_pct[index],
		probBelow: columns.prob_below[index],
		probNear: columns.prob_near[index],
		probAbove: columns.prob_above[index],
		skill: columns.skill[index],
		histCvPct: columns.hist_cv_pct[index],
		areaHa: columns.area_ha[index]
	}));
	return { ...payload, cells, noForecast: payload.no_forecast ?? { lat: [], lon: [] } };
}

export function loadAdmin(runId, level, crop) {
	return fetchJson(yieldForecastAdminUrl(runId, level, crop));
}

export function loadDensity(runId, country, crop) {
	return fetchJson(yieldForecastDensityUrl(runId, country, crop));
}

/** The month's nowcast for one level and crop, or null when the run has none for it. */
export function loadNowcastAdmin(runId, nowcast, level, crop) {
	if (!nowcast?.admin_levels?.[level]?.includes(crop)) return Promise.resolve(null);
	return fetchJson(yieldForecastNowcastAdminUrl(runId, level, crop));
}

/** The nowcast of one grid cell, from its province's file, or null when there is none. */
export async function loadNowcastCell(runId, nowcast, country, crop, admin1, lat, lon) {
	if (!admin1 || !nowcast?.grid?.[country]?.[crop]?.includes(admin1)) return null;
	const chunk = await fetchJson(yieldForecastNowcastGridUrl(runId, country, crop, admin1));
	const index = chunk.lat.findIndex(
		(cellLat, i) => Math.abs(cellLat - lat) < 1e-3 && Math.abs(chunk.lon[i] - lon) < 1e-3
	);
	if (index < 0) return null;
	const sowing = new Date(Date.UTC(chunk.season_year[index], 0, chunk.sowing_doy[index]));
	const indicator = (name) =>
		Object.fromEntries(Object.entries(chunk[name]).map(([key, values]) => [key, values[index]]));
	return {
		sowing_date: sowing.toISOString().slice(0, 10),
		day_of_season: chunk.day_of_season[index],
		biomass: indicator('biomass'),
		water: indicator('water')
	};
}

/**
 * Rows for the nowcast chart: one per step from sowing, with the season so far and
 * the reference band, all multiplied by `scale`.
 */
export function nowcastRows(block, sowingDate, stepDays, scale = 1) {
	const start = new Date(`${sowingDate}T00:00:00Z`).getTime();
	const length = Math.max(block.mean.length, block.current.length);
	const value = (values, i) => (values[i] === null || values[i] === undefined ? null : values[i] * scale);
	return Array.from({ length }, (_, i) => ({
		date: new Date(start + i * stepDays * 86400000),
		current: value(block.current, i),
		mean: value(block.mean, i),
		p05: value(block.p05, i),
		p95: value(block.p95, i)
	}));
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

/** Crop labels arrive lowercase from the LPJmL band names. */
export function toSentenceCase(label) {
	const text = String(label ?? '');
	return text ? text[0].toUpperCase() + text.slice(1) : text;
}

const SEASON_NAMES = { 1: 'first season', 2: 'second season' };

/** "maize 2" reads as a variety; "Maize (second season)" says what the number is. */
export function formatCropLabel(label) {
	const text = toSentenceCase(label);
	const match = text.match(/^(.*) ([12])$/);
	return match ? `${match[1]} (${SEASON_NAMES[match[2]]})` : text;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-30" as "30 Sep 2026", read as a UTC day. */
export function formatDay(text) {
	const date = new Date(`${text}T00:00:00Z`);
	return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

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
			geometry: cellSquare(cell.lon, cell.lat, half)
		}))
	};
}

/**
 * Squares for cells where the crop grows but no forecast is published.
 *
 * Drawn so that blank map means only "the crop is not grown here". These carry
 * no properties: they are not clickable and have nothing to show in the panel.
 */
export function buildNoForecastFeatures(grid) {
	const half = (grid.resolution_deg ?? 0.1) / 2;
	const { lat = [], lon = [] } = grid.noForecast ?? {};
	return {
		type: 'FeatureCollection',
		features: lat.map((value, index) => ({
			type: 'Feature',
			properties: {},
			geometry: cellSquare(lon[index], value, half)
		}))
	};
}

function cellSquare(lon, lat, half) {
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
