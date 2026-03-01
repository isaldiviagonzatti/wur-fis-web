<!--
  Methodology page — centralised technical and scientific documentation.
-->
<script>
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
</script>

<div class="mx-auto max-w-3xl px-6 py-10">
	<h2 class="text-3xl font-bold tracking-tight mb-3">Methodology</h2>
	<p class="text-muted-foreground mb-8">
		Technical and scientific documentation for the Foodshed Information Service.
	</p>

	<Separator class="mb-8" />

	<div class="flex flex-col gap-4">
		<Card>
			<CardHeader>
				<CardTitle>Data Sources</CardTitle>
				<CardDescription>Input datasets and provenance</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Description of climate model outputs (e.g. SEAS5, GloFAS), crop model inputs,
					administrative boundary sources, and yield observation datasets.
				</p>
				<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Crop Yield Modelling</CardTitle>
				<CardDescription>Modelling approach and assumptions</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Overview of the crop yield forecasting pipeline: seasonal climate forecasts →
					bias correction → crop model → spatial aggregation → probabilistic output.
				</p>
				<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Skill Assessment</CardTitle>
				<CardDescription>Hindcast verification metrics</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Explanation of skill metrics used (RPSS, correlation, reliability diagrams),
					how the hindcast period was defined, and interpretation guidance for end users.
					This is the centralised reference for the skill overlay shown in Yield Forecast.
				</p>
				<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Foodshed Delineation</CardTitle>
				<CardDescription>Spatial food system methodology</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Methodology behind the foodshed boundary delineation, scenario assumptions,
					and links to peer-reviewed publications.
				</p>
				<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Limitations and Caveats</CardTitle>
				<CardDescription>Known constraints and uncertainties</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Spatial resolution constraints, crop variety assumptions, climate model biases,
					and guidance on appropriate use of outputs for decision-making.
				</p>
				<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
			</CardContent>
		</Card>
	</div>
</div>
