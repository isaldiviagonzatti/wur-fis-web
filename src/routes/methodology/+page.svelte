<!--
  Methodology page — centralised technical and scientific documentation.
-->
<script>
	import { Separator } from '$lib/components/ui/separator';
</script>

<div class="mx-auto max-w-3xl px-6 py-10">
	<h2 class="text-3xl font-bold tracking-tight mb-3">Methodology</h2>
	<p class="text-muted-foreground mb-8">
		Technical and scientific documentation for the Foodshed Information Service, developed
		under the EU Horizon Europe <a href="https://www.safe4allafrica.eu/" class="underline underline-offset-2 hover:text-foreground transition-colors">SAFE4ALL</a> project (grant No. 101137814) at Wageningen University &amp; Research.
	</p>

	<Separator class="mb-8" />

	<div class="flex flex-col gap-8">
		<section>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Data Sources</h3>
			<p class="text-sm text-muted-foreground">
				Seasonal climate forcing: SEAS5 re-forecasts (ECMWF) bias-corrected and downscaled
				against ERA5-Land reanalysis. Yield evaluation: HarvestStat and FAOSTAT yield statistics.
				Administrative boundaries: GADM v4.1. Crop area masks: SPAM 2017.
				Soil texture: USDA-NRCS. Crop calendars: FAO, validated by local experts.
			</p>
			<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
		</section>

		<section>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Crop Yield Modelling</h3>
			<p class="text-sm text-muted-foreground">
				LPJmL (dynamic global vegetation and crop model) is driven by SEAS5 ensemble hindcasts
				bias-corrected using BCCA (Bias-Corrected Constructed Analogues) against ERA5-Land.
				Yields are not calibrated. Simulations run at 6 arcminute resolution.
			</p>
			<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
		</section>

		<section>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Skill Assessment</h3>
			<p class="text-sm text-muted-foreground">
				Model prediction skill is evaluated as detrended yield anomalies over the 1994-2023 against yield statistics using Spearman and Pearson correlation (deterministic). Forecast skill is evaluated over the same period against the LPJmL reference simulation using CRPSS and RPSS (probabilistic); ROC--AUC for below- and above-normal yield events. Positive skill means the forecast outperforms a no-skill tercile forecast.
			</p>
			<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
		</section>

		<section>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Foodshed Analysis</h3>
			<p class="text-sm text-muted-foreground">
				Capacity-based foodshed analysis estimating the degree to which domestic agricultural production can meet food demand (self-sufficiency threshold approach). Food network connectivity is assessed using a gravity model of trade flows and potential risks of supply disruption. Components include domestic production (CROPGRIDS), dietary requirements (FAO), trade (FAOSTAT), and gridded population (LandScan). Scenarios couple LPJmL crop yields with SSP2/SSP3 demographic and socioeconomic projections at different time horizons.
			</p>
			<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
		</section>

		<section>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Limitations</h3>
			<p class="text-sm text-muted-foreground">
				Simulations cover only rainfed production. Multiple seasons are only represented where yield statistics are available to validate the model. Reported yield data contain known inconsistencies (see paper).
			</p>
			<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
		</section>
	</div>
</div>
