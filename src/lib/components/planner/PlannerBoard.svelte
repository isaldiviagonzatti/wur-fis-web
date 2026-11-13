<!--
  PlannerBoard — the interactive board: the food-system diagram, its fixed
  elements, and the cards and notes the user places. Dropping a card from the
  library, or dragging a card onto an element, docks it there. While the user
  has not panned or zoomed, the board stays fitted when its space changes, as
  when a side panel is shown or hidden. Must be inside a SvelteFlowProvider.
-->
<script>
	import {
		Background,
		BackgroundVariant,
		ControlButton,
		Controls,
		SvelteFlow,
		useSvelteFlow
	} from '@xyflow/svelte';
	import Maximize from '@lucide/svelte/icons/maximize';
	import '@xyflow/svelte/dist/style.css';
	import '$lib/styles/planner.css';
	import BoardBackground from './BoardBackground.svelte';
	import CardNode from './CardNode.svelte';
	import ElementNode from './ElementNode.svelte';
	import NoteNode from './NoteNode.svelte';
	import { BOARD_BOUNDS, spiralOffsets } from '$lib/planner/board-layout.js';
	import { CARD_DRAG_TYPE } from '$lib/planner/card-kinds.js';
	import { downloadBoardPng } from '$lib/planner/plan-export.js';
	import { theme } from '$lib/theme.svelte.js';

	let {
		nodes = $bindable(),
		edges = $bindable(),
		title = '',
		onselect,
		ondropcard,
		ondock
	} = $props();

	const nodeTypes = { element: ElementNode, card: CardNode, note: NoteNode };
	const { screenToFlowPosition, getIntersectingNodes, getNodesBounds, fitBounds } =
		useSvelteFlow();

	let container;
	let width = $state(0);
	let height = $state(0);
	let movedByUser = false;

	const FREE_SPACE_MARGIN = 16;

	// The board is framed by its own bounds, not by its nodes, so the zone boxes
	// and title are never cut off. Fitting needs both the container size and the
	// initialised viewport; this effect and `oninit` each fit, so whichever comes
	// last frames the board correctly.
	$effect(() => {
		if (width && height && !movedByUser) fitBoard();
	});

	// Programmatic moves (fits) carry no event; wheel, drag and pinch do. A
	// click on the board starts a pan gesture but no move, so it is not counted.
	// The zoom buttons are programmatic, so they are caught by their click.
	function onmove(event) {
		if (event) movedByUser = true;
	}

	function onclickcapture(event) {
		if (event.target.closest('.svelte-flow__controls-zoomin, .svelte-flow__controls-zoomout')) {
			movedByUser = true;
		}
	}

	function elementUnder(nodeOrRect) {
		return getIntersectingNodes(nodeOrRect).find((node) => node.type === 'element');
	}

	function ondragover(event) {
		if (!event.dataTransfer.types.includes(CARD_DRAG_TYPE)) return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
	}

	function ondrop(event) {
		const ref = event.dataTransfer.getData(CARD_DRAG_TYPE);
		if (!ref) return;
		event.preventDefault();
		const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
		const element = elementUnder({ x: position.x - 2, y: position.y - 2, width: 4, height: 4 });
		ondropcard(ref, position, element?.id);
	}

	function onnodedragstop({ targetNode }) {
		if (!targetNode || targetNode.type === 'element') return;
		const element = elementUnder(targetNode);
		if (element) ondock(targetNode.id, element.id);
	}

	export function fitBoard() {
		movedByUser = false;
		fitBounds(BOARD_BOUNDS, { padding: 0.03 });
	}

	export function viewCentre() {
		const rect = container.getBoundingClientRect();
		return screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
	}

	/** The free spot nearest the centre of the view for a node of this size. */
	export function freeSpot(size) {
		const centre = viewCentre();
		for (const offset of spiralOffsets()) {
			const x = centre.x + offset.x;
			const y = centre.y + offset.y;
			const rect = {
				x: x - size.width / 2 - FREE_SPACE_MARGIN,
				y: y - size.height / 2 - FREE_SPACE_MARGIN,
				width: size.width + 2 * FREE_SPACE_MARGIN,
				height: size.height + 2 * FREE_SPACE_MARGIN
			};
			if (!getIntersectingNodes(rect).length) return { x, y };
		}
		return centre;
	}

	export function downloadPng() {
		const placed = nodes.filter((node) => node.type !== 'element');
		return downloadBoardPng({
			viewportElement: container.querySelector('.svelte-flow__viewport'),
			boardBounds: BOARD_BOUNDS,
			nodesBounds: placed.length ? getNodesBounds(placed) : { width: 0 },
			title
		});
	}
</script>

<div
	class="planner-board"
	bind:this={container}
	bind:clientWidth={width}
	bind:clientHeight={height}
	{ondragover}
	{ondrop}
	{onclickcapture}
	role="presentation"
>
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		colorMode={theme.dark ? 'dark' : 'light'}
		minZoom={0.2}
		maxZoom={2}
		deleteKey={['Backspace', 'Delete']}
		elevateNodesOnSelect
		oninit={fitBoard}
		onnodeclick={({ node }) => onselect(node.id)}
		onpaneclick={() => onselect(null)}
		{onnodedragstop}
		{onmove}
	>
		<BoardBackground {title} />
		<Background variant={BackgroundVariant.Dots} gap={24} size={1} patternColor="var(--border)" />
		<Controls showLock={false} showFitView={false} position="bottom-left">
			<ControlButton onclick={fitBoard} title="Fit the board" aria-label="Fit the board">
				<Maximize size={12} />
			</ControlButton>
		</Controls>
	</SvelteFlow>
</div>

<style>
	.planner-board {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
