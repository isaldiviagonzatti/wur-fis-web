/**
 * Navigation data: every page's title and description, which the page shows
 * at its top (`PageIntro`), the home page shows as cards, and the header and
 * footer link to. There are no section overview pages: each page introduces
 * itself.
 */
/** The site's name, always in lower case; the header sets it on two lines. */
export const SITE_NAME = 'foodshed lab';
/** The header's two lines: "lab" in capitals, flush right under "foodshed". */
export const SITE_WORDMARK = { top: 'foodshed', bottom: 'lab' };
/** The home page's headline. A sentence, so it keeps its case. */
export const SITE_SLOGAN = 'Connecting data to plan for food security and system resilience.';

export const PAGES = {
	yieldForecast: {
		href: '/yield-forecast',
		title: 'Yield Forecast',
		subtitle: 'Seasonal crop yield outlooks',
		description:
			"Monthly forecasts of how this season's crop yields compare with normal in Ghana, Kenya, and Zimbabwe, from the LPJmL crop model driven by ECMWF seasonal weather forecasts. For any place, see how the season has gone so far and the range of possible yields at harvest."
	},
	planner: {
		href: '/foodshed/planner',
		title: 'Foodshed Planner',
		menuTitle: 'Planner',
		subtitle: 'Design a food-system analysis',
		badge: 'Preview',
		description:
			'Pick the parts of the food system you want to study, then lay out methods, indicators and data on a board, with suggestions drawn from the foodshed literature. Use it alone or in a workshop, and export your plan as an image or a table.'
	},
	cropStatistics: {
		href: '/data-explorer/crop-statistics',
		title: 'Crop Statistics',
		description:
			'Reported yield, production, and harvested area since 1994 by country and region for Ghana, Kenya, and Zimbabwe, and how well the crop model follows their year-to-year ups and downs.'
	},
	atlas: {
		href: '/foodshed/atlas',
		title: 'Foodshed Atlas',
		menuTitle: 'Atlas',
		subtitle: 'Where food comes from, today and in the future',
		comingSoon: true,
		description:
			'Maps of foodsheds showing how domestic production, trade, and food demand combine to determine food availability in Ghana, Kenya, and Zimbabwe, today and under long-term scenarios (SSP2-4.5 and SSP3-7.0).'
	},
	cropCalendars: {
		href: '/data-explorer/crop-calendars',
		title: 'Crop Calendars',
		description:
			'Sowing and harvest timing by agro-ecological zone. Click an AEZ on the map to see the full crop calendar chart.'
	},
	environment: {
		href: '/data-explorer/environment',
		title: 'Environment',
		comingSoon: true,
		description:
			'Spatial environmental reference layers including soil texture, land use, and elevation for Ghana, Kenya, and Zimbabwe.'
	},
	climate: {
		href: '/data-explorer/climate',
		title: 'Climate',
		comingSoon: true,
		description:
			'ERA5-Land climatology layers covering long-term temperature and precipitation patterns across the study region.'
	}
};

// The order of PAGES is the order of the home cards.
export const HOME_NAV_ITEMS = Object.values(PAGES);
/** The home card that takes a column of its own beside the others on wide screens. */
export const HOME_FEATURE = PAGES.planner;
export const FOODSHED_NAV_ITEMS = [PAGES.planner, PAGES.atlas];
export const DATA_EXPLORER_NAV_ITEMS = [
	PAGES.cropStatistics,
	PAGES.cropCalendars,
	PAGES.environment,
	PAGES.climate
];

/**
 * Top-level sections of the site header. A section with `items` opens a short
 * dropdown of its pages, each named by its `menuTitle` if it has one (the
 * section name already says "Foodshed"); its `href` is only the URL prefix that
 * marks it active.
 */
export const SITE_NAV = [
	{ href: PAGES.yieldForecast.href, title: 'Yield Forecast' },
	{ href: '/foodshed', title: 'Foodshed', items: FOODSHED_NAV_ITEMS },
	{ href: '/data-explorer', title: 'Data Explorer', items: DATA_EXPLORER_NAV_ITEMS },
	{ href: '/about-us', title: 'About' }
];

export const SOURCE_CODE_URL = 'https://git.wur.nl/phd-isaldiviagonzatti/fis-web';

const live = (items) => items.filter((item) => !item.comingSoon);

/** Link columns of the site footer: only pages that are live. */
export const FOOTER_COLUMNS = [
	{ title: 'Tools', links: live([PAGES.yieldForecast, ...FOODSHED_NAV_ITEMS]) },
	{ title: 'Data', links: live(DATA_EXPLORER_NAV_ITEMS) },
	{
		title: 'About',
		// The footer adds a "Send feedback" button to this column when feedback is set up.
		feedback: true,
		links: [
			{ href: '/', title: 'Home' },
			{ href: '/about-us', title: 'About us' },
			{ href: SOURCE_CODE_URL, title: 'Source code', external: true }
		]
	}
];
