<!--
  UserGuideTab — guidance on using the Yield Forecast tool.
-->
<script>
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
</script>

<Card>
	<CardHeader>
		<CardTitle>User Guide</CardTitle>
		<CardDescription>How to use the Yield Forecast tool</CardDescription>
	</CardHeader>
	<CardContent>
		<p class="text-sm text-muted-foreground">
			Guidance on selecting crop, country, and administrative level, reading the yield
			anomaly distribution (forecast ensemble vs. climatological reference); and interpreting
			the skill overlay. Skill is assessed relative to a climatological benchmark — positive
			skill means the forecast is more informative than a no-skill tercile forecast.
		</p>
		<p class="text-sm text-muted-foreground mt-4">
			FIS fills a gap between hazard monitoring systems (e.g. ASAP, GEOGLAM Crop Monitor,
			TAMSAT-ALERT) and food-security outlooks (e.g. FEWS NET). Existing systems describe
			current conditions or qualitative anomalies; FIS provides quantitative, crop-specific
			probabilistic yield forecasts issued months before harvest, supporting short-term
			adaptation decisions across the food supply chain.
		</p>
		<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
	</CardContent>
</Card>
