<!--
  Home page — the slogan, the SAFE4ALL context, and a card for each of
  its pages (there are no section overview pages).
-->
<script>
	import NavigationCardGrid from '$lib/components/NavigationCardGrid.svelte';
	import PageIntro from '$lib/components/PageIntro.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { HOME_FEATURE, HOME_NAV_ITEMS, SITE_SLOGAN } from '$lib/navigation.js';
</script>

<!-- Wide enough for four card columns: three for the data pages, one for the planner. -->
<div class="mx-auto max-w-6xl px-8 py-12">
	<!-- Hero: the slogan alone, with as much space below as above it. -->
	<PageIntro title={SITE_SLOGAN} slogan class="pt-8 pb-20 sm:pt-16 sm:pb-28" />

	<Separator class="mb-8" />

	<!-- SAFE4ALL context -->
	<div class="mb-8 rounded-md bg-surface-tint px-5 py-4">
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
	<NavigationCardGrid items={HOME_NAV_ITEMS} feature={HOME_FEATURE} />
</div>
