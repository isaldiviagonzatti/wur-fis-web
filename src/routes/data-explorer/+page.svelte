<!--
  Data Explorer landing — mosaic of available explorers.
-->
<script>
	import NavigationCardGrid from '$lib/components/NavigationCardGrid.svelte';
	import { DATA_EXPLORER_NAV_ITEMS } from '$lib/navigation.js';
</script>

<div class="mx-auto max-w-4xl px-8 py-12">
	<div class="mb-10">
		<h2 class="text-3xl font-semibold tracking-tight mb-3">Data Explorer</h2>
		<p class="text-lg text-muted-foreground leading-relaxed">
			Explore the data underpinning the Foodshed Information Service.
		</p>
	</div>

	<NavigationCardGrid items={DATA_EXPLORER_NAV_ITEMS} />
</div>
