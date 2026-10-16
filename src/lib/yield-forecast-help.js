/**
 * Short explanations of the yield forecast's terms, shared by the hover
 * explainers on the Forecast tab and the User Guide so the two never disagree.
 *
 * Only terms a non-specialist cannot read off the screen get one; a search box
 * or a crop list explains itself.
 */
export const METRIC_HELP = {
	percentile: {
		label: 'Percentile',
		text: 'Where this season\'s expected yield (the average of the 51 forecast members) falls among the past 30 years of this place. Around 10 puts it among the lowest years, 50 is a typical year and 90 among the highest.'
	},
	anomaly: {
		label: 'Anomaly',
		text: 'How far the expected yield is from the average of the past 30 years for this crop and place, in percent. -15% means 15% below that average.'
	},
	terciles: {
		label: 'Below / near / above',
		text: 'Share of the 51 forecast members in the lowest, middle and highest third of the past 30 years. 60 / 30 / 10 means most members point to a below-normal yield.'
	},
	skill: {
		label: 'Skill (CRPSS)',
		text: 'How much better the forecast did in past years than simply expecting a repeat of the previous five seasons. 0 is no better, 0.4 means 40% better. Only places with positive skill are shown.'
	},
	area: {
		label: 'Area covered',
		text: 'Share of the crop area behind an area value. Cells without a forecast or without skill drop out.'
	}
};

export const CONTROL_HELP = {
	showBy:
		'Each grid cell (about 11 km), or crop-area weighted averages over Admin 2 areas (districts), Admin 1 areas (regions, provinces or counties) or whole countries.',
	skill:
		'Colour the cells by how skilful the forecast has been there in past years, instead of by this season\'s forecast. Grid cells only.',
	opacity: 'Fade the forecast layer to see borders and place names underneath.'
};

const PERCENTILE_READING =
	'The colour shows where this season\'s expected yield falls among the past 30 years of the same place. Around 10 puts it among the lowest years, 50 is a typical year and 90 among the highest.';

export const LEGEND_HELP = {
	percentileCells: `${PERCENTILE_READING} Hatched places have no forecast this month, and blank places do not grow the crop.`,
	percentileAreas: `${PERCENTILE_READING} Areas left blank have no forecast this month.`,
	skill:
		'How much better the forecast did in past years than simply expecting a repeat of the previous five seasons. 0 is no better, 1 is perfect. Only places where it did better are shown.'
};

export const SECTION_HELP = {
	seasonSoFar:
		'How the crop has grown from sowing up to the last day of observed weather, from the crop model run on that weather. Nothing in this box is forecast.',
	forecast:
		'The yield expected at harvest, from 51 equally likely runs of the crop model driven by ECMWF seasonal weather forecasts (the ensemble), compared with the past 30 harvests of the same place.'
};
