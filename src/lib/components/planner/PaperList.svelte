<!--
  PaperList — example studies for an element or card, newest first. Each
  opens to show the indicators, methods and datasets the study used; names in
  `highlight` (a card's own) are bold.
-->
<script>
	import { paperCitation } from '$lib/planner/planner-data.js';

	let { papers, limit = 5, highlight = new Set() } = $props();

	// Collapses again whenever a different list is shown.
	let expanded = $derived.by(() => (papers, false));
	const shown = $derived(expanded ? papers : papers.slice(0, limit));

	const USED = [
		['indicators', 'Indicators'],
		['methods', 'Methods'],
		['datasets', 'Data']
	];
</script>

<ul class="space-y-1.5">
	{#each shown as paper (paper.code)}
		<li class="text-xs leading-snug">
			<details>
				<summary class="cursor-pointer list-none marker:hidden">
					<span class="font-medium text-foreground">{paperCitation(paper)}</span>
					<span class="text-foreground">{paper.title}</span>
					<span class="text-muted-foreground">
						{[paper.location, paper.scale].filter(Boolean).join(' · ')}
					</span>
				</summary>
				<div class="mt-1 mb-2 ml-3 space-y-1 border-l border-border pl-2.5">
					{#if USED.some(([key]) => paper[key]?.length)}
						<dl class="space-y-1">
							{#each USED.filter(([key]) => paper[key]?.length) as [key, label] (key)}
								<div>
									<dt class="text-muted-foreground">{label}</dt>
									<dd class="text-foreground">
										{#each paper[key] as name, i (name)}
											<span class={[highlight.has(name) && 'font-semibold']}>{name}</span
											>{#if i < paper[key].length - 1};
											{/if}
										{/each}
									</dd>
								</div>
							{/each}
						</dl>
					{/if}
					{#if paper.doi}
						<a
							href="https://doi.org/{paper.doi}"
							target="_blank"
							rel="noopener"
							class="inline-block text-foreground underline underline-offset-2">Open the paper</a
						>
					{/if}
				</div>
			</details>
		</li>
	{/each}
</ul>
{#if papers.length > limit}
	<button
		class="mt-2 cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
		onclick={() => (expanded = !expanded)}
	>
		{expanded ? 'Show fewer' : `Show all ${papers.length}`}
	</button>
{/if}
