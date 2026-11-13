<!--
  PaperList — reviewed papers behind an element or card, newest first, with a
  link to each paper's DOI.
-->
<script>
	let { papers, limit = 4 } = $props();

	// Collapses again whenever a different list is shown.
	let expanded = $derived.by(() => (papers, false));
	const shown = $derived(expanded ? papers : papers.slice(0, limit));
</script>

<ul class="space-y-2.5">
	{#each shown as paper (paper.code)}
		<li class="text-xs leading-snug">
			{#if paper.doi}
				<a
					href="https://doi.org/{paper.doi}"
					target="_blank"
					rel="noopener"
					class="text-foreground underline-offset-2 hover:underline">{paper.title}</a
				>
			{:else}
				<span class="text-foreground">{paper.title}</span>
			{/if}
			<div class="mt-0.5 text-muted-foreground">
				{[paper.year, paper.location].filter(Boolean).join(' · ')}
			</div>
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
