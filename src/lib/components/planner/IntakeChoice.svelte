<!--
  IntakeChoice — one answer to an opening question of the planner: a shaded
  tile with the name of the option, large, that toggles on click, with a
  check box (`multiple`) or a round mark (one answer). Its definition is
  behind an info icon, for those who want it. Without `onclick` the tile only
  shows its state, and `children` (a drop-down, say) make the choice.
-->
<script>
	import Check from '@lucide/svelte/icons/check';
	import InfoTip from '$lib/components/InfoTip.svelte';

	let {
		label,
		sublabel = '',
		definition = '',
		source = '',
		selected = false,
		multiple = true,
		accent = null,
		onclick = null,
		children
	} = $props();

	const row = $derived([
		'flex min-h-14 w-full items-center gap-3 rounded-md py-3 pl-3 text-left',
		definition ? 'pr-10' : 'pr-3'
	]);
</script>

{#snippet name()}
	<span
		class={[
			'grid size-4 shrink-0 place-items-center border',
			multiple ? 'rounded-[4px]' : 'rounded-full',
			selected ? 'border-foreground bg-foreground text-background' : 'border-foreground/40'
		]}
	>
		{#if selected}<Check size={11} strokeWidth={3} />{/if}
	</span>
	<span class="min-w-0">
		<span class="flex items-center gap-2">
			{#if accent}
				<span class="size-2.5 shrink-0 rounded-full" style:background={accent}></span>
			{/if}
			<span class="text-base leading-tight font-semibold text-foreground">{label}</span>
		</span>
		{#if sublabel}<span class="mt-0.5 block text-xs text-foreground/75">{sublabel}</span>{/if}
	</span>
{/snippet}

<div
	class={[
		'relative flex flex-col gap-2 rounded-md transition-colors',
		selected ? 'bg-surface-tint-strong' : 'bg-surface-tint',
		onclick && !selected && 'hover:bg-surface-tint-strong/60',
		children && 'pb-3'
	]}
>
	{#if onclick}
		<button
			type="button"
			aria-pressed={selected}
			{onclick}
			class={[
				row,
				'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring'
			]}
		>
			{@render name()}
		</button>
	{:else}
		<div class={row}>{@render name()}</div>
	{/if}
	{#if definition}
		<InfoTip
			text={definition}
			{source}
			label="What is {label}?"
			class="absolute top-2.5 right-2.5 rounded p-1 text-foreground"
		/>
	{/if}
	{#if children}
		<div class="px-3">{@render children()}</div>
	{/if}
</div>
