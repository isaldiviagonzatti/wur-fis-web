<!--
  NowcastPanel — how the current season has developed so far in the selected
  grid cell or area, from LPJmL forced by observed weather (ERA5-Land) up to the
  day before the forecast start, against the 1994-2023 seasons.

  Two indicators, both counted from sowing:
  - biomass to date, shown as a percentage of the normal end-of-season biomass so
    that no absolute model value appears (absolute LPJmL values are not published);
  - water needs met, the share of the crop's water demand it has received so far.

  `entry` is one zone of the nowcast admin payload, or one cell decoded by
  loadNowcastCell: { sowing_date, day_of_season, biomass, water }, each indicator
  holding current/mean/p05/p95 series every `stepDays` days plus today/percentile/
  anomaly_pct on the `through` day.
-->
<script>
	import NowcastChart from '$lib/components/NowcastChart.svelte';
	import { theme } from '$lib/theme.svelte.js';
	import { chartColors, formatSigned, nowcastRows } from '$lib/yield-forecast.js';

	let { entry, through, stepDays } = $props();

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const colors = $derived(chartColors(theme.dark));

	// Normal end-of-season biomass: the last value of the reference mean.
	const biomassScale = $derived.by(() => {
		const finalMean = [...entry.biomass.mean].reverse().find((value) => value !== null);
		return finalMean > 0 ? 100 / finalMean : null;
	});
	const biomassRows = $derived(
		biomassScale ? nowcastRows(entry.biomass, entry.sowing_date, stepDays, biomassScale) : []
	);
	const waterRows = $derived(nowcastRows(entry.water, entry.sowing_date, stepDays, 100));

	function formatMonth(text) {
		const date = new Date(`${text}T00:00:00Z`);
		return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
	}

	function ordinal(value) {
		const n = Math.round(value);
		const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th');
		return `${n}${suffix}`;
	}

	// Water is already a share, so its "% vs normal" would be a percent of a percent:
	// only the value and its percentile are given; the normal is on the chart.
	const waterSummary = $derived(
		entry.water.today === null
			? summary(entry.water, false)
			: `${Math.round(100 * entry.water.today)}% of the crop's water demand met since sowing, ${summary(entry.water, false)}`
	);

	function summary(block, withAnomaly = true) {
		if (block.percentile === null) return 'no comparison available for this day of the season';
		const anomaly =
			withAnomaly && block.anomaly_pct !== null ? ` (${formatSigned(block.anomaly_pct)}% vs normal)` : '';
		return `${ordinal(block.percentile)} percentile of the past 30 years${anomaly}`;
	}
</script>

<div class="space-y-3">
	<p class="text-[13px] text-muted-foreground">
		Sown {formatMonth(entry.sowing_date)}.
	</p>

	<div>
		<p class="text-sm font-medium text-foreground">Biomass to date</p>
		<p class="mb-1 text-[13px] text-muted-foreground">
			{summary(entry.biomass)}. 100% is what a normal season reaches by harvest.
		</p>
		{#if biomassRows.length}
			<NowcastChart rows={biomassRows} {through} />
		{/if}
	</div>

	<div>
		<p class="text-sm font-medium text-foreground">Water needs met</p>
		<p class="mb-1 text-[13px] text-muted-foreground">
			{waterSummary}.
		</p>
		<NowcastChart rows={waterRows} {through} yMax={100} />
	</div>

	<div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
		<span class="inline-flex items-center gap-1.5">
			<span class="h-1 w-4 rounded-full" style:background={colors.forecast}></span>
			This season
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="w-4 border-t border-dashed" style:border-color={colors.reference}></span>
			Normal
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="h-2 w-4 rounded-sm opacity-30" style:background={colors.reference}></span>
			Usual range (5-95%)
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="h-3 w-0 border-l border-dotted border-muted-foreground"></span>
			Last observed day
		</span>
	</div>
</div>
