/**
 * Evidence from the foodshed review: which methods, indicators, data and
 * board elements go together in the reviewed papers.
 *
 * Everything that carries papers (a board element, a card, an answer to the
 * questionnaire) is a set of paper codes. Two sets go together when a paper in
 * one is more often in the other than chance would have it, measured by the
 * phi coefficient of the two memberships over all reviewed papers. Unlike a
 * plain count it does not favour what nearly every paper does (most papers
 * assess availability), and unlike a share it does not favour what a single
 * paper does, helped by requiring at least MIN_SHARED papers in common.
 *
 * A target is { id, label, paperSet }: what the plan is about. A candidate is
 * scored against several targets by summing its phi with each, and `why` keeps
 * the targets it goes with, to explain the suggestion.
 */

export const MIN_SHARED = 3;

export function association(a, b, total) {
	let shared = 0;
	for (const code of a) if (b.has(code)) shared++;
	const onlyA = a.size - shared;
	const onlyB = b.size - shared;
	const neither = total - shared - onlyA - onlyB;
	const denominator = Math.sqrt(a.size * b.size * (total - a.size) * (total - b.size));
	const phi = denominator ? (shared * neither - onlyA * onlyB) / denominator : 0;
	return { shared, phi };
}

/** Candidates that go with the targets, best first; each with its score and reasons. */
export function rankAgainst(candidates, targets, total) {
	const ranked = [];
	for (const entry of candidates) {
		let score = 0;
		const why = [];
		for (const target of targets) {
			if (target.id === entry.id) continue;
			const fit = association(entry.paperSet, target.paperSet, total);
			score += fit.phi;
			if (fit.phi > 0 && fit.shared >= MIN_SHARED) why.push({ target, shared: fit.shared });
		}
		if (why.length && score > 0) ranked.push({ entry, score, why });
	}
	return ranked.sort((a, b) => b.score - a.score);
}

/** The best cards of each kind for the targets. */
export function recommendCards(content, targets, perKind = 5) {
	const byKind = Object.fromEntries(content.cardKinds.map(({ value }) => [value, []]));
	for (const item of rankAgainst(content.cardsById.values(), targets, content.paperCount)) {
		const list = byKind[item.entry.kind];
		if (list.length < perKind) list.push(item);
	}
	return byKind;
}

/**
 * Elements not yet in the plan that the review ties to what is in it. Only
 * drivers, activities and structural properties are suggested; outcomes and
 * resilience capacities are the planner's own choice.
 */
export function suggestElements(content, targets, scope, n = 3) {
	const candidates = content.suggestable.filter((element) => !scope.includes(element.id));
	return rankAgainst(candidates, targets, content.paperCount).slice(0, n);
}

/** Elements the papers behind a card most often address. */
export function elementsForCard(content, cardId, n = 4) {
	const card = content.cardsById.get(cardId);
	return rankAgainst(content.elements, [card], content.paperCount).slice(0, n);
}

/** Cards of the other kinds most often used in the same papers as this card. */
export function relatedCards(content, cardId, perKind = 3) {
	const card = content.cardsById.get(cardId);
	const others = [...content.cardsById.values()].filter((other) => other.kind !== card.kind);
	const related = Object.fromEntries(
		content.cardKinds.filter(({ value }) => value !== card.kind).map(({ value }) => [value, []])
	);
	for (const item of rankAgainst(others, [card], content.paperCount)) {
		const list = related[item.entry.kind];
		if (list.length < perKind) list.push(item);
	}
	return related;
}
