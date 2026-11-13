/**
 * Geometry of the planner board: the food-system diagram drawn behind the
 * cards, where each food-system element sits on it, and where cards dock
 * when they are added to an element from a suggestion. Coordinates are flow
 * units; element and card positions are node centres.
 */

export const DRIVERS = { x: 0, y: 0, width: 280, height: 560 };
export const ACTIVITIES = { cx: 760, cy: 280, r: 280, ring: 190 };
export const OUTCOMES = { x: 1240, y: 0, width: 300, height: 560 };
export const FOOD_SECURITY = { x: 1258, y: 60, width: 264, height: 340 };
export const RESILIENCE = { x: 0, y: 700, width: 1540, height: 170 };
export const TITLE = { x: 0, y: -122 };

// What fitView and the PNG export frame: the diagram plus its title.
export const BOARD_BOUNDS = { x: -24, y: -170, width: 1588, height: 1064 };

export const ELEMENT_WIDTH = { drivers: 236, activities: 152, outcomes: 220, resilience: 196 };
export const CARD_WIDTH = 184;
// Footprints used to find free space for a new card or note before it renders.
export const CARD_SIZE = { width: CARD_WIDTH, height: 56 };
export const NOTE_SIZE = { width: 200, height: 120 };

const ring = (deg) => ({
	x: ACTIVITIES.cx + ACTIVITIES.ring * Math.cos((deg * Math.PI) / 180),
	y: ACTIVITIES.cy + ACTIVITIES.ring * Math.sin((deg * Math.PI) / 180)
});

// The activity ring runs producing -> processing -> distributing -> retailing
// -> consuming -> waste and back, anticlockwise from the lower left.
export const ACTIVITY_ORDER = [
	'producing',
	'processing',
	'distributing',
	'retailing',
	'consuming',
	'waste'
];
const RING_ANGLES = [120, 60, 0, 300, 240, 180];

export const ELEMENT_POSITIONS = {
	environment: { x: 140, y: 100 },
	society: { x: 140, y: 210 },
	food_system_conditions: { x: 140, y: 320 },
	shocks: { x: 140, y: 450 },
	...Object.fromEntries(ACTIVITY_ORDER.map((id, i) => [id, ring(RING_ANGLES[i])])),
	availability: { x: 1390, y: 130 },
	access: { x: 1390, y: 200 },
	utilisation: { x: 1390, y: 270 },
	stability: { x: 1390, y: 340 },
	sustainability: { x: 1390, y: 470 },
	absorptive: { x: 470, y: 790 },
	adaptive: { x: 760, y: 790 },
	transformative: { x: 1050, y: 790 }
};

// First docking spot of cards added to an element, and the step to the next.
const DOCKS = {
	environment: { x: -140, y: 100, dx: -200, dy: 0 },
	society: { x: -140, y: 210, dx: -200, dy: 0 },
	food_system_conditions: { x: -140, y: 320, dx: -200, dy: 0 },
	shocks: { x: -140, y: 450, dx: -200, dy: 0 },
	producing: { x: 560, y: 630, dx: -200, dy: 0 },
	processing: { x: 960, y: 630, dx: 200, dy: 0 },
	distributing: { x: 1140, y: 400, dx: 0, dy: 66 },
	retailing: { x: 960, y: -50, dx: 200, dy: 0 },
	consuming: { x: 560, y: -50, dx: -200, dy: 0 },
	waste: { x: 380, y: 400, dx: 0, dy: 66 },
	availability: { x: 1660, y: 130, dx: 200, dy: 0 },
	access: { x: 1660, y: 200, dx: 200, dy: 0 },
	utilisation: { x: 1660, y: 270, dx: 200, dy: 0 },
	stability: { x: 1660, y: 340, dx: 200, dy: 0 },
	sustainability: { x: 1660, y: 470, dx: 200, dy: 0 },
	absorptive: { x: 470, y: 950, dx: 0, dy: 66 },
	adaptive: { x: 760, y: 950, dx: 0, dy: 66 },
	transformative: { x: 1050, y: 950, dx: 0, dy: 66 }
};

export function dockPosition(elementId, index) {
	const dock = DOCKS[elementId];
	return { x: dock.x + dock.dx * index, y: dock.y + dock.dy * index };
}

/** Arrowheads midway between neighbouring activities, pointing along the ring. */
export function ringArrows() {
	return RING_ANGLES.map((deg) => {
		const mid = deg - 30;
		const rad = (mid * Math.PI) / 180;
		const rotate = (Math.atan2(-Math.cos(rad), Math.sin(rad)) * 180) / Math.PI;
		return { ...ring(mid), rotate };
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
