<!--
  ObjectiveNode — the objective of the plan, at the bottom of the board,
  written here or in the opening questions. The text area is excluded from
  dragging and from zooming the board.
-->
<script>
	import Target from '@lucide/svelte/icons/target';
	import { getPlanner } from '$lib/planner/planner-context.js';

	let { data } = $props();

	const planner = getPlanner();
</script>

<div class="objective" style:width="{data.width}px">
	<label>
		<span class="heading"><Target size={13} />Objective of the plan</span>
		<textarea
			class="nodrag nowheel"
			rows="2"
			placeholder="What should this plan achieve?"
			value={planner.objective}
			oninput={(event) => planner.setObjective(event.currentTarget.value)}
		></textarea>
	</label>
</div>

<style>
	.objective {
		padding: 12px 16px 10px;
		border-radius: 14px;
		background: var(--surface-tint);
		color: var(--foreground);
		cursor: default;
	}

	.heading {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	textarea {
		display: block;
		width: 100%;
		margin-top: 6px;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 16px;
		line-height: 1.45;
		resize: vertical;
		outline: none;
	}

	textarea::placeholder {
		color: var(--muted-foreground);
	}
</style>
