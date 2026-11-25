<!--
  CardItems — the variants of a method or indicator, or the datasets, grouped
  under a card, most used first. Opening one lists studies that use it.
-->
<script>
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { paperCitation, papersFor } from '$lib/planner/planner-data.js';

	let { content, card, limit = 10 } = $props();

	// Collapses again whenever another card is shown.
	let expanded = $derived.by(() => (card, false));
	const shown = $derived(expanded ? card.items : card.items.slice(0, limit));
</script>

<ul class="space-y-0.5">
	{#each shown as item (item.name)}
		<li>
			<details class="group">
				<summary
					class="flex cursor-pointer list-none items-baseline gap-2 rounded-md py-0.5 text-[13px] text-foreground marker:hidden hover:underline"
				>
					<span class="min-w-0 flex-1">{item.name}</span>
				</summary>
				<div class="mb-1.5 ml-3 space-y-0.5 border-l border-border pl-2.5 text-xs">
					{#if item.url}
						<a
							href={item.url}
							target="_blank"
							rel="external noopener"
							class="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
						>
							Where to find it <ExternalLink size={11} class="text-muted-foreground" />
						</a>
					{/if}
					{#each papersFor(content, item.papers) as paper (paper.code)}
						<div class="text-muted-foreground">
							{#if paper.doi}
								<a
									href="https://doi.org/{paper.doi}"
									target="_blank"
									rel="noopener"
									class="text-foreground underline-offset-2 hover:underline"
									title={paper.title}>{paperCitation(paper)}</a
								>
							{:else}
								<span class="text-foreground" title={paper.title}>{paperCitation(paper)}</span>
							{/if}
							{#if paper.location}· {paper.location}{/if}
						</div>
					{/each}
				</div>
			</details>
		</li>
	{/each}
</ul>
{#if card.items.length > limit}
	<button
		class="mt-1.5 cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
		onclick={() => (expanded = !expanded)}
	>
		{expanded ? 'Show fewer' : `Show all ${card.items.length}`}
	</button>
{/if}
