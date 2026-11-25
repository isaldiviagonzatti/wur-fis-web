<!--
  RecommendationList — cards recommended for the plan (or for one element) by
  evidence.js. Clicking a name shows the card; the plus adds it to the board.
-->
<script>
	import Check from '@lucide/svelte/icons/check';
	import Plus from '@lucide/svelte/icons/plus';
	import { KIND_ICONS } from '$lib/planner/card-kinds.js';

	let { items, placedRefs, onpreview, onadd, empty = '' } = $props();
</script>

{#if items.length}
	<ul class="-mx-1.5 space-y-0.5">
		{#each items as item (item.entry.id)}
			{@const Icon = KIND_ICONS[item.entry.kind]}
			<li class="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-background/70">
				<Icon size={13} class="shrink-0 text-muted-foreground" />
				<button class="min-w-0 flex-1 cursor-pointer text-left" onclick={() => onpreview(item.entry.id)}>
					<span class="block text-[13px] leading-snug text-foreground">{item.entry.label}</span>
				</button>
				{#if placedRefs.has(item.entry.id)}
					<span class="grid size-6 shrink-0 place-items-center text-muted-foreground" title="On the board">
						<Check size={14} />
					</span>
				{:else}
					<button
						class="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
						aria-label="Add {item.entry.label} to the board"
						title="Add to the board"
						onclick={() => onadd(item)}
					>
						<Plus size={14} />
					</button>
				{/if}
			</li>
		{/each}
	</ul>
{:else if empty}
	<p class="text-xs text-muted-foreground">{empty}</p>
{/if}
