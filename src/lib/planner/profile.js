/**
 * The planner's profile: the answers to the opening questions, all optional.
 * Who is planning (`actor`), the plan's objective in their own words, the
 * decisions it concerns (`topics`, the review's decision domains), the
 * outcomes to improve (outcome element ids) and the resilience capacities to
 * build (capacity element ids).
 *
 * The answers put elements in the plan's scope on the board, and, with the
 * scope, are the targets recommendations are scored against.
 */

export function emptyProfile() {
	return { actor: null, objective: '', topics: [], outcomes: [], capacities: [] };
}

/** A saved profile with anything the content no longer has dropped. */
export function normaliseProfile(saved, content) {
	const known = (ids, lookup) => (Array.isArray(ids) ? ids.filter((id) => lookup.has(id)) : []);
	const outcomes = new Set(outcomeElements(content).map((element) => element.id));
	const capacities = new Set(capacityElements(content).map((element) => element.id));
	return {
		actor: content.actorsById.has(saved?.actor) ? saved.actor : null,
		objective: typeof saved?.objective === 'string' ? saved.objective : '',
		topics: known(saved?.topics, content.topicsById),
		outcomes: known(saved?.outcomes, outcomes),
		capacities: known(saved?.capacities, capacities)
	};
}

export function outcomeElements(content) {
	return content.elements.filter((element) => element.zone === 'outcomes');
}

export function capacityElements(content) {
	return content.elements.filter((element) => element.subzone === 'capacities');
}

/** The outcomes question: one group per outcomes box, with its elements. */
export function outcomeGroups(content) {
	return content.subzones
		.filter((subzone) => subzone.zone === 'outcomes')
		.map((subzone) => ({
			subzone,
			elements: content.elements.filter((element) => element.subzone === subzone.id)
		}));
}

const DISTURBANCES = 'disturbances';

/** Elements the answers put in scope: the outcomes, the capacities with the disturbances they respond to, and the actor's own activities. */
export function impliedScope(profile, content) {
	const actor = content.actorsById.get(profile.actor);
	return [
		...profile.outcomes,
		...profile.capacities,
		...(profile.capacities.length ? [DISTURBANCES] : []),
		...(actor?.activities ?? [])
	];
}

/**
 * Scope after the answers change: what the old answers implied is replaced by
 * what the new ones imply, and elements the user put in scope on the board
 * themselves stay.
 */
export function rescope(scope, before, after, content) {
	const dropped = new Set(impliedScope(before, content));
	const kept = scope.filter((id) => !dropped.has(id));
	return [...new Set([...kept, ...impliedScope(after, content)])];
}

/** What recommendations are scored against: elements in scope, the actor's studies and the topics. */
export function planTargets(content, profile, scope) {
	const targets = scope.map((id) => content.elementsById.get(id)).filter(Boolean);
	const actor = content.actorsById.get(profile.actor);
	if (actor?.papers.length) targets.push(actor);
	for (const id of profile.topics) targets.push(content.topicsById.get(id));
	return targets;
}

export function hasAnswers(profile) {
	return Boolean(
		profile.actor ||
			profile.objective.trim() ||
			profile.topics.length ||
			profile.outcomes.length ||
			profile.capacities.length
	);
}
