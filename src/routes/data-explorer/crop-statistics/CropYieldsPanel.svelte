<!--
  CropYieldsPanel — what the map says about the selected place, below the map.

  For an area: the reported series with its trend, the year-to-year anomalies of
  model and statistics on one scale, and the crop mix. For a grid cell, which
  has no statistics of its own: the cell's model anomalies against the reported
  anomalies of its province, and the model's crop mix in the cell.

  Reported values and anomalies sit in separate charts because they are in
  different units; the anomaly chart is the comparison, the reported chart is
  what the anomalies were taken from.
-->
<script>
	import CropMixBars from '$lib/components/CropMixBars.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import YearSeriesChart from '$lib/components/YearSeriesChart.svelte';
	import {
		MIN_COUNTRY_COVERAGE,
		SOURCE_LABELS,
		VARIABLES,
		correlation,
		describeOverlap,
		formatCompact,
		formatVariableValue,
		reportedSource,
		seriesColors
	} from '$lib/crop-yields.js';
	import { LEGEND_HELP, SECTION_HELP } from '$lib/crop-yields-help.js';
	import { theme } from '$lib/theme.svelte.js';

	let {
		title,
		level,
		variable,
		years,
		yearIndex,
		cropId,
		faoItems = [],
		// The selected area, or null when a cell is selected.
		zone = null,
		// The selected cell: { areaHa, anomaly: number[] } and its province's zone.
		cell = null,
		province = null,
		// Promise of the crop mix rows.
		cropMixRequest = null,
		notes = [],
		clearLabel,
		onClear,
		// Crop ids the page can switch to, and how; clicking a crop in the mix calls it.
		selectableCrops = [],
		onSelectCrop = null
	} = $props();

	const colors = $derived(seriesColors(theme.dark));
	const markYear = $derived(yearIndex >= 0 ? years[yearIndex] : null);
	const REPORTED_ORDER = ['harveststat', 'fao'];
	const BOX = 'rounded-lg border border-border bg-background/70 p-4';

	// The anomaly variables have no reported quantity of their own; show yield.
	const field = $derived(VARIABLES[variable].kind === 'reported' ? VARIABLES[variable].field : 'yield');
	const fieldLabel = $derived({ yield: 'yield', area: 'harvested area', production: 'production' }[field]);
	const fieldUnit = $derived(VARIABLES[field].unit);

	const reportedSeries = $derived.by(() => {
		if (!zone) return [];
		return REPORTED_ORDER.filter((source) => zone.series[source]).flatMap((source) => {
			const block = zone.series[source];
			const line = {
				key: source,
				label: SOURCE_LABELS[source],
				color: colors[source],
				values: block[field]
			};
			if (field !== 'yield') return [line];
			return [
				line,
				{ key: `${source}-trend`, label: `${SOURCE_LABELS[source]} trend`, color: colors[source], values: block.trend, dashed: true }
			];
		});
	});

	const anomalySeries = $derived.by(() => {
		if (cell) {
			const series = [
				{ key: 'model', label: 'Model, this cell', color: colors.model, values: cell.anomaly }
			];
			if (province?.series.harveststat) {
				series.push({
					key: 'harveststat',
					label: `HarvestStat, ${province.zone_name}`,
					color: colors.harveststat,
					values: province.series.harveststat.anomaly
				});
			}
			return series;
		}
		if (!zone) return [];
		return ['model', ...REPORTED_ORDER]
			.filter((source) => zone.series[source])
			.map((source) => ({
				key: source,
				label: SOURCE_LABELS[source],
				color: colors[source],
				values: zone.series[source].anomaly
			}));
	});

	const metrics = $derived.by(() => {
		if (cell) {
			const match = province?.series.harveststat
				? correlation(cell.anomaly, province.series.harveststat.anomaly)
				: null;
			return [
				{ label: 'Model crop area in cell', value: `${formatCompact(cell.areaHa)} ha` },
				{
					label: 'Agreement with province statistics',
					help: LEGEND_HELP.agreement,
					value: match ? `r = ${match.r.toFixed(2)}` : '—',
					detail: match ? describeOverlap(match.n) : 'not enough overlapping years'
				}
			];
		}
		if (!zone) return [];
		const source = reportedSource(level, zone);
		const reported = zone.series[source]?.[field]?.[yearIndex];
		const items = [
			{
				label: `Reported ${fieldLabel} in ${markYear}`,
				value: Number.isFinite(reported) ? `${field === 'yield' ? reported.toFixed(2) : formatCompact(reported)} ${fieldUnit}` : '—',
				detail: Number.isFinite(reported) ? SOURCE_LABELS[source] : 'not reported this year'
			}
		];
		for (const [comparison, label] of [
			['model_vs_harveststat', 'Model vs HarvestStat'],
			['model_vs_fao', 'Model vs FAOSTAT'],
			['fao_vs_harveststat', 'FAOSTAT vs HarvestStat']
		]) {
			const entry = zone.agreement?.[comparison];
			if (entry) {
				items.push({
					label,
					help: LEGEND_HELP.agreement,
					value: formatVariableValue('agreement', entry.r),
					detail: describeOverlap(entry.n)
				});
			}
		}
		if (items.length === 1 && zone.series.model) {
			items.push({ label: 'Agreement', help: LEGEND_HELP.agreement, value: '—', detail: 'fewer than 10 overlapping years' });
		}
		return items;
	});

	const formatReported = $derived(field === 'yield' ? (value) => value.toFixed(1) : formatCompact);
	const formatAnomaly = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
	const reportedColor = $derived(colors[level === 'country' ? 'fao' : 'harveststat']);
	const reportedLabel = $derived(`Reported (${level === 'country' ? 'FAOSTAT' : 'HarvestStat'})`);
</script>

<div class="mb-3 flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_minmax(0,auto)_1fr] sm:items-center sm:gap-3">
	<span class="hidden sm:block"></span>
	<p class="text-center text-base font-semibold text-foreground">{title}</p>
	<div class="flex justify-end">
		<button
			type="button"
			onclick={onClear}
			class="cursor-pointer text-[13px] text-muted-foreground hover:text-foreground"
		>
			{clearLabel}
		</button>
	</div>
</div>

<div class="mb-4 flex flex-wrap justify-center gap-x-12 gap-y-3">
	{#each metrics as metric (metric.label)}
		<div class="flex flex-col items-center gap-0.5 text-center">
			{#if metric.help}
				<InfoTip text={metric.help} class="text-[13px] text-muted-foreground">{metric.label}</InfoTip>
			{:else}
				<span class="text-[13px] text-muted-foreground">{metric.label}</span>
			{/if}
			<p class="text-base font-semibold text-foreground">{metric.value}</p>
			{#if metric.detail}
				<p class="text-xs text-muted-foreground">{metric.detail}</p>
			{/if}
		</div>
	{/each}
</div>

<div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
	<div class="space-y-4">
		{#if reportedSeries.length}
			<section class={BOX}>
				<h3 class="mb-2 text-base font-semibold text-foreground">
					<InfoTip text={SECTION_HELP.reported}>
						<span>Reported {fieldLabel} <span class="font-normal text-muted-foreground">({fieldUnit})</span></span>
					</InfoTip>
				</h3>
				<YearSeriesChart {years} series={reportedSeries} formatValue={formatReported} {markYear} />
				{#if level === 'country' && zone.series.harveststat}
					<p class="mt-2 text-xs text-muted-foreground">
						HarvestStat country totals are shown only for years in which the reporting regions hold at
						least {Math.round(100 * MIN_COUNTRY_COVERAGE)}% of the crop's area.
					</p>
				{/if}
			</section>
		{/if}
		{#if anomalySeries.length}
			<section class={BOX}>
				<h3 class="mb-2 text-base font-semibold text-foreground">
					<InfoTip text={cell ? `${SECTION_HELP.anomalies} ${SECTION_HELP.cell}` : SECTION_HELP.anomalies}>
						<span>Yield anomalies <span class="font-normal text-muted-foreground">(standard deviations from trend)</span></span>
					</InfoTip>
				</h3>
				<YearSeriesChart {years} series={anomalySeries} formatValue={formatAnomaly} zeroLine {markYear} />
			</section>
		{/if}
	</div>

	<section class={BOX}>
		<h3 class="mb-3 text-base font-semibold text-foreground">
			<InfoTip text={SECTION_HELP.cropMix}>Crops grown here</InfoTip>
		</h3>
		{#await cropMixRequest}
			<p class="text-sm text-muted-foreground">Loading crops…</p>
		{:then items}
			{#if items?.length}
				<CropMixBars
					{items}
					selectedCrop={cropId}
					modelColor={colors.model}
					reportedColor={cell ? undefined : reportedColor}
					reportedLabel={cell ? '' : reportedLabel}
					selectable={selectableCrops}
					{onSelectCrop}
				/>
			{:else}
				<p class="text-sm text-muted-foreground">No crop areas for this place.</p>
			{/if}
		{:catch error}
			<p class="text-sm text-destructive">Could not load the crops. {error.message}</p>
		{/await}
		{#if faoItems.length > 1}
			<p class="mt-3 text-xs text-muted-foreground">
				In the statistics, this crop group adds up: {faoItems.join('; ')}.
			</p>
		{/if}
		{#each notes as note (note)}
			<p class="mt-2 text-xs text-muted-foreground">{note}</p>
		{/each}
	</section>
</div>
