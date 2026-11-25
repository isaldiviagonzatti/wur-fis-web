<!--
  ElementNode — a food-system element on the planner board. Fixed in place;
  clicking it opens its definition. A filled marker shows it is in the plan's
  scope, a dashed ring that it is suggested for the plan, and the count
  how many cards and notes are linked to it. Drivers are boxes that list
  their drivers; every other element is a pill.
-->
<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import Check from '@lucide/svelte/icons/check';
	import { getPlanner } from '$lib/planner/planner-context.js';

	let { id, data, selected } = $props();

	const planner = getPlanner();
	const connections = useNodeConnections({ handleType: 'target' });
	const linked = $derived(connections.current.length);
	const suggested = $derived(!data.inScope && planner.suggested.has(id));
</script>

<div
	class={[
		'element',
		data.items && 'box',
		data.inScope && 'in-scope',
		suggested && 'suggested',
		selected && 'selected'
	]}
	style:width="{data.width}px"
	style:--zone={data.accent ?? `var(--zone-${data.zone})`}
	title={suggested ? 'Suggested for your plan' : undefined}
>
	<div class="head">
		<span class="marker">
			{#if data.inScope}<Check size={10} strokeWidth={3} />{/if}
		</span>
		<span class="label">{data.label}</span>
		{#if linked}
			<span class="count" title="{linked} linked">{linked}</span>
		{/if}
	</div>
	{#if data.items}
		<ul>
			{#each data.items as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
	<Handle type="target" position={Position.Top} class="center-handle" isConnectable={false} />
</div>

<style>
	.element {
		padding: 7px 12px 7px 9px;
		border-radius: 999px;
		background: var(--background);
		border: 1px solid color-mix(in oklab, var(--zone) 45%, var(--border));
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
		color: var(--foreground);
		font-size: 12.5px;
		line-height: 1.25;
		cursor: pointer;
		transition:
			background-color 120ms,
			box-shadow 120ms;
	}

	.element.box {
		padding: 9px 12px 10px 10px;
		border-radius: 14px;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.element:hover {
		border-color: var(--zone);
	}

	.element.in-scope {
		background: color-mix(in oklab, var(--zone) 14%, var(--background));
		border-color: var(--zone);
	}

	.in-scope .label {
		font-weight: 500;
	}

	.element.suggested {
		outline: 1.5px dashed var(--planner-recommended);
		outline-offset: 3px;
	}

	.element.selected {
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--zone) 35%, transparent);
	}

	.marker {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 14px;
		height: 14px;
		border-radius: 999px;
		border: 1.5px solid var(--zone);
		color: var(--background);
	}

	.in-scope .marker {
		background: var(--zone);
	}

	.label {
		flex: 1;
	}

	.box .label {
		font-weight: 600;
	}

	.count {
		min-width: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background: color-mix(in oklab, var(--zone) 18%, var(--background));
		color: var(--foreground);
		font-size: 10.5px;
		font-weight: 600;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	ul {
		margin: 6px 0 0 22px;
		padding: 0;
		list-style: disc;
		color: var(--muted-foreground);
		font-size: 11.5px;
		line-height: 1.35;
	}

	li + li {
		margin-top: 2px;
	}

	li::marker {
		color: color-mix(in oklab, var(--zone) 70%, var(--muted-foreground));
	}
</style>
