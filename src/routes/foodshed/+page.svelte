<!--
  Foodshed Atlas page — what the section will offer, until it is built.
-->
<script>
	import { Badge } from '$lib/components/ui/badge';
	import { COUNTRY_OPTIONS } from '$lib/domain-options.js';

	const countries = new Intl.ListFormat('en', { type: 'conjunction' }).format(
		COUNTRY_OPTIONS.map(({ label }) => label)
	);
</script>

<div class="mx-auto max-w-3xl space-y-6 px-4 py-8">
	<div class="space-y-3">
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Foodshed Atlas</h1>
			<Badge variant="outline">Coming soon</Badge>
		</div>
		<p class="text-base leading-relaxed text-muted-foreground">
			Where does the food eaten in a place come from, and could that change? This section will map
			the foodsheds of {countries}, the areas from which a population draws its food.
		</p>
	</div>

	<section class="space-y-3 text-base leading-relaxed text-muted-foreground">
		<h2 class="text-lg font-semibold text-foreground">What it will show</h2>
		<ul class="list-disc space-y-2 pl-5">
			<li>
				<span class="font-medium text-foreground">Today's foodsheds</span>, showing how domestic
				crop production, trade and food demand combine to determine how much food is available.
			</li>
			<li>
				<span class="font-medium text-foreground">Future scenarios</span> of how foodsheds may
				change by 2040-2050 and 2080-2100 under two climate and socio-economic pathways (SSP2-4.5
				and SSP3-7.0).
			</li>
		</ul>
	</section>

	<p class="text-sm text-muted-foreground">
		In the meantime, the <a href="/yield-forecast" class="font-medium text-foreground underline underline-offset-2 hover:no-underline">seasonal yield forecast</a>
		is available.
	</p>
</div>
