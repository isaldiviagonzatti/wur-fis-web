<!--
  LibraryPanel — the planner's card library. Cards are dragged onto the board;
  clicking one opens its description. A dot marks cards already on the board.
-->
<script>
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Search from '@lucide/svelte/icons/search';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import SearchClearButton from '$lib/components/SearchClearButton.svelte';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { CARD_DRAG_TYPE, KIND_ICONS, NOTE_REF } from '$lib/planner/card-kinds.js';
	import { CARD_KINDS, libraryGroups } from '$lib/planner/planner-data.js';

	let { content, placedRefs, selectedRef = null, hidden = false, onpreview, onaddnote } = $props();

	let kind = $state('method');
	let query = $state('');

	const groups = $derived(libraryGroups(content, kind, query));
	const Icon = $derived(KIND_ICONS[kind]);

	function startDrag(event, ref) {
		event.dataTransfer.setData(CARD_DRAG_TYPE, ref);
		event.dataTransfer.effectAllowed = 'copy';
	}
</script>

<aside {hidden} class="flex min-h-0 w-64 shrink-0 flex-col">
	<div class="space-y-2.5 pt-1">
		<div>
			<h2 class="text-sm font-semibold text-foreground">Library</h2>
			<p class="text-xs leading-snug text-muted-foreground">
				Drag a card onto an element of the food system.
			</p>
		</div>
		<div class="relative">
			<Search
				size={14}
				class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				role="searchbox"
				bind:value={query}
				placeholder="Search"
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
		{#each groups as group (group.label)}
			<h3
				class="px-1.5 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
				title={content.groups[group.label] || undefined}
			>
				{group.label}
			</h3>
			<ul>
				{#each group.cards as card (card.id)}
					<li>
						<button
							draggable="true"
							ondragstart={(event) => startDrag(event, card.id)}
							onclick={() => onpreview(card.id)}
							class={[
								'group flex w-full cursor-grab items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[13px] leading-snug hover:bg-muted active:cursor-grabbing',
								selectedRef === card.id && 'bg-muted'
							]}
						>
							<GripVertical
								size={12}
								class="shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground"
							/>
							<Icon size={13} class="shrink-0 text-muted-foreground" />
							<span class="min-w-0 flex-1">{card.label}</span>
							{#if placedRefs.has(card.id)}
								<span class="size-1.5 shrink-0 rounded-full bg-foreground/70" title="On the board"
								></span>
							{/if}
							<span
								class="shrink-0 text-[11px] text-muted-foreground tabular-nums"
								title="{card.papers.length} reviewed papers">{card.papers.length}</span
							>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="px-1.5 pt-4 text-xs text-muted-foreground">Nothing matches "{query}".</p>
		{/each}
	</div>

	<div class="pt-2">
		<button
			draggable="true"
			ondragstart={(event) => startDrag(event, NOTE_REF)}
			onclick={onaddnote}
			class="flex w-full cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
		>
			<StickyNote size={14} />
			Add a note
			<span class="ml-auto text-[11px]">drag or click</span>
		</button>
	</div>
</aside>
