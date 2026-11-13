/**
 * Icons of the planner's card kinds, shared by the board, the library and the
 * detail panel.
 */
import Database from '@lucide/svelte/icons/database';
import Gauge from '@lucide/svelte/icons/gauge';
import StickyNote from '@lucide/svelte/icons/sticky-note';
import Workflow from '@lucide/svelte/icons/workflow';

export const KIND_ICONS = {
	method: Workflow,
	indicator: Gauge,
	data: Database,
	note: StickyNote
};

// Drag-and-drop payload type for cards dragged from the library onto the board.
export const CARD_DRAG_TYPE = 'application/x-fis-planner-card';
export const NOTE_REF = 'note';
