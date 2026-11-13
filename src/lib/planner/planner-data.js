/**
 * Read-only access to the planner content (planner.json): lookups by id and
 * the evidence-based suggestions.
 *
 * Every element and card carries the codes of the reviewed papers it matches.
 * A suggestion ranks cards by how strongly their papers overlap an element's
 * papers, using the Ochiai coefficient (shared / sqrt(n_card * n_element)), so
 * methods that appear in most papers do not crowd out specific ones.
 */
import { fetchJson } from '$lib/fetch-json.js';
import { PLANNER_URL } from '$lib/data-sources.js';

export const CARD_KINDS = [
	{ value: 'method', label: 'Methods', singular: 'Method' },
	{ value: 'indicator', label: 'Indicators', singular: 'Indicator' },
	{ value: 'data', label: 'Data', singular: 'Data' }
];

export const KIND_LABELS = Object.fromEntries(CARD_KINDS.map((k) => [k.value, k.singular]));

export async function loadPlannerContent() {
	return indexContent(await fetchJson(PLANNER_URL));
}

function indexContent(content) {
	const withSets = (entries) =>
		new Map(entries.map((entry) => [entry.id, { ...entry, paperSet: new Set(entry.papers) }]));
	return {
		...content,
		zonesById: new Map(content.zones.map((zone) => [zone.id, zone])),
		elementsById: withSets(content.elements),
		cardsById: withSets(content.cards)
	};
}

function ochiai(a, b) {
	if (!a.size || !b.size) return { shared: 0, score: 0 };
	let shared = 0;
	for (const code of a) if (b.has(code)) shared++;
	return { shared, score: shared / Math.sqrt(a.size * b.size) };
}

/**
 * Cards of each kind ranked for a set of elements. A card's score is its best
 * overlap with any of the elements, and `element` names the one it fits best.
 */
export function suggestCards(content, elementIds, perKind = 5) {
	const elements = elementIds.map((id) => content.elementsById.get(id)).filter(Boolean);
	const ranked = { method: [], indicator: [], data: [] };
	if (!elements.length) return ranked;
	for (const card of content.cardsById.values()) {
		let best = null;
		for (const element of elements) {
			const fit = ochiai(card.paperSet, element.paperSet);
			if (fit.shared && (!best || fit.score > best.score)) best = { ...fit, element: element.id };
		}
		if (best) ranked[card.kind].push({ card, ...best });
	}
	for (const kind in ranked) {
		ranked[kind] = ranked[kind].sort((a, b) => b.score - a.score).slice(0, perKind);
	}
	return ranked;
}

/** Elements a card's papers most often address. */
export function elementsForCard(content, cardId, n = 4) {
	const card = content.cardsById.get(cardId);
	return [...content.elementsById.values()]
		.map((element) => ({ element, ...ochiai(card.paperSet, element.paperSet) }))
		.filter((fit) => fit.shared)
		.sort((a, b) => b.score - a.score)
		.slice(0, n);
}

/** Cards of the other kinds most often used in the same papers as this card. */
export function relatedCards(content, cardId, perKind = 3) {
	const card = content.cardsById.get(cardId);
	const related = {};
	for (const { value } of CARD_KINDS) {
		if (value === card.kind) continue;
		related[value] = [...content.cardsById.values()]
			.filter((other) => other.kind === value)
			.map((other) => ({ card: other, ...ochiai(card.paperSet, other.paperSet) }))
			.filter((fit) => fit.shared)
			.sort((a, b) => b.score - a.score)
			.slice(0, perKind);
	}
	return related;
}

/** Papers by code, most recent first. */
export function papersFor(content, codes) {
	return codes
		.map((code) => ({ code, ...content.papers[code] }))
		.filter((paper) => paper.title)
		.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

/** Cards of one kind grouped as the library lists them, filtered by a search query. */
export function libraryGroups(content, kind, query) {
	const q = query.trim().toLowerCase();
	const groups = new Map();
	for (const card of content.cardsById.values()) {
		if (card.kind !== kind) continue;
		const haystack = [card.label, card.group, card.description, ...card.named].join(' ').toLowerCase();
		if (q && !haystack.includes(q)) continue;
		if (!groups.has(card.group)) groups.set(card.group, []);
		groups.get(card.group).push(card);
	}
	return [...groups].map(([label, cards]) => ({ label, cards }));
}
