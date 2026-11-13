/**
 * Partners and funder shown, in their original colours, in the footer and on
 * the About page. `scale` sizes the logos relative to each other so they look
 * balanced side by side.
 */
export const PARTNERS = [
	{
		name: 'Wageningen University & Research',
		href: 'https://www.wur.nl',
		logo: '/wur-logo.svg',
		scale: 1
	},
	{
		name: 'SAFE4ALL',
		href: 'https://www.safe4allafrica.eu/',
		logo: '/safe4all-logo-vertical.svg',
		scale: 1.5
	}
];

export const EU_EMBLEM = {
	name: 'Flag of the European Union',
	// Broken where the EU's own "Funded by the European Union" lockup breaks it.
	caption: ['Funded by', 'the European Union'],
	logo: '/eu-flag.svg',
	scale: 1.18
};
