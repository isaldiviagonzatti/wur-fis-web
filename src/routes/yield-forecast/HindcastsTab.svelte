<!--
  HindcastsTab — historical skill assessment for the yield forecast system.
-->
<script>
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
</script>

<Card>
	<CardHeader>
		<CardTitle>Hindcast Skill</CardTitle>
		<CardDescription>Historical performance of the seasonal yield forecast</CardDescription>
	</CardHeader>
	<CardContent>
		<p class="text-sm text-muted-foreground">
			30-year hindcasts (1994-2023) evaluated at lead times of 0-2 months before sowing.
			Skill metrics include CRPSS, RPSS, Spearman correlation, and ROC--AUC for below- and
			above-normal yield events, shown as spatial maps and summary plots per crop and country.
		</p>
		<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
	</CardContent>
</Card>
