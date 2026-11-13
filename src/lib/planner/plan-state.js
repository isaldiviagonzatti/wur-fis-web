/**
 * A plan as the board holds it (Svelte Flow nodes and edges) and as it is
 * stored (a small plain object). Food-system elements are rebuilt from the
 * content on every load; only the user's cards, notes, links, scope and title
 * are saved, so a plan file stays valid when the content is updated.
 */
import { CARD_WIDTH, ELEMENT_POSITIONS, ELEMENT_WIDTH, dockPosition } from './board-layout.js';

export const PLAN_FORMAT = 'fis-foodshed-plan';
const PLAN_VERSION = 1;
const STORAGE_KEY = 'fis-foodshed-planner:v1';

const CENTRE = [0.5, 0.5];

function newId(prefix) {
	return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function elementNodes(content, scope = []) {
	return content.elements
		.filter((element) => ELEMENT_POSITIONS[element.id])
		.map((element) => ({
			id: element.id,
			type: 'element',
			position: ELEMENT_POSITIONS[element.id],
			origin: CENTRE,
			draggable: false,
			deletable: false,
			connectable: false,
			data: {
				label: element.label,
				zone: element.zone,
				width: ELEMENT_WIDTH[element.zone],
				inScope: scope.includes(element.id)
			}
		}));
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

const DOCK_TOLERANCE = 24;

/**
 * The first docking spot of an element that no card or note occupies, so a
 * card added to an element never lands on the element or on another card.
 * `exceptId` is the card being docked, which must not block its own spot.
 */
export function freeDockPosition(nodes, elementId, exceptId = null) {
	const placed = nodes.filter((node) => node.type !== 'element' && node.id !== exceptId);
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

export function toPlan({ title, nodes, edges }) {
	return {
		format: PLAN_FORMAT,
		version: PLAN_VERSION,
		saved: new Date().toISOString(),
		title,
		scope: scopeOf(nodes),
		cards: nodes
			.filter((node) => node.type === 'card' || node.type === 'note')
			.map((node) => ({
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

/**
 * Rebuild the board from a stored plan. Cards whose content has been removed
 * since the plan was saved are dropped, and so are their links.
 */
export function fromPlan(plan, content) {
	if (plan?.format !== PLAN_FORMAT) throw new Error('This file is not a Foodshed Planner plan.');
	const cards = [];
	for (const saved of plan.cards ?? []) {
		const position = { x: saved.x, y: saved.y };
		if (saved.type === 'note') cards.push(noteNode(position, saved.note ?? '', saved.id));
		else if (content.cardsById.has(saved.ref)) {
			cards.push(cardNode(content.cardsById.get(saved.ref), position, saved.note ?? '', saved.id));
		}
	}
	const sources = new Set(cards.map((node) => node.id));
	const edges = (plan.links ?? [])
		.filter((link) => sources.has(link.from) && content.elementsById.has(link.to))
		.map((link) => linkEdge(link.from, link.to));
	return {
		title: plan.title ?? '',
		nodes: [...elementNodes(content, plan.scope ?? []), ...cards],
		edges
	};
}

export function emptyPlan(content) {
	return { title: '', nodes: elementNodes(content), edges: [] };
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
