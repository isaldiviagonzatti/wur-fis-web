<!--
  About page — introduction to the Foodshed Information Service dashboard.
-->
<script>
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
</script>

<div class="mx-auto max-w-3xl px-6 py-10">
	<!-- Hero -->
	<div class="mb-8">
		<div class="flex items-center gap-2 mb-2">
			<Badge variant="secondary">Beta</Badge>
			<span class="text-xs text-muted-foreground">Seasonal forecasts updated monthly</span>
		</div>
		<h2 class="text-3xl font-bold tracking-tight mb-3">Foodshed Information Service</h2>
		<p class="text-lg text-muted-foreground leading-relaxed">
			An interactive dashboard providing seasonal food security indicators for Sub-Saharan Africa.
			Explore crop yield forecasts, spatial food system data, and methodological resources.
		</p>
	</div>

	<Separator class="mb-8" />

	<!-- Cards -->
	<div class="grid gap-4 sm:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Yield Forecast</CardTitle>
				<CardDescription>Seasonal crop yield outlooks</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Probabilistic seasonal forecasts of crop yield for Ghana, Kenya, and Zimbabwe.
					Explore spatial patterns on the map, compare distributions across regions,
					and assess historical hindcast skill.
				</p>
			</CardContent>
			<CardFooter>
				<a href="/yield-forecast" class="text-sm font-medium underline underline-offset-4">
					Open Yield Forecast →
				</a>
			</CardFooter>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Foodshed Scenarios</CardTitle>
				<CardDescription>Future food system projections</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Spatial analysis of foodshed boundaries and scenarios for future food system
					configurations. This section is under development.
				</p>
			</CardContent>
			<CardFooter>
				<a href="/foodshed" class="text-sm font-medium underline underline-offset-4">
					Open Foodshed Scenarios →
				</a>
			</CardFooter>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Methodology</CardTitle>
				<CardDescription>Technical and scientific background</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Documentation of data sources, modelling approaches, skill metrics, and
					limitations. Intended for technical users and reviewers.
				</p>
			</CardContent>
			<CardFooter>
				<a href="/methodology" class="text-sm font-medium underline underline-offset-4">
					Read Methodology →
				</a>
			</CardFooter>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Coverage</CardTitle>
				<CardDescription>Current scope</CardDescription>
			</CardHeader>
			<CardContent>
				<ul class="text-sm text-muted-foreground space-y-1">
					<li>Countries: Ghana, Kenya, Zimbabwe</li>
					<li>Crops: Maize, Sorghum</li>
					<li>Forecasts: monthly, 1–4 month lead</li>
					<li>Admin levels: national, admin1, admin2</li>
				</ul>
			</CardContent>
		</Card>
	</div>
</div>
