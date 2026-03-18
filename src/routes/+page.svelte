<!--
  About page — introduction to the Foodshed Information Service dashboard.
-->
<script>
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
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
	<div class="grid gap-5 sm:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle><a href="/yield-forecast" class="underline underline-offset-4 hover:text-muted-foreground">Yield Forecast</a></CardTitle>
				<CardDescription>Seasonal crop yield outlooks</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Probabilistic seasonal forecasts of crop yield anomalies for Ghana, Kenya, and Zimbabwe,
					driven by bias-corrected and downscaled SEAS5 climate forecasts and the LPJmL process-based crop model.
					Forecasts are issued at 0-2 months before sowing to support short-term adaptation
					planning. Explore spatial skill maps and yield distributions across administrative regions.
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle><a href="/foodshed" class="underline underline-offset-4 hover:text-muted-foreground">Foodshed Scenarios</a></CardTitle>
				<CardDescription>Future food system projections</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Interactive maps of foodsheds showing how domestic production, trade,
					and food demand combine to determine food availability in Ghana, Kenya, and Zimbabwe.
					Long-term scenarios under SSP2-4.5 and SSP3-7.0 are under development.
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle><a href="/data-explorer" class="underline underline-offset-4 hover:text-muted-foreground">Data Explorer</a></CardTitle>
				<CardDescription>Data underpinning the Foodshed Information Service</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Static spatial and statistical reference layers used as inputs and baselines for the FIS:
					crop calendars, FAO and HarvestStat yield and area statistics, agro-ecological zones,
					soil types, land use, elevation, and ERA5-Land climate climatology.
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle><a href="/methodology" class="underline underline-offset-4 hover:text-muted-foreground">Methodology</a></CardTitle>
				<CardDescription>Technical and scientific background</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Documentation of data sources, modelling approaches, skill metrics, and
					limitations. Intended for technical users.
				</p>
			</CardContent>
		</Card>
	</div>
</div>
