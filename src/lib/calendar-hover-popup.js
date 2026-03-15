import {
	MONTH_LABELS,
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

function createPopupRow(label, value) {
	const row = document.createElement('div');
	row.className = 'calendar-hover-popup__row';

	const term = document.createElement('span');
	term.className = 'calendar-hover-popup__label';
	term.textContent = label;

	const description = document.createElement('span');
	description.className = 'calendar-hover-popup__value';
	description.textContent = value;

	row.append(term, description);
	return row;
}

function createHoverPopupContent({ countryLabel, aezName, cropLabel, sowingLabel, harvestLabel, message }) {
	const root = document.createElement('div');
	root.className = 'calendar-hover-popup';

	if (countryLabel) {
		const country = document.createElement('p');
		country.className = 'calendar-hover-popup__country';
		country.textContent = toSentenceCase(countryLabel);
		root.append(country);
	}

	const title = document.createElement('p');
	title.className = 'calendar-hover-popup__title';
	title.textContent = toSentenceCase(aezName);
	root.append(title);

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

	root.append(createPopupRow('Sowing', sowingLabel));
	root.append(createPopupRow('Harvest', harvestLabel));
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
		harvestLabel: formatMonthLabel(entry.maturity_month)
	});
}
