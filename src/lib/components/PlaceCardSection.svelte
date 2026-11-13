<!--
  PlaceCardSection — one section of a PlaceCard: a centred heading with its
  explanation on hover, an optional note on the line under it (a date, a unit),
  then the content. `height` is bound so a page can size its map to the card.
-->
<script>
	import InfoTip from '$lib/components/InfoTip.svelte';

	let { title, help = '', note = '', height = $bindable(0), children } = $props();
</script>

<!-- Side by side, sections stretch to the row (so the hairline between them runs
     its full height); the inner box keeps the section's own height for `height`. -->
<section>
	<div class="p-4" bind:offsetHeight={height}>
		<h3 class="mb-3 text-center text-base font-semibold text-foreground">
			{#if help}
				<InfoTip text={help}>{title}</InfoTip>
			{:else}
				{title}
			{/if}
			{#if note}
				<span class="block text-sm font-normal text-muted-foreground">{note}</span>
			{/if}
		</h3>
		{@render children()}
	</div>
</section>
