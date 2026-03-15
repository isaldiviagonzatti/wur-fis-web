import {
	MONTH_LABELS,
	getMonthColor,
	toSentenceCase,
	getCalendarEntryKey,
	getCalendarDisplayLabel,
	getCalendarSeasonKey
} from '$lib/calendar.js';

export const CALENDAR_MAP_POPUP_CLASS = 'calendar-map-popup';

function formatMonthLabel(month) {
	return MONTH_LABELS[month - 1] ?? 'Not available';
}

function getCalendarEntryForAez(calendarData, { country, aezName, crop, season }) {
	const entries = calendarData?.[country]?.[aezName] ?? [];
	return entries.find(
		(entry) => getCalendarEntryKey(entry) === crop && getCalendarSeasonKey(entry) === season
	);
}

function getPillTextColor(color) {
	if (!color?.startsWith('#') || color.length !== 7) return '';
	const red = Number.parseInt(color.slice(1, 3), 16);
	const green = Number.parseInt(color.slice(3, 5), 16);
	const blue = Number.parseInt(color.slice(5, 7), 16);
	const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
	return luminance > 0.62 ? '#111827' : '#f8fafc';
}

function createPopupRow(label, value, color) {
	const row = document.createElement('div');
	row.className = 'calendar-hover-popup__row';

	const term = document.createElement('span');
	term.className = 'calendar-hover-popup__label';
	term.textContent = label;

	const description = document.createElement('span');
	description.className = 'calendar-hover-popup__value-pill';
	if (color) {
		description.style.backgroundColor = color;
		const textColor = getPillTextColor(color);
		if (textColor) description.style.color = textColor;
	}
	description.textContent = value;

	row.append(term, description);
	return row;
}

function createHoverPopupContent({
	countryLabel,
	aezName,
	cropLabel,
	sowingLabel,
	sowingColor,
	harvestLabel,
	harvestColor,
	message
}) {
	const root = document.createElement('div');
	root.className = 'calendar-hover-popup';

	const header = document.createElement('div');
	header.className = 'calendar-hover-popup__header';

	const title = document.createElement('p');
	title.className = 'calendar-hover-popup__title';
	title.textContent = toSentenceCase(aezName);
	header.append(title);

	if (countryLabel) {
		const country = document.createElement('p');
		country.className = 'calendar-hover-popup__country';
		country.textContent = toSentenceCase(countryLabel);
		header.append(country);
	}

	root.append(header);

	if (cropLabel) {
		const cropName = document.createElement('p');
		cropName.className = 'calendar-hover-popup__crop';
		cropName.textContent = toSentenceCase(cropLabel);
		root.append(cropName);
	}

	if (message) {
		const note = document.createElement('p');
		note.className = 'calendar-hover-popup__note';
		note.textContent = message;
		root.append(note);
		return root;
	}

	root.append(createPopupRow('Sowing', sowingLabel, sowingColor));
	root.append(createPopupRow('Harvest', harvestLabel, harvestColor));
	return root;
}

export function buildCalendarHoverPopupContent({
	calendarData,
	countryLabels,
	aezCountry,
	aezName,
	crop,
	cropLabels,
	season,
	requiresSeasonSelection
}) {
	const countryLabel = countryLabels[aezCountry] ?? aezCountry;

	if (!crop) {
		return createHoverPopupContent({
			countryLabel,
			aezName,
			cropLabel: '',
			message: 'Select a crop to preview calendar dates.'
		});
	}

	const cropLabel = cropLabels[crop] ?? crop;

	if (requiresSeasonSelection && !season) {
		return createHoverPopupContent({
			countryLabel,
			aezName,
			cropLabel,
			message: 'Choose a season to preview sowing and harvest dates.'
		});
	}

	const entry = getCalendarEntryForAez(calendarData, {
		country: aezCountry,
		aezName,
		crop,
		season
	});

	if (!entry) {
		return createHoverPopupContent({
			countryLabel,
			aezName,
			cropLabel,
			message: 'No calendar data for the selected crop/season.'
		});
	}

	return createHoverPopupContent({
		countryLabel,
		aezName,
		cropLabel: getCalendarDisplayLabel(entry) ?? cropLabel,
		sowingLabel: formatMonthLabel(entry.sowing_month),
		sowingColor: getMonthColor(entry.sowing_month),
		harvestLabel: formatMonthLabel(entry.maturity_month),
		harvestColor: getMonthColor(entry.maturity_month)
	});
}
