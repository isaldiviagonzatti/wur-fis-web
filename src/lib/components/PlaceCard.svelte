<!--
  PlaceCard — what a map tool shows about the place clicked on its map, read
  like the map's hover card: the place in a shaded header with the button that
  clears it, the sections below on a lighter shade. The caller lays out the
  sections and splits them with a hairline (`divide-brand-muted/50`), not boxes.

  Muted text fails AA on the header shade, so everything in the header uses the
  text colour. `headerHeight` is bound so a page can size its map to the card.
-->
<script>
	let { title, clearLabel, onClear, headerHeight = $bindable(0), children } = $props();
</script>

<article class="overflow-hidden rounded-md bg-surface-tint">
	<header
		bind:offsetHeight={headerHeight}
		class="flex items-center justify-between gap-3 bg-surface-tint-strong px-4 py-2.5 @md:grid @md:grid-cols-[1fr_minmax(0,auto)_1fr]"
	>
		<span class="hidden @md:block"></span>
		<h2 class="text-base font-semibold text-foreground @md:text-center">{title}</h2>
		<button
			type="button"
			onclick={onClear}
			class="shrink-0 cursor-pointer justify-self-end whitespace-nowrap text-[13px] text-foreground underline-offset-2 hover:underline"
		>
			{clearLabel}
		</button>
	</header>
	{@render children()}
</article>
