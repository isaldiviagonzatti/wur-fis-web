<!--
  LibraryList — the planner's library of methods, indicators and data, in the
  toolshed. What is recommended for the plan comes first, marked; everything
  else follows, most used first. The search also finds the variants under a
  card ("land footprint" finds Land resource demand). Cards are dragged onto
  the board, or added with the plus; clicking one shows it.
-->
<script>
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import SearchClearButton from '$lib/components/SearchClearButton.svelte';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { CARD_DRAG_TYPE, KIND_ICONS } from '$lib/planner/card-kinds.js';
	import { CARD_KINDS, searchCards } from '$lib/planner/planner-data.js';

	let { content, recommended, placedRefs, selectedRef = null, onpreview, onadd } = $props();

	let kind = $state('method');
	let query = $state('');

	const KIND_PLURALS = Object.fromEntries(CARD_KINDS.map((k) => [k.value, k.label.toLowerCase()]));
	const Icon = $derived(KIND_ICONS[kind]);
	const results = $derived(
		searchCards(content, kind, query).sort(
			(a, b) => b.card.papers.length - a.card.papers.length || a.card.label.localeCompare(b.card.label)
		)
	);
	const ranked = $derived(
		query ? [] : (recommended[kind] ?? []).map((item) => ({ card: item.entry, hit: null }))
	);
	const recommendedIds = $derived(new Set((recommended[kind] ?? []).map((item) => item.entry.id)));

	function startDrag(event, ref) {
		event.dataTransfer.setData(CARD_DRAG_TYPE, ref);
		event.dataTransfer.effectAllowed = 'copy';
	}
</script>

{#snippet row({ card, hit }, inRecommended)}
	<li class="group flex items-center gap-0.5">
		<button
			draggable="true"
			ondragstart={(event) => startDrag(event, card.id)}
			onclick={() => onpreview(card.id)}
			class={[
				'flex min-w-0 flex-1 cursor-grab items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[13px] leading-snug hover:bg-muted active:cursor-grabbing',
				selectedRef === card.id && 'bg-muted',
				inRecommended && 'recommended'
			]}
		>
			<GripVertical
				size={12}
				class="shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground"
			/>
			<Icon size={13} class="shrink-0 text-muted-foreground" />
			<span class="min-w-0 flex-1">
				{card.label}
				{#if hit}<span class="block text-[11px] text-muted-foreground">as "{hit}"</span>{/if}
			</span>
			{#if !inRecommended && recommendedIds.has(card.id)}
				<span class="recommended-dot" title="Recommended for your plan"></span>
			{/if}
			{#if placedRefs.has(card.id)}
				<span class="size-1.5 shrink-0 rounded-full bg-foreground/70" title="On the board"></span>
			{/if}
		</button>
		<button
			class="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-60 group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100"
			aria-label="Add {card.label} to the board"
			title="Add to the board"
			onclick={() => onadd(card.id)}
		>
			<Plus size={14} />
		</button>
	</li>
{/snippet}

<div class="space-y-2">
	<div class="relative">
		<Search
			size={14}
			class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
		/>
		<input
			type="text"
			role="searchbox"
			bind:value={query}
			placeholder="Search, e.g. land footprint"
			aria-label="Search the library"
			class="h-8 w-full rounded-md border border-border bg-background pr-7 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
		/>
		{#if query}
			<SearchClearButton onclick={() => (query = '')} />
		{/if}
	</div>
	<Tabs bind:value={kind}>
		<TabsList class="w-full justify-start">
			{#each CARD_KINDS as option (option.value)}
				<TabsTrigger value={option.value}>{option.label}</TabsTrigger>
			{/each}
		</TabsList>
	</Tabs>
</div>

<div class="min-h-0 flex-1 overflow-y-auto pr-1 pb-3">
	{#if ranked.length}
		<h3 class="field-label px-1.5 pt-3 pb-1">Recommended for your plan</h3>
		<ul>
			{#each ranked as result (result.card.id)}
				{@render row(result, true)}
			{/each}
		</ul>
	{/if}
	<h3 class="field-label px-1.5 pt-3 pb-1">
		{query ? `Matching ${KIND_PLURALS[kind]}` : `All ${KIND_PLURALS[kind]}`}
	</h3>
	<ul>
		{#each results as result (result.card.id)}
			{@render row(result, false)}
		{:else}
			<li class="px-1.5 pt-1 text-xs text-muted-foreground">Nothing matches "{query}".</li>
		{/each}
	</ul>
</div>

<style>
	.recommended {
		box-shadow: inset 2px 0 0 var(--planner-recommended);
	}

	.recommended-dot {
		width: 6px;
		height: 6px;
		flex-shrink: 0;
		border-radius: 999px;
		border: 1.5px solid var(--planner-recommended);
	}
</style>
