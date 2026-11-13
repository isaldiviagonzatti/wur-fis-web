<!--
  NoteNode — a free-text note on the planner board. Drag it by its header;
  the text area is excluded from dragging and from zooming the board.
-->
<script>
	import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
	import StickyNote from '@lucide/svelte/icons/sticky-note';

	let { id, data, selected } = $props();

	const { updateNodeData } = useSvelteFlow();
</script>

<div class={['note', selected && 'selected']}>
	<div class="header">
		<StickyNote size={12} />
		<span>Note</span>
	</div>
	<textarea
		class="nodrag nowheel"
		rows="4"
		placeholder="Write a note"
		aria-label="Note text"
		value={data.text}
		oninput={(event) => updateNodeData(id, { text: event.currentTarget.value })}
	></textarea>
	<Handle type="source" position={Position.Top} class="center-handle" isConnectable={false} />
</div>

<style>
	.note {
		width: 200px;
		border-radius: 10px;
		background: var(--muted);
		border: 1px dashed color-mix(in oklab, var(--foreground) 30%, transparent);
		color: var(--foreground);
		cursor: grab;
	}

	.note.selected {
		border-style: solid;
		border-color: var(--foreground);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 6px 10px 0;
		color: var(--muted-foreground);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	textarea {
		display: block;
		width: 100%;
		padding: 4px 10px 8px;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12.5px;
		line-height: 1.35;
		resize: vertical;
		outline: none;
		cursor: text;
	}
</style>
