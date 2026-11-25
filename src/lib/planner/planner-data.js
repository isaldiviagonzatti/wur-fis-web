/**
 * The planner's content (planner.json, built from the foodshed review by
 * fis-data-prep) and read-only lookups on it. Everything that carries papers
 * gets a `paperSet` for the evidence functions in evidence.js.
 */
import { fetchJson } from '$lib/fetch-json.js';
import { PLANNER_URL } from '$lib/data-sources.js';

export const CARD_KINDS = [
	{ value: 'method', label: 'Methods', singular: 'Method' },
	{ value: 'indicator', label: 'Indicators', singular: 'Indicator' },
	{ value: 'data', label: 'Data', singular: 'Data' }
];

export const KIND_LABELS = Object.fromEntries(CARD_KINDS.map((k) => [k.value, k.singular]));

// Elements the planner may suggest adding; outcomes and resilience capacities
// are only ever the user's own choice.
const SUGGESTABLE = (element) =>
	element.zone === 'drivers' || element.zone === 'activities' || element.subzone === 'properties';

export async function loadPlannerContent() {
	return indexContent(await fetchJson(PLANNER_URL));
}

export function indexContent(content) {
	const withSet = (entry) => ({ ...entry, paperSet: new Set(entry.papers) });
	const byId = (entries) => new Map(entries.map((entry) => [entry.id, entry]));
	const elements = content.elements.map(withSet);
	const cards = content.cards.map(withSet);
	const actors = content.actors.map(withSet);
	const topics = content.topics.map(withSet);
	return {
		...content,
		elements,
		cards,
		actors,
		topics,
		cardKinds: CARD_KINDS,
		paperCount: Object.keys(content.papers).length,
		suggestable: elements.filter(SUGGESTABLE),
		zonesById: byId(content.zones),
		subzonesById: byId(content.subzones),
		elementsById: byId(elements),
		cardsById: byId(cards),
		actorsById: byId(actors),
		topicsById: byId(topics)
	};
}

/** Papers by code, most recent first. */
export function papersFor(content, codes) {
	return codes
		.map((code) => ({ code, ...content.papers[code] }))
		.filter((paper) => paper.title)
		.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
}

/** "Lauk et al. (2022)" */
export function paperCitation(paper) {
	return `${paper.authors}${paper.year ? ` (${paper.year})` : ''}`;
}

/**
 * Cards of one kind matching a search query, which also searches the names the
 * papers use, so "land footprint" finds Land resource demand. A card found
 * through one of its names carries that name as `hit`.
 */
export function searchCards(content, kind, query) {
	const q = query.trim().toLowerCase();
	const cards = content.cards.filter((card) => card.kind === kind);
	if (!q) return cards.map((card) => ({ card, hit: null }));
	const found = [];
	for (const card of cards) {
		if (`${card.label} ${card.description}`.toLowerCase().includes(q)) {
			found.push({ card, hit: null });
			continue;
		}
		const item = card.items.find((entry) => entry.name.toLowerCase().includes(q));
		if (item) found.push({ card, hit: item.name });
	}
	return found;
}

/** Elements of a zone, or of a subzone, in content order. */
export function elementsIn(content, { zone, subzone }) {
	return content.elements.filter((element) =>
		subzone ? element.subzone === subzone : element.zone === zone
	);
}
