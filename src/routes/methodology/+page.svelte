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
		Technical and scientific documentation for the Foodshed Information Service, developed
		under the EU Horizon Europe <a href="https://www.safe4allafrica.eu/" class="underline underline-offset-2 hover:text-foreground transition-colors">SAFE4ALL</a> project (grant No. 101137814) at Wageningen University &amp; Research.
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
					Seasonal climate forcing: SEAS5 re-forecasts (ECMWF) bias-corrected and downscaled
					against ERA5-Land reanalysis. Crop calibration: HarvestStat and FAOSTAT yield statistics.
					Administrative boundaries: GADM v4.1. Crop area masks: CROPGRIDS.
					Soil texture: USDA-NRCS. Crop calendars: FAO, validated by local experts.
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
					LPJmL (dynamic global vegetation and crop model) is driven by SEAS5 ensemble hindcasts
					bias-corrected using BCCA (Bias-Corrected Constructed Analogues) against ERA5-Land.
					Calibration was performed against HarvestStat and FAOSTAT yield statistics for the period 2015-2024. Simulations run at ~9 km resolution.
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
					Model prediction skill is evaluated as detrended yield anomalies over the 1994-2023 against yield statistics using Spearman and Pearson correlation (deterministic). Forecast skill is evaluated over the same period against the LPJmL reference simulation using CRPSS and RPSS (probabilistic); ROC--AUC for below- and above-normal yield events. Positive skill means the forecast outperforms a no-skill tercile forecast.
				</p>
				<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Foodshed Analysis</CardTitle>
				<CardDescription>Spatial food system methodology</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Capacity-based foodshed analysis estimating the degree to which domestic agricultural production can meet food demand (self-sufficiency threshold approach). Food network connectivity is assessed using a gravity model of trade flows and potential risks of supply disruption. Components include domestic production (CROPGRIDS), dietary requirements (FAO), trade (FAOSTAT), and gridded population (LandScan). Scenarios couple LPJmL crop yields with SSP2/SSP3 demographic and socioeconomic projections at different time horizons.
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
					Simulations cover only rainfed production. Multilple season is only represented where yield statistics are available to calibrate and validate the model. Reported yield data contain known inconsistencies (see paper).
				</p>
				<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
			</CardContent>
		</Card>
	</div>
</div>
