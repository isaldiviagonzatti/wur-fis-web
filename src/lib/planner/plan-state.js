/**
 * A plan as the board holds it (Svelte Flow nodes and edges, plus the
 * profile) and as it is stored (a small plain object). The diagram's elements
 * and labels are rebuilt from the content on every load; only the user's
 * answers, scope, cards, notes, links and title are saved, so a plan file
 * stays valid when the content is updated.
 */
import { CARD_WIDTH, ELEMENT_LAYOUT, OBJECTIVE, ZONE_LABELS, dockPosition } from './board-layout.js';
import { emptyProfile, normaliseProfile } from './profile.js';

export const PLAN_FORMAT = 'fis-foodshed-plan';
const PLAN_VERSION = 2;
const STORAGE_KEY = 'fis-foodshed-planner:v2';

export const OBJECTIVE_ID = 'objective';
const CENTRE = [0.5, 0.5];
const FIXED = { draggable: false, deletable: false, connectable: false };

function newId(prefix) {
	return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function elementNodes(content, scope) {
	return content.elements.map((element) => {
		const { x, y, width, origin = CENTRE, accent = null } = ELEMENT_LAYOUT[element.id];
		return {
			id: element.id,
			type: 'element',
			position: { x, y },
			origin,
			...FIXED,
			data: {
				label: element.label,
				zone: element.zone,
				items: element.items ?? null,
				width,
				accent,
				inScope: scope.includes(element.id)
			}
		};
	});
}

function zoneLabelNodes(content) {
	const labelled = [...content.zones, ...content.subzones].filter((zone) => ZONE_LABELS[zone.id]);
	return labelled.map((zone) => {
		const { x, y, align } = ZONE_LABELS[zone.id];
		return {
			id: `zone:${zone.id}`,
			type: 'zone',
			position: { x, y },
			origin: [align === 'middle' ? 0.5 : 0, 0.5],
			...FIXED,
			data: { label: zone.label, zone: zone.zone ?? zone.id, sub: Boolean(zone.zone) }
		};
	});
}

function objectiveNode() {
	return {
		id: OBJECTIVE_ID,
		type: 'objective',
		position: { x: OBJECTIVE.x, y: OBJECTIVE.y },
		origin: [0, 0],
		...FIXED,
		data: { width: OBJECTIVE.width }
	};
}

export function cardNode(card, position, note = '', id = newId('card')) {
	return {
		id,
		type: 'card',
		position,
		origin: CENTRE,
		connectable: false,
		data: { ref: card.id, kind: card.kind, label: card.label, width: CARD_WIDTH, note }
	};
}

export function noteNode(position, text = '', id = newId('note')) {
	return { id, type: 'note', position, origin: CENTRE, connectable: false, data: { text } };
}

export function linkEdge(sourceId, elementId) {
	return { id: `${sourceId}->${elementId}`, source: sourceId, target: elementId, type: 'straight' };
}

export function isLinked(edges, sourceId, elementId) {
	return edges.some((edge) => edge.source === sourceId && edge.target === elementId);
}

/** Nodes the user placed, as opposed to the fixed diagram. */
export function isPlaced(node) {
	return node.type === 'card' || node.type === 'note';
}

const DOCK_TOLERANCE = 24;

/**
 * The first docking spot of an element that no card or note occupies, so a
 * card added to an element never lands on the element or on another card.
 * `exceptId` is the card being docked, which must not block its own spot.
 */
export function freeDockPosition(nodes, elementId, exceptId = null) {
	const placed = nodes.filter((node) => isPlaced(node) && node.id !== exceptId);
	for (let index = 0; ; index++) {
		const spot = dockPosition(elementId, index);
		const taken = placed.some(
			(node) =>
				Math.abs(node.position.x - spot.x) < DOCK_TOLERANCE &&
				Math.abs(node.position.y - spot.y) < DOCK_TOLERANCE
		);
		if (!taken) return spot;
	}
}

export function scopeOf(nodes) {
	return nodes.filter((node) => node.type === 'element' && node.data.inScope).map((node) => node.id);
}

/** Nodes with exactly these elements in scope. */
export function withScope(nodes, scope) {
	const inScope = new Set(scope);
	return nodes.map((node) =>
		node.type !== 'element' || node.data.inScope === inScope.has(node.id)
			? node
			: { ...node, data: { ...node.data, inScope: inScope.has(node.id) } }
	);
}

export function toPlan({ title, profile, nodes, edges }) {
	return {
		format: PLAN_FORMAT,
		version: PLAN_VERSION,
		saved: new Date().toISOString(),
		title,
		profile,
		scope: scopeOf(nodes),
		cards: nodes.filter(isPlaced).map((node) => ({
			id: node.id,
			type: node.type,
			ref: node.data.ref ?? null,
			x: Math.round(node.position.x),
			y: Math.round(node.position.y),
			note: node.type === 'card' ? node.data.note : node.data.text
		})),
		links: edges.map((edge) => ({ from: edge.source, to: edge.target }))
	};
}

function boardNodes(content, scope) {
	return [...zoneLabelNodes(content), ...elementNodes(content, scope), objectiveNode()];
}

/**
 * Rebuild the board from a stored plan. Cards whose content has been removed
 * since the plan was saved are dropped with their links, and counted in
 * `dropped`; plans from the first version of the planner keep only their
 * notes, title and the elements that still exist.
 */
export function fromPlan(plan, content) {
	if (plan?.format !== PLAN_FORMAT) throw new Error('This file is not a Foodshed Planner plan.');
	const cards = [];
	let dropped = 0;
	for (const saved of plan.cards ?? []) {
		const position = { x: saved.x, y: saved.y };
		if (saved.type === 'note') cards.push(noteNode(position, saved.note ?? '', saved.id));
		else if (content.cardsById.has(saved.ref)) {
			cards.push(cardNode(content.cardsById.get(saved.ref), position, saved.note ?? '', saved.id));
		} else dropped++;
	}
	const sources = new Set(cards.map((node) => node.id));
	const edges = (plan.links ?? [])
		.filter((link) => sources.has(link.from) && content.elementsById.has(link.to))
		.map((link) => linkEdge(link.from, link.to));
	const scope = (plan.scope ?? []).filter((id) => content.elementsById.has(id));
	return {
		title: plan.title ?? '',
		profile: normaliseProfile(plan.profile, content),
		nodes: [...boardNodes(content, scope), ...cards],
		edges,
		dropped
	};
}

export function emptyPlan(content) {
	return { title: '', profile: emptyProfile(), nodes: boardNodes(content, []), edges: [] };
}

// Storage can be unavailable (private windows, blocked site data); the board
// then still works, it just does not survive a reload.
export function loadStoredPlan() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function storePlan(plan) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
	} catch {
		// Reported once by canStorePlans; nothing more to do per save.
	}
}

export function canStorePlans() {
	try {
		localStorage.setItem(`${STORAGE_KEY}:test`, '1');
		localStorage.removeItem(`${STORAGE_KEY}:test`);
		return true;
	} catch {
		return false;
	}
}
