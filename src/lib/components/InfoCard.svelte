<!--
  InfoCard — the chart tooltip card: a shaded header with the title (where or
  when), then one row per value with an optional colour swatch. The map's hover
  popup builds the same card as DOM (admin-zone-map.js); both use info-card.css.
  Put it in a LayerChart `Tooltip.Root variant="none"`.
-->
<script>
	import '$lib/styles/info-card.css';

	// rows: [{ label, value, color? }]; a row without a colour keeps the swatch
	// column empty so the labels stay aligned.
	let { title, rows = [] } = $props();
</script>

<div class="info-card">
	<div class="info-card__meta">
		<p class="info-card__title">{title}</p>
	</div>
	<div class="info-card__body">
		{#each rows as row (row.label)}
			<div class="info-card__row">
				<span class="info-card__swatch" style:background={row.color}></span>
				<span class="info-card__label">{row.label}</span>
				<span class="info-card__number">{row.value}</span>
			</div>
		{/each}
	</div>
</div>
