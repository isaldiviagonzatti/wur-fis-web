export const MONTH_LABELS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

export const MONTH_COLORS = [
	'#3d114d',
	'#592a8f',
	'#5f5eb3',
	'#6b8cbf',
	'#95b5c7',
	'#d1d5da',
	'#ddd0ce',
	'#cca389',
	'#be6f5b',
	'#a24050',
	'#741e4f',
	'#3f123d'
];

export const CALENDAR_FILL_NEUTRAL = 'rgba(0, 0, 0, 0)';
export const CALENDAR_FILL_MISSING = 'rgba(0, 0, 0, 0)';
export const CALENDAR_OUTLINE_BASE = '#ffffff';
export const CALENDAR_NO_DATA_HATCH_OPACITY = 0.82;
export const CALENDAR_STAGE_COLORS = {
	sowing: '#332288',
	season: '#7a7686',
	harvest: '#DDCC77'
};

const DATASET_KEYS = ['sowing_date', 'harvest_date'];
const EMPTY_OPTIONS = [];
const EMPTY_ENTRIES = [];
const calendarIndexCache = new WeakMap();

export function toSentenceCase(value) {
	const text = String(value ?? '').trim();
	if (!text) return '';
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function normalizeCalendarCropName(name) {
	return String(name ?? '')
		.replace(/_/g, ' ')
		.replace(/ \d+$/, '')
		.trim();
}

export function slugifyCalendarCropName(name) {
	return normalizeCalendarCropName(name).toLowerCase().replace(/\s+/g, '_');
}

export function getCalendarEntryKey(entry) {
	return entry?.crop_key ?? slugifyCalendarCropName(entry?.crop);
}

export function getCalendarEntryLabel(entry) {
	return entry?.crop_label ?? normalizeCalendarCropName(entry?.crop);
}

export function getCalendarDisplayLabel(entry) {
	return toSentenceCase(getCalendarEntryLabel(entry));
}

export function getCalendarSeasonKey(entry) {
	return entry?.season_key ?? String(entry?.season ?? '').trim();
}

export function getCalendarSeasonLabel(entry) {
	return entry?.season_label ?? String(entry?.season ?? '').trim();
}

export function getCalendarDisplaySeasonLabel(entry) {
	return toSentenceCase(getCalendarSeasonLabel(entry));
}

export function getCalendarMonth(entry, dataset) {
	return dataset === 'harvest_date' ? entry?.maturity_month : entry?.sowing_month;
}

export function getMonthColor(month) {
	return MONTH_COLORS[month - 1] ?? CALENDAR_FILL_MISSING;
}

export function getAezFeatureKey(country, aezName) {
	return `${country ?? ''}::${aezName ?? ''}`;
}

function getAezEntryKey(country, aezName, crop, season) {
	return `${getAezFeatureKey(country, aezName)}::${crop ?? ''}::${season ?? ''}`;
}

function getFillSelectionKey(dataset, crop, season) {
	return `${dataset ?? ''}::${crop ?? ''}::${season ?? ''}`;
}

function getCalendarFillPairs(calendarData, selectedCrop, selectedSeason, dataset) {
	if (!calendarData || !selectedCrop || !selectedSeason) return null;

	return (
		getCalendarDataIndex(calendarData).fillPairsBySelection.get(
			getFillSelectionKey(dataset, selectedCrop, selectedSeason)
		) ?? EMPTY_OPTIONS
	);
}

function getCalendarDataIndex(calendarData) {
	if (!calendarData) {
		return {
			cropOptions: EMPTY_OPTIONS,
			entriesByAezKey: new Map(),
			entryByAezCropSeason: new Map(),
			fillPairsBySelection: new Map(),
			seasonOptionsByCrop: new Map()
		};
	}

	const cached = calendarIndexCache.get(calendarData);
	if (cached) return cached;

	const cropLabels = new Map();
	const seasonOptionsByCrop = new Map();
	const entriesByAezKey = new Map();
	const entryByAezCropSeason = new Map();
	const fillPairsBySelection = new Map();

	for (const [country, aezs] of Object.entries(calendarData)) {
		for (const [aezName, entries] of Object.entries(aezs)) {
			const aezKey = getAezFeatureKey(country, aezName);
			const normalizedEntries = [];

			for (const entry of entries) {
				const cropKey = getCalendarEntryKey(entry);
				const seasonKey = getCalendarSeasonKey(entry);
				if (!cropKey || !seasonKey) continue;

				normalizedEntries.push(entry);

				if (!cropLabels.has(cropKey)) {
					cropLabels.set(cropKey, getCalendarDisplayLabel(entry));
				}

				let seasons = seasonOptionsByCrop.get(cropKey);
				if (!seasons) {
					seasons = new Map();
					seasonOptionsByCrop.set(cropKey, seasons);
				}
				if (!seasons.has(seasonKey)) {
					seasons.set(seasonKey, getCalendarDisplaySeasonLabel(entry));
				}

				entryByAezCropSeason.set(getAezEntryKey(country, aezName, cropKey, seasonKey), entry);

				for (const dataset of DATASET_KEYS) {
					const fillKey = getFillSelectionKey(dataset, cropKey, seasonKey);
					let pairs = fillPairsBySelection.get(fillKey);
					if (!pairs) {
						pairs = [];
						fillPairsBySelection.set(fillKey, pairs);
					}
					pairs.push(aezKey, getMonthColor(getCalendarMonth(entry, dataset)));
				}
			}

			entriesByAezKey.set(aezKey, normalizedEntries);
		}
	}

	const index = {
		cropOptions: [...cropLabels.entries()]
			.map(([value, label]) => ({ value, label }))
			.sort((left, right) => left.label.localeCompare(right.label)),
		entriesByAezKey,
		entryByAezCropSeason,
		fillPairsBySelection,
		seasonOptionsByCrop: new Map(
			[...seasonOptionsByCrop.entries()].map(([cropKey, seasons]) => [
				cropKey,
				[...seasons.entries()]
					.map(([value, label]) => ({ value, label }))
					.sort((left, right) => left.label.localeCompare(right.label))
			])
		)
	};

	calendarIndexCache.set(calendarData, index);
	return index;
}

export function getAezFeatureExpression() {
	return ['concat', ['coalesce', ['get', 'country'], ''], '::', ['coalesce', ['get', 'aez_name'], '']];
}

export function getCalendarCropOptions(calendarData) {
	return getCalendarDataIndex(calendarData).cropOptions;
}

export function getCalendarSeasonOptions(calendarData, selectedCrop) {
	if (!selectedCrop) return EMPTY_OPTIONS;
	return getCalendarDataIndex(calendarData).seasonOptionsByCrop.get(selectedCrop) ?? EMPTY_OPTIONS;
}

export function getCalendarEntriesForAez(calendarData, country, aezName) {
	if (!country || !aezName) return EMPTY_ENTRIES;
	return getCalendarDataIndex(calendarData).entriesByAezKey.get(getAezFeatureKey(country, aezName)) ?? EMPTY_ENTRIES;
}

export function getCalendarEntryForAez(calendarData, { country, aezName, crop, season }) {
	if (!country || !aezName || !crop || !season) return null;
	return (
		getCalendarDataIndex(calendarData).entryByAezCropSeason.get(
			getAezEntryKey(country, aezName, crop, season)
		) ?? null
	);
}

export function buildCalendarFillExpression(calendarData, selectedCrop, selectedSeason, dataset) {
	const pairs = getCalendarFillPairs(calendarData, selectedCrop, selectedSeason, dataset);
	if (!pairs) return CALENDAR_FILL_NEUTRAL;

	if (pairs.length === 0) return CALENDAR_FILL_MISSING;

	return ['match', getAezFeatureExpression(), ...pairs, CALENDAR_FILL_MISSING];
}

export function buildCalendarNoDataOpacityExpression(calendarData, selectedCrop, selectedSeason, dataset) {
	const pairs = getCalendarFillPairs(calendarData, selectedCrop, selectedSeason, dataset);
	if (!pairs) return 0;

	if (pairs.length === 0) return CALENDAR_NO_DATA_HATCH_OPACITY;

	const availableAezKeys = pairs.filter((_, index) => index % 2 === 0);

	return [
		'case',
		['in', getAezFeatureExpression(), ['literal', availableAezKeys]],
		0,
		CALENDAR_NO_DATA_HATCH_OPACITY
	];
}
