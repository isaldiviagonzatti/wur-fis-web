/**
 * Navigation card metadata for landing pages.
 */
export const HOME_NAV_ITEMS = [
	{
		href: '/yield-forecast',
		title: 'Yield Forecast',
		subtitle: 'Seasonal crop yield outlooks',
		description:
			'Monthly forecasts of how this season\'s crop yields compare with normal in Ghana, Kenya, and Zimbabwe, from the LPJmL crop model driven by ECMWF seasonal weather forecasts. For any place, see how the season has gone so far and the range of possible yields at harvest.'
	},
	{
		href: '/foodshed',
		title: 'Foodshed Atlas',
		subtitle: 'Where food comes from, today and in the future',
		comingSoon: true,
		description:
			'Maps of foodsheds showing how domestic production, trade, and food demand combine to determine food availability in Ghana, Kenya, and Zimbabwe, today and under long-term scenarios (SSP2-4.5 and SSP3-7.0).'
	},
	{
		href: '/data-explorer',
		title: 'Data Explorer',
		subtitle: 'Data underpinning the Foodshed Information Service',
		description:
			'Reference data behind the Foodshed Information Service. Crop calendars are available now; yield statistics, environmental layers, and climate climatologies are coming soon.'
	}
];

export const DATA_EXPLORER_NAV_ITEMS = [
	{
		href: '/data-explorer/crop-yields',
		title: 'Crop Yields',
		comingSoon: true,
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
		comingSoon: true,
		description:
			'Spatial environmental reference layers including soil texture, land use, and elevation for Ghana, Kenya, and Zimbabwe.'
	},
	{
		href: '/data-explorer/climate',
		title: 'Climate',
		comingSoon: true,
		description:
			'ERA5-Land climatology layers covering long-term temperature and precipitation patterns across the study region.'
	}
];
