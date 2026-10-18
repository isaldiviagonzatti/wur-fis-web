<!--
  UserGuideTab — how to use the crop yields map and read its numbers.
-->
<script>
	import {
		AGREEMENT_COLORS,
		ANOMALY_COLORS,
		CAUTION_AGREEMENT_YEARS,
		MIN_COUNTRY_COVERAGE
	} from '$lib/crop-yields.js';
	import { CONTROL_HELP, LEGEND_HELP, SECTION_HELP } from '$lib/crop-yields-help.js';

	const controls = [
		['Find a place', 'Jumps to a town or city, ticks its country and selects the area it falls in.'],
		['Countries', 'All are ticked at first. Untick countries to show only the others; the crop list follows.'],
		[
			'Crop',
			'Every crop the model grows in at least one ticked country. Where the model grows a crop in two seasons, it is listed for the whole year and for each season.'
		],
		['Show', CONTROL_HELP.variable],
		['Show by', CONTROL_HELP.showBy],
		['Year', CONTROL_HELP.year],
		['Opacity', CONTROL_HELP.opacity],
		['Clear all', 'Clears every choice and returns the map to its starting view.']
	];

	const variables = [
		['Reported yield, harvested area, production', 'Values from the statistics, in tonnes per hectare, hectares and tonnes.'],
		['Reported yield anomaly', 'How far the reported yield of the year was from its trend.'],
		['Model yield anomaly', 'The same for the model, per grid cell or summed over each area.'],
		['Model–reported agreement', 'How closely the two anomalies rose and fell together over the years both have.']
	];

	const gradient = (colors) => `linear-gradient(to right, ${colors.join(', ')})`;
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Using the map</h2>
		<p>
			Pick a crop and what to show, then click an area or grid cell to see its history below the
			map. The map opens on the latest year with data; move the year slider to look back.
		</p>
		<dl class="space-y-1.5">
			{#each controls as [name, text] (name)}
				<div class="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2">
					<dt class="font-medium text-foreground">{name}</dt>
					<dd>{text}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">What the map can show</h2>
		<dl class="space-y-1.5">
			{#each variables as [name, text] (name)}
				<div class="grid gap-x-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
					<dt class="font-medium text-foreground">{name}</dt>
					<dd>{text}</dd>
				</div>
			{/each}
		</dl>
		<p>
			The model's own yields are never shown in tonnes per hectare: the model is not calibrated to
			the statistics, so its levels are not comparable with them. What can be compared is which years
			were better or worse than usual.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Reading the colours</h2>
		<div class="space-y-1">
			<span class="block h-3 w-full max-w-sm rounded-sm" style:background={gradient(ANOMALY_COLORS)}></span>
			<p>{LEGEND_HELP.anomaly}</p>
		</div>
		<div class="space-y-1">
			<span class="block h-3 w-full max-w-sm rounded-sm" style:background={gradient(AGREEMENT_COLORS)}></span>
			<p>{LEGEND_HELP.agreement}</p>
		</div>
		<p>
			For reported yield, area and production, darker means more. {LEGEND_HELP.reported}
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Reading the panel</h2>
		<p>
			<span class="font-medium text-foreground">Reported values.</span>
			{SECTION_HELP.reported}
		</p>
		<p>
			<span class="font-medium text-foreground">Yield anomalies.</span>
			{SECTION_HELP.anomalies} Agreement figures based on fewer than {CAUTION_AGREEMENT_YEARS} years
			are marked to read with caution: a few unusual years can then decide the result.
		</p>
		<p>
			<span class="font-medium text-foreground">Crops grown here.</span>
			{SECTION_HELP.cropMix}
		</p>
		<p>
			<span class="font-medium text-foreground">Grid cells.</span>
			{SECTION_HELP.cell}
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Why some places are blank or hatched</h2>
		<p>
			A blank area has no statistics for the crop at all, or the model grows less than 500 hectares
			of it there. A hatched area reports the crop, but not in the selected year. Country totals from
			HarvestStat are shown only for years in which the reporting regions hold at least
			{Math.round(100 * MIN_COUNTRY_COVERAGE)}% of the crop's area, so a year reported by a handful
			of regions is not mistaken for a national figure.
		</p>
	</section>
</div>
