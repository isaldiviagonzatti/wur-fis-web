<!--
  UserGuideTab — how to use the forecast map and read its numbers.
-->
<script>
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { PERCENTILE_COLORS } from '$lib/yield-forecast.js';

	const controls = [
		['Crop', 'Draws that crop in every country where it is forecast this month.'],
		['Aggregation', 'Grid cells, or values summed to country, admin 1 or admin 2 units.'],
		['Colour by skill', 'Shades cells by forecast skill instead of percentile. Grid cells only.'],
		['Opacity', 'Fades the layer so the basemap shows through.'],
		['Find a place', 'Jumps to a town or city and selects the unit it falls in.']
	];

	const metrics = [
		['Percentile', 'Where the forecast sits among the 30 reference years. 50 is the median year, 10 means only 10% of years were lower.'],
		['Anomaly', 'Difference from the 1994-2023 average, in percent.'],
		['Below / near / above', 'Share of the 51 ensemble members falling in each third of the reference distribution.'],
		['Skill (CRPSS)', 'How much better the forecast is than using the recent climatology. 0.4 means 40% better.'],
		['Area covered', 'Share of the area where this crop grows that the aggregate is built from. Cells drop out when they have no forecast this month, or no skill. Admin views only.']
	];
</script>

<div class="mx-auto max-w-3xl space-y-4">
	<Card>
		<CardHeader><CardTitle class="text-base">Using the map</CardTitle></CardHeader>
		<CardContent class="space-y-3 text-sm text-muted-foreground">
			<p>Pick a crop, then click any coloured cell or area. Its forecast distribution appears below the map.</p>
			<dl class="space-y-1.5">
				{#each controls as [name, text] (name)}
					<div class="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2">
						<dt class="font-medium text-foreground">{name}</dt>
						<dd>{text}</dd>
					</div>
				{/each}
			</dl>
			<p>
				A selected location stays selected when you change the aggregation, so you can read the
				same place as a cell, a district and a country in turn.
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader><CardTitle class="text-base">Reading the colours</CardTitle></CardHeader>
		<CardContent class="space-y-3 text-sm text-muted-foreground">
			<p>
				Colour shows the percentile of the forecast within that place's own 1994-2023 record.
				Brown is a low year for that place, green a high one.
			</p>
			<div>
				<div class="grid overflow-hidden rounded-sm" style="grid-template-columns: repeat(9, 1fr);">
					{#each PERCENTILE_COLORS as colour, index (index)}
						<div class="h-4" style:background={colour}></div>
					{/each}
				</div>
				<div class="mt-1 flex justify-between text-[11px]">
					<span>0 lowest</span><span>50 median</span><span>100 highest</span>
				</div>
			</div>
			<p>
				Percentile is used rather than percent difference because year-to-year variability differs
				widely between places. A 10% shortfall is a bad year in one place and a normal one in
				another, while the 20th percentile means the same everywhere.
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader><CardTitle class="text-base">The numbers</CardTitle></CardHeader>
		<CardContent class="space-y-3 text-sm text-muted-foreground">
			<dl class="space-y-2">
				{#each metrics as [name, text] (name)}
					<div class="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-2">
						<dt class="font-medium text-foreground">{name}</dt>
						<dd>{text}</dd>
					</div>
				{/each}
			</dl>
			<p>
				Note that the percentile and anomaly can disagree in direction where a place has a few very high years.
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader><CardTitle class="text-base">Reading the distribution</CardTitle></CardHeader>
		<CardContent class="space-y-3 text-sm text-muted-foreground">
			<p>
				The plot compares this season's 51 forecast members (green) with the 30 reference years
				(brown), both as percent difference from the reference average. The dashed line at 0 is
				that average.
			</p>
			<p>
				A narrow green curve means the members agree. Late in a season most of the weather has
				already happened, so the members differ little and the curve is tight.
			</p>
			<p>
				Read the anomaly against the variability figure below the numbers. A 20% shortfall where
				yields normally swing by 5% is unusual, while the same shortfall where yields swing by 40% is not.
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader><CardTitle class="text-base">Why some places are blank</CardTitle></CardHeader>
		<CardContent class="space-y-3 text-sm text-muted-foreground">
			<p>
				Blank means the crop is not grown there.
			</p>
			<p>
				Hatched cells grow the crop but have no forecast, either because the harvest falls
				outside this initialisation month's window or because the forecast does not beat
				climatology over the 1994-2023 hindcasts. Harvest timing is also why the crop list
				changes from month to month.
			</p>
			<p>
				Admin units need at least half their cropland covered by forecast cells before they
				appear, so one skilful cell cannot stand for a whole district.
			</p>
		</CardContent>
	</Card>


</div>
