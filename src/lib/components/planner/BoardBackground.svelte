<!--
  BoardBackground — the food-system diagram drawn behind the planner's cards:
  drivers, the ring of activities, outcomes, and the band of feedbacks and
  resilience capacities. Rendered in flow coordinates under the edges, so it
  pans and zooms with the board and is part of the PNG export.
-->
<script>
	import { ViewportPortal } from '@xyflow/svelte';
	import { SITE_NAME } from '$lib/navigation.js';
	import {
		ACTIVITIES,
		BOARD_BOUNDS as B,
		DRIVERS,
		FOOD_SECURITY,
		OUTCOMES,
		RESILIENCE,
		TITLE,
		ringArrows
	} from '$lib/planner/board-layout.js';

	let { title = '' } = $props();

	const arrows = ringArrows();
	const flowY = ACTIVITIES.cy;
	const feedbackY = RESILIENCE.y + RESILIENCE.height - 26;
</script>

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
			Foodshed Planner · {SITE_NAME}
		</text>

		<g style:--zone="var(--zone-drivers)">
			<rect
				class="zone"
				x={DRIVERS.x}
				y={DRIVERS.y}
				width={DRIVERS.width}
				height={DRIVERS.height}
				rx="28"
			/>
			<text class="zone-label" x={DRIVERS.x + 24} y={DRIVERS.y + 38}>Drivers</text>
		</g>

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
			<text
				class="zone-label"
				x={ACTIVITIES.cx}
				y={ACTIVITIES.cy - ACTIVITIES.r + 42}
				text-anchor="middle">Activities</text
			>
		</g>

		<g style:--zone="var(--zone-outcomes)">
			<rect
				class="zone"
				x={OUTCOMES.x}
				y={OUTCOMES.y}
				width={OUTCOMES.width}
				height={OUTCOMES.height}
				rx="28"
			/>
			<rect
				class="subzone"
				x={FOOD_SECURITY.x}
				y={FOOD_SECURITY.y}
				width={FOOD_SECURITY.width}
				height={FOOD_SECURITY.height}
				rx="20"
			/>
			<text class="zone-label" x={OUTCOMES.x + 24} y={OUTCOMES.y + 38}>Outcomes</text>
			<text class="subzone-label" x={FOOD_SECURITY.x + 18} y={FOOD_SECURITY.y + 30}>
				Food security
			</text>
		</g>

		<path
			class="flow-arrow"
			d="M {DRIVERS.x + DRIVERS.width + 16} {flowY} L {ACTIVITIES.cx - ACTIVITIES.r - 16} {flowY}"
			marker-end="url(#planner-arrow)"
		/>
		<path
			class="flow-arrow"
			d="M {ACTIVITIES.cx + ACTIVITIES.r + 16} {flowY} L {OUTCOMES.x - 16} {flowY}"
			marker-end="url(#planner-arrow)"
		/>

		<g style:--zone="var(--zone-resilience)">
			<rect
				class="zone"
				x={RESILIENCE.x}
				y={RESILIENCE.y}
				width={RESILIENCE.width}
				height={RESILIENCE.height}
				rx="28"
			/>
			<text class="zone-label" x={RESILIENCE.x + 24} y={RESILIENCE.y + 38}>
				Feedbacks and resilience
			</text>
			<path
				class="feedback-arrow"
				d="M {RESILIENCE.x + RESILIENCE.width - 48} {feedbackY} L {RESILIENCE.x + 48} {feedbackY}"
				marker-end="url(#planner-arrow)"
			/>
			<text
				class="feedback-label"
				x={RESILIENCE.x + RESILIENCE.width - 60}
				y={feedbackY - 9}
				text-anchor="end">Feedbacks to drivers and activities</text
			>
		</g>
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

	.zone-label {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		fill: color-mix(in oklab, var(--zone) 80%, var(--foreground));
	}

	.subzone-label {
		font-size: 12px;
		font-weight: 500;
		fill: color-mix(in oklab, var(--zone) 70%, var(--foreground));
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
		stroke: color-mix(in oklab, var(--zone) 45%, transparent);
		stroke-dasharray: 6 5;
	}

	.feedback-label {
		font-size: 12px;
		fill: color-mix(in oklab, var(--zone) 70%, var(--foreground));
	}

	:global(.planner .arrow-head) {
		fill: var(--planner-line);
	}
</style>
