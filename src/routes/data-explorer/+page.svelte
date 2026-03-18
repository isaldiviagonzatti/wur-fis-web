<!--
  Data Explorer landing — mosaic of available explorers.
-->
<script>
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';

	const explorers = [
		{
			href: '/data-explorer/crop-yields',
			title: 'Crop Yields',
			description: 'Observed yield, production, and harvested area statistics by country and administrative region for Ghana, Kenya, and Zimbabwe.',
		},
		{
			href: '/data-explorer/crop-calendars',
			title: 'Crop Calendars',
			description: 'Sowing and harvest timing by agro-ecological zone. Click an AEZ on the map to see the full crop calendar chart.',
		},
		{
			href: '/data-explorer/environment',
			title: 'Environment',
			description: 'Spatial environmental reference layers including soil texture, land use, and elevation for Ghana, Kenya, and Zimbabwe.',
		},
		{
			href: '/data-explorer/climate',
			title: 'Climate',
			description: 'ERA5-Land climatology layers covering long-term temperature and precipitation patterns across the study region.',
		},
	];
</script>

<div class="mx-auto max-w-4xl px-8 py-12">
	<div class="mb-10">
		<h2 class="text-3xl font-semibold tracking-tight mb-3">Data Explorer</h2>
		<p class="text-lg text-muted-foreground leading-relaxed">
			Explore the data underpinning the Foodshed Information Service.
		</p>
	</div>

	<div class="grid gap-5 sm:grid-cols-2">
		{#each explorers as explorer (explorer.href)}
			<Card>
				<CardHeader>
					<CardTitle>
						<a href={explorer.href} class="underline underline-offset-4 hover:text-muted-foreground">{explorer.title}</a>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">{explorer.description}</p>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
