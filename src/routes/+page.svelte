<!--
  About page — introduction to the Foodshed Information Service dashboard.
-->
<script>
	import NavigationCardGrid from '$lib/components/NavigationCardGrid.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { HOME_NAV_ITEMS } from '$lib/navigation.js';
</script>

<div class="mx-auto max-w-4xl px-8 py-12">
	<!-- Hero -->
	<div class="mb-10">
		<h2 class="text-3xl font-semibold tracking-tight mb-3">Foodshed Information Service</h2>
		<p class="text-lg text-muted-foreground leading-relaxed">
			An information service providing seasonal crop yield forecasts and foodshed analysis under future scenarios for
			Ghana, Kenya, and Zimbabwe. Developed at Wageningen University &amp; Research as part of the
			EU Horizon Europe <a href="https://www.safe4allafrica.eu/" class="underline underline-offset-2 hover:text-foreground transition-colors">SAFE4ALL</a> project.
		</p>
	</div>

	<Separator class="mb-8 mt-8" />

	<!-- SAFE4ALL context -->
	<div class="mb-8 rounded-md border border-border bg-muted/20 px-5 py-4">
		<p class="text-sm text-muted-foreground leading-relaxed">
			This tool is part of <a href="https://www.safe4allafrica.eu/" class="font-medium text-foreground hover:underline underline-offset-2">SAFE4ALL</a>
			(Safeguarding African Foodsheds and Ecosystems for all Actors across Local, regional and
			international Levels to manage migration), funded by the EU Horizon Europe programme
			(grant No. 101137814). SAFE4ALL addresses food security, climate change, and migration
			in Sub-Saharan Africa through tailored, user-centred climate services co-developed with
			communities, municipalities, and national partners in Ghana, Kenya, and Zimbabwe.
		</p>
	</div>

	<!-- Cards -->
	<NavigationCardGrid items={HOME_NAV_ITEMS} />
</div>
