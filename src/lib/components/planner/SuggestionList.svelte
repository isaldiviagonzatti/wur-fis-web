<!--
  SuggestionList — methods, indicators and data that reviewed papers most often
  use for the given elements. The number is how many papers combine the two.
-->
<script>
	import Check from '@lucide/svelte/icons/check';
	import Plus from '@lucide/svelte/icons/plus';
	import { CARD_KINDS, suggestCards } from '$lib/planner/planner-data.js';

	let { content, elementIds, placedRefs, onadd, onpreview, perKind = 4 } = $props();

	const suggestions = $derived(suggestCards(content, elementIds, perKind));
	const empty = $derived(CARD_KINDS.every(({ value }) => !suggestions[value].length));
</script>

{#if empty}
	<p class="text-xs text-muted-foreground">
		No reviewed paper combines this element with a method, indicator or data card yet.
	</p>
{:else}
	<div class="space-y-3">
		{#each CARD_KINDS as kind (kind.value)}
			{@const items = suggestions[kind.value]}
			{#if items.length}
				<div>
					<h4 class="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
						{kind.label}
					</h4>
					<ul class="-mx-1.5">
						{#each items as item (item.card.id)}
							<li class="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-muted">
								<button
									class="min-w-0 flex-1 cursor-pointer truncate py-0.5 text-left text-[13px]"
									title={item.card.label}
									onclick={() => onpreview(item.card.id)}
								>
									{item.card.label}
								</button>
								<span
									class="text-[11px] text-muted-foreground tabular-nums"
									title="{item.shared} reviewed papers use both">{item.shared}</span
								>
								{#if placedRefs.has(item.card.id)}
									<span class="grid size-6 place-items-center text-muted-foreground" title="On the board">
										<Check size={14} />
									</span>
								{:else}
									<button
										class="grid size-6 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
										aria-label="Add {item.card.label} to the board"
										title="Add to the board"
										onclick={() => onadd(item.card.id, item.element)}
									>
										<Plus size={14} />
									</button>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/each}
	</div>
{/if}
