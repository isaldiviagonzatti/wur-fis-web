<!--
  SourceLine — where a definition comes from, or a "Draft text" label when the
  text has no source yet.
-->
<script>
	import { Badge } from '$lib/components/ui/badge';

	let { source = '', doi = '' } = $props();
</script>

{#if source}
	<p class="text-xs text-muted-foreground">
		{source}{#if doi}
			· <a
				href="https://doi.org/{doi}"
				target="_blank"
				rel="noopener"
				class="underline underline-offset-2 hover:text-foreground">DOI</a
			>{/if}
	</p>
{:else}
	<Badge variant="outline" class="text-muted-foreground">Draft text</Badge>
{/if}
