<!--
  UserGuideTab — how to use the forecast map and read its numbers.
-->
<script>
	import NowcastChart from '$lib/components/NowcastChart.svelte';
	import { PERCENTILE_COLORS } from '$lib/yield-forecast.js';
	import { CONTROL_HELP, METRIC_HELP } from '$lib/yield-forecast-help.js';

	// Illustrative season-so-far charts (synthetic, not model output): sown 1 May, a dry
	// spell in late May and June, rain from July. Water needs met dips below its usual
	// range and recovers; biomass falls behind during the dry spell and stays behind.
	const EXAMPLE_SOWING = Date.UTC(2026, 4, 1);
	const EXAMPLE_THROUGH = '2026-09-30';
	const EXAMPLE_TODAY = 152;
	const logistic = (day) => 1 / (1 + Math.exp(-(day - 80) / 16));
	const exampleRows = (values) =>
		Array.from({ length: 35 }, (_, i) => {
			const day = 5 * i;
			const row = values(day);
			return {
				date: new Date(EXAMPLE_SOWING + day * 86400000),
				...row,
				current: day <= EXAMPLE_TODAY ? row.current : null
			};
		});
	const biomassExample = exampleRows((day) => {
		const mean = (100 * logistic(day)) / logistic(170);
		const behind = day < 30 ? 0 : 0.11 * Math.min(1, (day - 30) / 35);
		return { mean, p05: 0.92 * mean, p95: 1.07 * mean, current: mean * (1 - behind) };
	});
	const waterExample = exampleRows((day) => {
		const mean =
			day < 10 ? 100 : day < 30 ? 100 - 15 * ((day - 10) / 20) : 85 + 7 * Math.min(1, (day - 30) / 120);
		const dip = day < 25 ? 0 : day < 50 ? -10 * ((day - 25) / 25) : -10 * Math.exp(-(day - 50) / 45);
		return { mean, p05: Math.max(0, mean - 5), p95: Math.min(100, mean + 4), current: mean + dip };
	});

	const controls = [
		['Find a place', 'Jumps to a town or city, ticks its country and selects the unit it falls in.'],
		['Countries', 'All are ticked at first. Untick countries to show only the others; the crop list follows.'],
		['Crop', 'Crops forecast this month in at least one ticked country. Crops grown twice a year are listed per season.'],
		['Show by', CONTROL_HELP.showBy],
		['Colour by skill', CONTROL_HELP.skill],
		['Opacity', CONTROL_HELP.opacity],
		['Clear all', 'Clears every choice and returns the map to its starting view.']
	];

	const metrics = Object.values(METRIC_HELP).map(({ label, text }) => [label, text]);
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Using the map</h2>
		<p>Pick a crop, then click a coloured cell or area to see its forecast below the map.</p>
		<dl class="space-y-1.5">
			{#each controls as [name, text] (name)}
				<div class="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2">
					<dt class="font-medium text-foreground">{name}</dt>
					<dd>{text}</dd>
				</div>
			{/each}
		</dl>
		<p>
			The forecast is updated every month with the latest seasonal weather forecast, and the date
			of the last update is shown under the title.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Reading the colours</h2>
		<p>
			Colour is the percentile of the forecast within that place's own past 30 years: brown a
			low year for that place, green a high one.
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
			Percentile rather than percent difference, because year-to-year variability differs widely
			between places: a 10% shortfall is a bad year in one place and a normal one in another,
			while the 20th percentile means the same everywhere.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">The numbers</h2>
		<dl class="space-y-2">
			{#each metrics as [name, text] (name)}
				<div class="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-2">
					<dt class="font-medium text-foreground">{name}</dt>
					<dd>{text}</dd>
				</div>
			{/each}
		</dl>
		<p>
			Percentile and anomaly can point in different directions where a place has a few very high
			years: they raise the average without changing the ranking.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Reading the distribution</h2>
		<p>
			Rose is the 51 forecast members, blue the 30 reference years, both as percent difference
			from the reference average (the dashed line at 0). A narrow rose curve means the members
			agree, as late in a season, when most of the weather has already happened.
		</p>
		<p>
			Read the anomaly against the historical variability given just above the chart: the
			typical size of a year's departure from the average. A 20% shortfall where yields normally
			vary by 5% is unusual; where they vary by 40%, it is not.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Reading the season so far</h2>
		<p>
			"Season so far" shows how the crop has developed from sowing up to the last day of observed
			weather, the end of the month before the forecast. It appears only while a season is under
			way. Nothing in it is forecast. The rose line is this season; the blue dashed line and band are the normal and usual
			range (5-95%) of the past 30 seasons at the same number of days after sowing.
		</p>
		<p>
			<span class="font-medium text-foreground">Biomass to date</span> is how much the crop has
			grown so far; 100% is what a normal season reaches by harvest. From mid-season on, a crop
			that is behind rarely catches up fully.
		</p>
		<p>
			<span class="font-medium text-foreground">Water needs met</span> is the share of the crop's
			water demand met since sowing. It shows water stress early, before it shows in growth. Where
			nearly all water needs are met every year, 81% can be the lowest in 30 years, so read the
			percentage next to the percentile.
		</p>
		<p>
			The two can disagree: where rain is usually ample, cloud or temperature often limit growth
			more than water does. Where water is scarce they usually move together.
		</p>
		<div class="space-y-2">
			<p class="font-medium text-foreground"> Illustrative example</p>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<p class="text-xs font-medium text-foreground">Biomass to date</p>
					<NowcastChart rows={biomassExample} through={EXAMPLE_THROUGH} height={130} />
				</div>
				<div>
					<p class="text-xs font-medium text-foreground">Water needs met</p>
					<NowcastChart rows={waterExample} through={EXAMPLE_THROUGH} yMax={100} height={130} />
				</div>
			</div>
			<ol class="list-decimal space-y-1 pl-5">
				<li>
					<span class="font-medium text-foreground">Late May and June, a dry spell:</span> water
					needs met drops below its usual range and biomass starts to fall behind.
				</li>
				<li>
					<span class="font-medium text-foreground">From July, rain returns:</span> water needs met
					recovers, slowly, because it counts everything since sowing.
				</li>
				<li>
					<span class="font-medium text-foreground">Biomass stays behind:</span> growth lost in the
					dry spell is not made up. What it costs in yield depends on when it hit; stress around
					flowering costs most.
				</li>
			</ol>
		</div>
		<p class="text-xs">
			<span class="font-medium text-foreground">How the indicators are built.</span> LPJmL runs
			daily on ERA5-Land weather up to the last observed day, from a 31 December state of its
			continuous ERA5-Land historical run. For each crop (rainfed) and grid cell the season runs
			from the sowing day (<code>sdate</code>) to harvest, the first day the crop's NPP and water
			demand fall to zero.
		</p>
		<ul class="list-disc space-y-1 pl-5 text-xs">
			<li>
				Biomass to date: daily crop net primary production (<code>pft_npp</code>, g C/m²) summed
				from sowing, converted to dry matter (carbon is 45% of dry matter).
			</li>
			<li>
				Water needs met: <code>pft_water_supply</code> summed from sowing divided by
				<code>pft_water_demand</code> summed from sowing. Demand is the transpiration the canopy
				would reach that day without water stress; supply is what the roots can take up from the
				soil.
			</li>
			<li>
				Reference: the past 30 seasons of the same run, compared on the same day after sowing.
				Areas are crop-area weighted means of their cells (SPAM 2017), shown when at least half
				the crop area has a season under way. Biomass of crops with a significant national trend
				is moved to the current year, separately for each day of the season.
			</li>
		</ul>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Why some places are blank</h2>
		<p>Blank: the crop is not grown there.</p>
		<p>
			Hatched: the crop is grown but has no forecast this month, because its harvest falls outside
			the forecast window, because the model already harvested it before this month, or because
			the forecast has had no skill there in past years. This is also why the crop list changes from
			month to month.
		</p>
		<p>
			Areas need at least half their crop area covered by forecast cells, so one skilful cell
			cannot stand for a whole district.
		</p>
	</section>
</div>
