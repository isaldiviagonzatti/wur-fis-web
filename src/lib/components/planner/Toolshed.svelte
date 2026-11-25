<!--
  Toolshed — the panel under the planner board: the library of methods,
  indicators and data on the left, and on the right the details of what is
  selected on the board, or the plan overview. Its top edge is a handle that
  resizes it against the board (drag, or arrow keys when focused), and it
  folds down to its header. In a narrow panel the two parts take turns,
  switched by `view`.
-->
<script>
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';

	let {
		height = $bindable(340),
		collapsed = $bindable(false),
		view = $bindable('library'),
		actions,
		library,
		detail
	} = $props();

	const MIN_HEIGHT = 180;
	const KEY_STEP = 32;
	let drag = null;

	function maxHeight() {
		return Math.round(window.innerHeight * 0.75);
	}

	function resize(to) {
		height = Math.min(maxHeight(), Math.max(MIN_HEIGHT, Math.round(to)));
		collapsed = false;
	}

	function onpointerdown(event) {
		event.currentTarget.setPointerCapture(event.pointerId);
		drag = { y: event.clientY, height: collapsed ? MIN_HEIGHT : height };
	}

	function onpointermove(event) {
		if (drag) resize(drag.height + drag.y - event.clientY);
	}

	function onkeydown(event) {
		if (event.key === 'ArrowUp') resize(height + KEY_STEP);
		else if (event.key === 'ArrowDown') resize(height - KEY_STEP);
		else return;
		event.preventDefault();
	}
</script>

{#snippet switcher(value, label)}
	<button
		class={[
			'cursor-pointer border-b-2 px-1 py-1 text-sm',
			view === value
				? 'border-foreground font-medium text-foreground'
				: 'border-transparent text-muted-foreground hover:text-foreground'
		]}
		aria-pressed={view === value}
		onclick={() => (view = value)}>{label}</button
	>
{/snippet}

<section
	class="@container flex shrink-0 flex-col"
	style:height={collapsed ? 'auto' : `${height}px`}
	aria-label="Toolshed"
>
	<button
		type="button"
		aria-label="Resize the toolshed: drag, or use the arrow keys"
		title="Drag to resize"
		class="group flex h-4 w-full shrink-0 cursor-row-resize touch-none items-center justify-center outline-none"
		{onpointerdown}
		{onpointermove}
		onpointerup={() => (drag = null)}
		{onkeydown}
	>
		<span
			class="h-1 w-12 rounded-full bg-border transition-colors group-hover:bg-muted-foreground group-focus-visible:bg-foreground"
		></span>
	</button>

	<div class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 pb-2">
		<h2 class="site-title text-sm font-semibold text-foreground">Toolshed</h2>
		{#if !collapsed}
			<div class="flex gap-3 @3xl:hidden">
				{@render switcher('library', 'Library')}
				{@render switcher('detail', 'Details')}
			</div>
		{/if}
		<div class="ml-auto flex items-center gap-1">
			{@render actions?.()}
			<button
				class="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
				aria-label={collapsed ? 'Open the toolshed' : 'Fold the toolshed'}
				title={collapsed ? 'Open the toolshed' : 'Fold the toolshed'}
				aria-expanded={!collapsed}
				onclick={() => (collapsed = !collapsed)}
			>
				{#if collapsed}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
			</button>
		</div>
	</div>

	{#if !collapsed}
		<div
			class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-x-8 @3xl:grid-cols-[19rem_minmax(0,1fr)]"
		>
			<div class={['flex min-h-0 flex-col', view === 'detail' && '@max-3xl:hidden']}>
				{@render library()}
			</div>
			<div
				class={[
					'min-h-0 overflow-y-auto rounded-md bg-surface-tint px-4 pt-3 pb-6',
					view === 'library' && '@max-3xl:hidden'
				]}
			>
				{@render detail()}
			</div>
		</div>
	{/if}
</section>
