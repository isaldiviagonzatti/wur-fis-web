/**
 * Short explanations of the crop-yields page's terms, for its hover explainers.
 *
 * Only terms a non-specialist cannot read off the screen get one.
 */
export const CONTROL_HELP = {
	variable:
		'Reported values come from official statistics: HarvestStat for regions, provinces and counties, FAOSTAT for countries.',
	showBy:
		'Admin 1 areas (regions, provinces or counties) or whole countries. Grid cells (about 11 km) exist only for the model, since statistics are reported per area.',
	year: 'The year whose values colour the map and are reported below it. Agreement is one number for the whole period, so with agreement shown the year only moves the panel below the map.',
	opacity: 'Fade the data layer to see borders and place names underneath.'
};

export const LEGEND_HELP = {
	anomaly:
		'How far a year was from the trend of that place, in standard deviations of its own year-to-year swings. −1 is a clearly poor year, +1 a clearly good one, beyond ±2 is rare. Model and statistics are each measured against their own trend, so they share this scale.',
	agreement:
		'Correlation between the model\'s and the statistics\' anomalies over the years both have, with at least 10 years needed. A value of 1 means they rise and fall together every year, 0 that the model says nothing about which years were good or bad, negative that they tend to disagree.',
	reported:
		'Colour classes are set from every year of the shown areas, so a colour means the same amount whichever year is selected. Hatched areas report this crop, but not in the selected year.'
};

export const SECTION_HELP = {
	reported:
		'Values as reported in the statistics. The dashed line is the trend removed before comparing years: a straight line or a gentle curve, whichever fits best, or the average when there is no clear trend.',
	anomalies:
		'Each series minus its own trend, divided by its typical year-to-year swing. This removes the difference in level between model and statistics, so the lines can be compared year by year: where they move together, the model captures what made that year good or bad.',
	cropMix:
		'Harvested area of the main crops here. Model land use is the SPAM 2017 map the model is run with, the same in every year; reported area is the average of the last five reported years.',
	cell: 'A grid cell has no statistics of its own, so its model anomalies are drawn against the reported anomalies of the province it lies in.'
};
