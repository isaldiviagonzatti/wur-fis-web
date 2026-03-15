export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

export const CALENDAR_FILL_NEUTRAL = '#a8c8c0';
export const CALENDAR_FILL_MISSING = '#6f9a92';
export const CALENDAR_OUTLINE_BASE = '#ffffff';
export const CALENDAR_OUTLINE_SELECTED = '#111827';
export const CALENDAR_STAGE_COLORS = {
	sowing: '#332288',
	season: '#7a7686',
	harvest: '#DDCC77'
};

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

export function getCalendarSeasonKey(entry) {
	return entry?.season_key ?? String(entry?.season ?? '').trim();
}

export function getCalendarSeasonLabel(entry) {
	return entry?.season_label ?? String(entry?.season ?? '').trim();
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

export function getAezFeatureExpression() {
	return ['concat', ['coalesce', ['get', 'country'], ''], '::', ['coalesce', ['get', 'aez_name'], '']];
}

export function getCalendarCropOptions(calendarData) {
	if (!calendarData) return [];

	const options = new Map();
	for (const aezs of Object.values(calendarData)) {
		for (const entries of Object.values(aezs)) {
			for (const entry of entries) {
				const value = getCalendarEntryKey(entry);
				if (!value || options.has(value)) continue;
				options.set(value, getCalendarEntryLabel(entry));
			}
		}
	}

	return [...options.entries()]
		.map(([value, label]) => ({ value, label }))
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function getCalendarSeasonOptions(calendarData, selectedCrop) {
	if (!calendarData || !selectedCrop) return [];

	const options = new Map();
	for (const aezs of Object.values(calendarData)) {
		for (const entries of Object.values(aezs)) {
			for (const entry of entries) {
				if (getCalendarEntryKey(entry) !== selectedCrop) continue;
				const value = getCalendarSeasonKey(entry);
				if (!value || options.has(value)) continue;
				options.set(value, getCalendarSeasonLabel(entry));
			}
		}
	}

	return [...options.entries()]
		.map(([value, label]) => ({ value, label }))
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function buildCalendarFillExpression(calendarData, selectedCrop, selectedSeason, dataset) {
	if (!calendarData) return CALENDAR_FILL_NEUTRAL;
	if (!selectedCrop) return CALENDAR_FILL_NEUTRAL;
	if (!selectedSeason) return CALENDAR_FILL_NEUTRAL;

	const pairs = [];

	for (const [country, aezs] of Object.entries(calendarData)) {
		for (const [aezName, entries] of Object.entries(aezs)) {
			const match = entries.find(
				(entry) =>
					getCalendarEntryKey(entry) === selectedCrop &&
					getCalendarSeasonKey(entry) === selectedSeason
			);
			if (!match) continue;
			pairs.push(getAezFeatureKey(country, aezName), getMonthColor(getCalendarMonth(match, dataset)));
		}
	}

	if (pairs.length === 0) return CALENDAR_FILL_MISSING;

	return ['match', getAezFeatureExpression(), ...pairs, CALENDAR_FILL_MISSING];
}
