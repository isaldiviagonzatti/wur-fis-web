/**
 * Geometry of the planner board, in flow units: the food-system diagram drawn
 * behind the cards, where each element and zone label sits on it, and where
 * cards dock when they are added to an element. Node positions are centres,
 * except where `origin` says otherwise. An element's `accent` replaces its
 * zone colour, tying the capacities to their lines in the resilience figure.
 *
 * Top row: drivers -> ring of activities -> outcomes, with feedbacks arching
 * back over it. Below: resilience, a figure of food security over time with
 * the capacities on its left and the structural properties on its right.
 * At the bottom: the objective of the plan.
 */

export const TITLE = { x: 0, y: -112 };
export const DRIVERS = { x: 0, y: 0, width: 290, height: 580 };
export const ACTIVITIES = { cx: 830, cy: 290, r: 270, ring: 182 };
export const OUTCOMES = { x: 1370, y: 0, width: 350, height: 580 };
export const RESILIENCE = { x: 0, y: 640, width: 1720, height: 270 };
export const OBJECTIVE = { x: 0, y: 950, width: 1720 };
export const FEEDBACK = { from: { x: 1545, y: -6 }, to: { x: 145, y: -6 }, peak: -74 };
// The resilience figure, drawn at 1:1 in its own 800 x 220 coordinates,
// centred between the capacities and the properties.
export const RESILIENCE_FIGURE = { x: 445, y: 680, width: 800, height: 220 };

export const SUBZONES = {
	food_security: { zone: 'outcomes', x: 1390, y: 56, width: 310, height: 236 },
	socio_economic: { zone: 'outcomes', x: 1390, y: 308, width: 310, height: 140 },
	environmental: { zone: 'outcomes', x: 1390, y: 464, width: 310, height: 92 },
	capacities: { zone: 'resilience', x: 20, y: 696, width: 280, height: 184 },
	properties: { zone: 'resilience', x: 1390, y: 696, width: 310, height: 184 }
};

// What fitView and the PNG export frame: the diagram, its title and the objective.
export const BOARD_BOUNDS = { x: -24, y: -150, width: 1768, height: 1220 };

export const CARD_WIDTH = 184;
// Footprints used to find free space for a new card or note before it renders.
export const CARD_SIZE = { width: CARD_WIDTH, height: 56 };
export const NOTE_SIZE = { width: 200, height: 120 };

// The ring runs clockwise from production at the upper left; angles in
// degrees, clockwise from the right as in screen coordinates.
export const ACTIVITY_ANGLES = {
	production: 210,
	distribution: 270,
	processing: 330,
	retailing_marketing: 30,
	consumption: 90,
	waste_management: 150
};

function onRing(deg, radius = ACTIVITIES.ring) {
	const rad = (deg * Math.PI) / 180;
	return { x: ACTIVITIES.cx + radius * Math.cos(rad), y: ACTIVITIES.cy + radius * Math.sin(rad) };
}

const TOP = [0.5, 0];

export const ELEMENT_LAYOUT = {
	production_supply: { x: 145, y: 62, width: 250, origin: TOP },
	distribution_trade: { x: 145, y: 256, width: 250, origin: TOP },
	consumption_demand: { x: 145, y: 386, width: 250, origin: TOP },
	...Object.fromEntries(
		Object.entries(ACTIVITY_ANGLES).map(([id, deg]) => [id, { ...onRing(deg), width: 156 }])
	),
	availability: { x: 1545, y: 120, width: 260 },
	access: { x: 1545, y: 168, width: 260 },
	utilisation: { x: 1545, y: 216, width: 260 },
	stability: { x: 1545, y: 264, width: 260 },
	economic: { x: 1545, y: 372, width: 260 },
	social: { x: 1545, y: 420, width: 260 },
	environmental: { x: 1545, y: 524, width: 260 },
	disturbances: { x: 640, y: 702, width: 190 },
	absorptive: { x: 160, y: 760, width: 240, accent: 'var(--cap-absorptive)' },
	adaptive: { x: 160, y: 806, width: 240, accent: 'var(--cap-adaptive)' },
	transformative: { x: 160, y: 852, width: 240, accent: 'var(--cap-transformative)' },
	connectivity: { x: 1545, y: 760, width: 260 },
	redundancy: { x: 1545, y: 806, width: 260 },
	diversity: { x: 1545, y: 852, width: 260 }
};

// Clickable labels of the zones and boxes; `align` is the text anchor.
export const ZONE_LABELS = {
	drivers: { x: 24, y: 34, align: 'start' },
	activities: { x: ACTIVITIES.cx, y: ACTIVITIES.cy - ACTIVITIES.r + 40, align: 'middle' },
	outcomes: { x: OUTCOMES.x + 24, y: 34, align: 'start' },
	resilience: { x: 24, y: RESILIENCE.y + 34, align: 'start' },
	feedbacks: { x: 1180, y: -50, align: 'middle' },
	food_security: { x: 1406, y: 84, align: 'start' },
	socio_economic: { x: 1406, y: 336, align: 'start' },
	environmental: { x: 1406, y: 492, align: 'start' },
	capacities: { x: 36, y: 724, align: 'start' },
	properties: { x: 1406, y: 724, align: 'start' }
};

// First docking spot of cards added to an element, and the step to the next.
const LEFT = { dx: -200, dy: 0 };
const RIGHT = { dx: 200, dy: 0 };
const UP = { dx: 0, dy: -66 };
const DOWN = { dx: 0, dy: 66 };
const DOCKS = {
	production_supply: { x: -130, y: 150, ...LEFT },
	distribution_trade: { x: -130, y: 310, ...LEFT },
	consumption_demand: { x: -130, y: 450, ...LEFT },
	production: { x: 470, y: 150, ...UP },
	distribution: { x: 830, y: -24, ...UP },
	processing: { x: 1190, y: 150, ...UP },
	retailing_marketing: { x: 1190, y: 430, ...DOWN },
	consumption: { x: 830, y: 608, ...RIGHT },
	waste_management: { x: 470, y: 430, ...DOWN },
	availability: { x: 1840, y: 120, ...RIGHT },
	access: { x: 1840, y: 168, ...RIGHT },
	utilisation: { x: 1840, y: 216, ...RIGHT },
	stability: { x: 1840, y: 264, ...RIGHT },
	economic: { x: 1840, y: 372, ...RIGHT },
	social: { x: 1840, y: 420, ...RIGHT },
	environmental: { x: 1840, y: 524, ...RIGHT },
	disturbances: { x: 610, y: 608, ...LEFT },
	absorptive: { x: -130, y: 760, ...LEFT },
	adaptive: { x: -130, y: 806, ...LEFT },
	transformative: { x: -130, y: 852, ...LEFT },
	connectivity: { x: 1840, y: 760, ...RIGHT },
	redundancy: { x: 1840, y: 806, ...RIGHT },
	diversity: { x: 1840, y: 852, ...RIGHT }
};

export function dockPosition(elementId, index) {
	const dock = DOCKS[elementId];
	return { x: dock.x + dock.dx * index, y: dock.y + dock.dy * index };
}

/** Arrowheads midway between neighbouring activities, pointing clockwise along the ring. */
export function ringArrows() {
	return Object.values(ACTIVITY_ANGLES).map((deg) => {
		const mid = deg + 30;
		const rad = (mid * Math.PI) / 180;
		const rotate = (Math.atan2(Math.cos(rad), -Math.sin(rad)) * 180) / Math.PI;
		return { ...onRing(mid), rotate };
	});
}

/** Offsets in widening rings around a point, nearest first, to search for free space. */
export function* spiralOffsets(step = 40, rings = 15) {
	yield { x: 0, y: 0 };
	for (let ring = 1; ring <= rings; ring++) {
		const count = 8 * ring;
		for (let i = 0; i < count; i++) {
			const angle = (2 * Math.PI * i) / count;
			yield { x: ring * step * Math.cos(angle), y: ring * step * Math.sin(angle) };
		}
	}
}
