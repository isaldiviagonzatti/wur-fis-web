<!--
  ElementNode — a food-system element on the planner board. Fixed in place;
  clicking it opens its definition. A filled marker shows it is in the plan's
  scope, and the count shows how many cards and notes are linked to it.
-->
<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import Check from '@lucide/svelte/icons/check';

	let { data, selected } = $props();

	const connections = useNodeConnections({ handleType: 'target' });
	const linked = $derived(connections.current.length);
</script>

<div
	class={['element', data.inScope && 'in-scope', selected && 'selected']}
	style:width="{data.width}px"
	style:--zone="var(--zone-{data.zone})"
>
	<span class="marker">
		{#if data.inScope}<Check size={10} strokeWidth={3} />{/if}
	</span>
	<span class="label">{data.label}</span>
	{#if linked}
		<span class="count" title="{linked} linked">{linked}</span>
	{/if}
	<Handle type="target" position={Position.Top} class="center-handle" isConnectable={false} />
</div>

<style>
	.element {
		display: flex;
		align-items: center;
		gap: 8px;
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

	.element:hover {
		border-color: var(--zone);
	}

	.element.in-scope {
		background: color-mix(in oklab, var(--zone) 14%, var(--background));
		border-color: var(--zone);
		font-weight: 500;
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
</style>
