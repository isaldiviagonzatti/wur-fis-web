<!--
  BoardBackground — the food-system diagram drawn behind the planner's cards:
  the drivers, the ring of activities and the outcomes, the feedbacks arching
  back over them, and below, resilience with its figure. Zone names, elements
  and the objective are nodes on top. Rendered in flow coordinates under the
  edges, so it pans and zooms with the board and is part of the PNG export.
-->
<script>
	import { ViewportPortal } from '@xyflow/svelte';
	import ResilienceFigure from './ResilienceFigure.svelte';
	import { SITE_NAME } from '$lib/navigation.js';
	import {
		ACTIVITIES,
		BOARD_BOUNDS as B,
		DRIVERS,
		FEEDBACK,
		OUTCOMES,
		RESILIENCE,
		RESILIENCE_FIGURE,
		SUBZONES,
		TITLE,
		ringArrows
	} from '$lib/planner/board-layout.js';

	let { title = '', byline = '', capacities = [] } = $props();

	const arrows = ringArrows();
	const flowY = ACTIVITIES.cy;
	const feedback = `M ${FEEDBACK.from.x} ${FEEDBACK.from.y} C ${FEEDBACK.from.x} ${FEEDBACK.peak}, ${FEEDBACK.to.x} ${FEEDBACK.peak}, ${FEEDBACK.to.x} ${FEEDBACK.to.y}`;
</script>

{#snippet zoneRect(zone, box, radius)}
	<rect
		class="zone"
		style:--zone="var(--zone-{zone})"
		x={box.x}
		y={box.y}
		width={box.width}
		height={box.height}
		rx={radius}
	/>
{/snippet}

<ViewportPortal target="back">
	<svg
		class="board-diagram"
		style:left="{B.x}px"
		style:top="{B.y}px"
		width={B.width}
		height={B.height}
		viewBox="{B.x} {B.y} {B.width} {B.height}"
		aria-hidden="true"
	>
		<defs>
			<marker
				id="planner-arrow"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="8"
				markerHeight="8"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" class="arrow-head" />
			</marker>
		</defs>

		<text x={TITLE.x} y={TITLE.y} class="title">{title || 'Untitled plan'}</text>
		<text x={TITLE.x} y={TITLE.y + 26} class="subtitle">
			{[byline, 'Foodshed Planner', SITE_NAME].filter(Boolean).join(' · ')}
		</text>

		{@render zoneRect('drivers', DRIVERS, 28)}

		<g style:--zone="var(--zone-activities)">
			<circle class="zone" cx={ACTIVITIES.cx} cy={ACTIVITIES.cy} r={ACTIVITIES.r} />
			<circle class="ring" cx={ACTIVITIES.cx} cy={ACTIVITIES.cy} r={ACTIVITIES.ring} />
			{#each arrows as arrow (arrow.rotate)}
				<path
					class="ring-arrow"
					d="M -5 -4.5 L 5 0 L -5 4.5 z"
					transform="translate({arrow.x} {arrow.y}) rotate({arrow.rotate})"
				/>
			{/each}
		</g>

		{@render zoneRect('outcomes', OUTCOMES, 28)}
		{@render zoneRect('resilience', RESILIENCE, 28)}
		{#each Object.entries(SUBZONES) as [id, box] (id)}
			<rect
				class="subzone"
				style:--zone="var(--zone-{box.zone})"
				x={box.x}
				y={box.y}
				width={box.width}
				height={box.height}
				rx="18"
			/>
		{/each}

		<path
			class="flow-arrow"
			d="M {DRIVERS.x + DRIVERS.width + 14} {flowY} L {ACTIVITIES.cx - ACTIVITIES.r - 14} {flowY}"
			marker-end="url(#planner-arrow)"
		/>
		<path
			class="flow-arrow"
			d="M {ACTIVITIES.cx + ACTIVITIES.r + 14} {flowY} L {OUTCOMES.x - 14} {flowY}"
			marker-end="url(#planner-arrow)"
		/>
		<path class="feedback-arrow" d={feedback} marker-end="url(#planner-arrow)" />

		<ResilienceFigure {...RESILIENCE_FIGURE} active={capacities} />
	</svg>
</ViewportPortal>

<style>
	.board-diagram {
		position: absolute;
		overflow: visible;
		pointer-events: none;
		font-family: inherit;
	}

	.title {
		font-size: 30px;
		font-weight: 600;
		letter-spacing: -0.01em;
		fill: var(--foreground);
	}

	.subtitle {
		font-size: 14px;
		fill: var(--muted-foreground);
	}

	.zone {
		fill: color-mix(in oklab, var(--zone) 7%, var(--background));
		stroke: color-mix(in oklab, var(--zone) 35%, transparent);
		stroke-width: 1.25;
	}

	.subzone {
		fill: color-mix(in oklab, var(--zone) 6%, transparent);
		stroke: color-mix(in oklab, var(--zone) 30%, transparent);
		stroke-dasharray: 4 4;
	}

	.ring {
		fill: none;
		stroke: color-mix(in oklab, var(--zone) 45%, transparent);
		stroke-width: 1.5;
	}

	.ring-arrow {
		fill: color-mix(in oklab, var(--zone) 70%, transparent);
	}

	.flow-arrow,
	.feedback-arrow {
		fill: none;
		stroke: var(--planner-line);
		stroke-width: 1.5;
	}

	.feedback-arrow {
		stroke-dasharray: 6 5;
	}

	.arrow-head {
		fill: var(--planner-line);
	}
</style>
