/**
 * Navigation card metadata for landing pages.
 */
export const HOME_NAV_ITEMS = [
	{
		href: '/yield-forecast',
		title: 'Yield Forecast',
		subtitle: 'Seasonal crop yield outlooks',
		description:
			'Probabilistic seasonal forecasts of crop yield anomalies for Ghana, Kenya, and Zimbabwe, driven by bias-corrected and downscaled SEAS5 climate forecasts and the LPJmL process-based crop model. Forecasts are issued at 0-2 months before sowing to support short-term adaptation planning. Explore spatial skill maps and yield distributions across administrative regions.'
	},
	{
		href: '/foodshed',
		title: 'Foodshed Scenarios',
		subtitle: 'Future food system projections',
		description:
			'Interactive maps of foodsheds showing how domestic production, trade, and food demand combine to determine food availability in Ghana, Kenya, and Zimbabwe. Long-term scenarios under SSP2-4.5 and SSP3-7.0 are under development.'
	},
	{
		href: '/data-explorer',
		title: 'Data Explorer',
		subtitle: 'Data underpinning the Foodshed Information Service',
		description:
			'Static spatial and statistical reference layers used as inputs and baselines for the FIS: crop calendars, FAO and HarvestStat yield and area statistics, agro-ecological zones, soil types, land use, elevation, and ERA5-Land climate climatology.'
	},
	{
		href: '/methodology',
		title: 'Methodology',
		subtitle: 'Technical and scientific background',
		description:
			'Documentation of data sources, modelling approaches, skill metrics, and limitations. Intended for technical users.'
	}
];

export const DATA_EXPLORER_NAV_ITEMS = [
	{
		href: '/data-explorer/crop-yields',
		title: 'Crop Yields',
		description:
			'Observed yield, production, and harvested area statistics by country and administrative region for Ghana, Kenya, and Zimbabwe.'
	},
	{
		href: '/data-explorer/crop-calendars',
		title: 'Crop Calendars',
		description:
			'Sowing and harvest timing by agro-ecological zone. Click an AEZ on the map to see the full crop calendar chart.'
	},
	{
		href: '/data-explorer/environment',
		title: 'Environment',
		description:
			'Spatial environmental reference layers including soil texture, land use, and elevation for Ghana, Kenya, and Zimbabwe.'
	},
	{
		href: '/data-explorer/climate',
		title: 'Climate',
		description:
			'ERA5-Land climatology layers covering long-term temperature and precipitation patterns across the study region.'
	}
];
