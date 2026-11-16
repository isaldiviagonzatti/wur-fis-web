/**
 * Navigation data: every page's title and description, which the page shows
 * at its top (`PageIntro`), the home page shows as cards, and the header and
 * footer link to. There are no section overview pages: each page introduces
 * itself.
 */
/** The site's name, always in lower case; the header shows it as the logo (assets/logo.svg). */
export const SITE_NAME = 'foodshed lab';
/** The home page's headline. A sentence, so it keeps its case. */
export const SITE_SLOGAN = 'Connecting data to plan for food security and system resilience.';

export const PAGES = {
	yieldForecast: {
		href: '/yield-forecast',
		title: 'Yield Forecast',
		subtitle: 'Seasonal crop yield outlooks',
		description:
			"Forecasts, updated monthly, of how this season's crop yields compare with normal, including how the season has gone so far and the range of possible yields at harvest."
	},
	planner: {
		href: '/foodshed/planner',
		title: 'Foodshed Planner',
		menuTitle: 'Planner',
		subtitle: 'Design a food-system analysis',
		badge: 'Preview',
		comingSoon: true,
		// Off the header menu until it is ready; /foodshed/planner still opens it.
		unlisted: true,
		description:
			'Pick the parts of the food system you want to study, then lay out foodshed methods, indicators and data on the board to help you plan your analysis.'
	},
	cropStatistics: {
		href: '/data-explorer/crop-statistics',
		title: 'Crop Statistics',
		description:
			'See reported yield, production, and harvested area by country and region. Also includes information about how our crop model performs against reported statistics.'
	},
	atlas: {
		href: '/foodshed/atlas',
		title: 'Foodshed Atlas',
		menuTitle: 'Atlas',
		subtitle: 'Where food comes from, today and in the future',
		comingSoon: true,
		description:
			'Analysis showing how production, distribution and trade, and food demand combine to shape foodsheds today and under long-term scenarios.'
	},
	cropCalendars: {
		href: '/data-explorer/crop-calendars',
		title: 'Crop Calendars',
		description:
			'Sowing and harvest timing for major crops by agro-ecological zone.'
	},
	environment: {
		href: '/data-explorer/environment',
		title: 'Environment',
		comingSoon: true,
		description:
			'Spatial environmental layers used in our analysis, including topography, hydrology, soils, and land cover and use.'
	},
	climate: {
		href: '/data-explorer/climate',
		title: 'Climate',
		comingSoon: true,
		description:
			'Climatology layers covering long-term averages and variability of temperature, precipitation, radiation, and wind, as well as climate change scenarios.'
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
const listed = (items) => items.filter((item) => !item.unlisted);

export const SITE_NAV = [
	{ href: PAGES.yieldForecast.href, title: 'Yield Forecast' },
	{ href: '/foodshed', title: 'Foodshed', items: listed(FOODSHED_NAV_ITEMS) },
	{ href: '/data-explorer', title: 'Data Explorer', items: listed(DATA_EXPLORER_NAV_ITEMS) },
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
