<!--
  TermList — the planner's key terms (foodshed, food system, ...), each
  opening to its definition and source.
-->
<script>
	import SourceLine from './SourceLine.svelte';

	let { concepts } = $props();
</script>

<div class="space-y-1">
	{#each concepts as concept (concept.id)}
		<details>
			<summary
				class="cursor-pointer list-none text-[13px] text-foreground marker:hidden hover:underline"
			>
				{concept.label}
			</summary>
			<div class="mt-1 mb-2 ml-3 space-y-1 border-l border-border pl-2.5">
				<p class="text-[13px] leading-relaxed text-muted-foreground">{concept.definition}</p>
				<SourceLine source={concept.source} doi={concept.doi} />
			</div>
		</details>
	{/each}
</div>
