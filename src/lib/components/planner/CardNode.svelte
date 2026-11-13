<!--
  CardNode — a method, indicator or data card placed on the planner board.
-->
<script>
	import { Handle, Position } from '@xyflow/svelte';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import { KIND_ICONS } from '$lib/planner/card-kinds.js';
	import { KIND_LABELS } from '$lib/planner/planner-data.js';

	let { data, selected } = $props();

	const Icon = $derived(KIND_ICONS[data.kind]);
</script>

<div class={['card', selected && 'selected']} style:width="{data.width}px">
	<div class="kind">
		<Icon size={12} />
		<span>{KIND_LABELS[data.kind]}</span>
		{#if data.note}
			<span class="has-note" title="Has a note"><NotebookPen size={12} /></span>
		{/if}
	</div>
	<div class="label">{data.label}</div>
	<Handle type="source" position={Position.Top} class="center-handle" isConnectable={false} />
</div>

<style>
	.card {
		padding: 7px 10px 8px;
		border-radius: 10px;
		background: var(--card);
		border: 1px solid var(--border);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.07);
		color: var(--foreground);
		cursor: grab;
	}

	.card.selected {
		border-color: var(--foreground);
		box-shadow: 0 0 0 1px var(--foreground);
	}

	.kind {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--muted-foreground);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.has-note {
		margin-left: auto;
		display: inline-flex;
	}

	.label {
		margin-top: 3px;
		font-size: 12.5px;
		font-weight: 500;
		line-height: 1.3;
	}
</style>
