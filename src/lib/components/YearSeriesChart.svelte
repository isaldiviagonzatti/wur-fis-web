<!--
  YearSeriesChart — one value per year for a few series on a shared axis.

  Each series is a line with a dot per reported year, so gaps in the statistics
  stay visible instead of being bridged. A series can instead be drawn dashed
  and without dots, for a fitted trend that belongs to another series; being a
  fitted curve, it runs through the gaps. The
  selected year is marked with a dotted rule, and a zero line can be drawn for
  anomalies.

  Series arrive aligned to `years` with null for missing years. One axis only:
  quantities in different units belong in separate charts. Clicking a legend
  entry hides or shows its series; the axis then fits the series left.
-->
<script>
	import { Axis, Chart, Points, Rule, Spline, Svg, Tooltip } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import '$lib/styles/info-card.css';

	let {
		years = [],
		// [{ key, label, color, values, dashed?, hideFromTooltip? }]
		series = [],
		formatValue = (value) => String(value),
		zeroLine = false,
		markYear = null,
		height = 170
	} = $props();

	const PAD = { top: 8, right: 10, bottom: 22, left: 44 };

	// Keys of the series the reader has switched off in the legend.
	let hidden = $state([]);
	const shownSeries = $derived(series.filter((entry) => !hidden.includes(entry.key)));

	function toggle(key) {
		hidden = hidden.includes(key) ? hidden.filter((other) => other !== key) : [...hidden, key];
	}

	const rows = $derived(
		years.map((year, index) => ({
			year,
			...Object.fromEntries(series.map((entry) => [entry.key, entry.values[index] ?? null]))
		}))
	);

	const yDomain = $derived.by(() => {
		const values = shownSeries.flatMap((entry) => entry.values).filter(Number.isFinite);
		if (zeroLine) values.push(0);
		if (!values.length) return [0, 1];
		const low = Math.min(...values);
		const high = Math.max(...values);
		const pad = (high - low || Math.abs(high) || 1) * 0.08;
		return [low - pad, high + pad];
	});

	const xDomain = $derived(years.length ? [years[0], years[years.length - 1]] : [0, 1]);
	const tooltipSeries = $derived(shownSeries.filter((entry) => !entry.hideFromTooltip));
</script>

<div class="year-series-chart" style:height={`${height}px`}>
	<Chart
		data={rows}
		x="year"
		xScale={scaleLinear()}
		yScale={scaleLinear()}
		{xDomain}
		{yDomain}
		padding={PAD}
		tooltipContext={{ mode: 'bisect-x' }}
	>
		<Svg>
			<Axis placement="left" ticks={4} format={formatValue} grid />
			<Axis placement="bottom" ticks={6} format={(year) => String(year)} />
			{#if zeroLine}
				<Rule y={0} class="stroke-muted-foreground/60" />
			{/if}
			{#if markYear !== null}
				<Rule x={markYear} class="stroke-muted-foreground" stroke-dasharray="2 3" />
			{/if}
			{#each shownSeries as entry (entry.key)}
				<!-- A fitted trend is continuous, so it is drawn through gaps; a
				     reported series breaks at them, so missing years stay visible. -->
				<Spline
					data={entry.dashed ? rows.filter((row) => row[entry.key] !== null) : rows}
					y={entry.key}
					defined={(row) => row[entry.key] !== null}
					stroke={entry.color}
					strokeWidth={entry.dashed ? 1.25 : 2}
					stroke-dasharray={entry.dashed ? '5 4' : undefined}
				/>
				{#if !entry.dashed}
					<Points
						data={rows.filter((row) => row[entry.key] !== null)}
						y={entry.key}
						r={2.5}
						fill={entry.color}
						strokeWidth={0}
					/>
				{/if}
			{/each}
		</Svg>
		<Tooltip.Root variant="none">
			{#snippet children({ data })}
				<div class="info-card">
					<div class="info-card__meta">
						<p class="info-card__title">{data.year}</p>
					</div>
					<div class="info-card__body">
						{#each tooltipSeries as entry (entry.key)}
							{#if data[entry.key] !== null}
								<div class="info-card__row">
									<span class="info-card__swatch" style:background={entry.color}></span>
									<span class="info-card__label">{entry.label}</span>
									<span class="info-card__number">{formatValue(data[entry.key])}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/snippet}
		</Tooltip.Root>
	</Chart>
</div>

<div class="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
	{#each series as entry (entry.key)}
		{@const off = hidden.includes(entry.key)}
		<button
			type="button"
			onclick={() => toggle(entry.key)}
			aria-pressed={!off}
			title={off ? `Show ${entry.label}` : `Hide ${entry.label}`}
			class={[
				'inline-flex cursor-pointer items-center gap-1.5 rounded px-1 transition-opacity hover:text-foreground',
				off && 'line-through opacity-40'
			]}
		>
			{#if entry.dashed}
				<span class="w-4 border-t-2 border-dashed" style:border-color={entry.color}></span>
			{:else}
				<span class="h-1 w-4 rounded-full" style:background={entry.color}></span>
			{/if}
			{entry.label}
		</button>
	{/each}
</div>

<style>
	/* LayerChart's 10px tick labels are too small to read on a laptop. */
	.year-series-chart :global(.lc-axis-tick-label) {
		font-size: 12px;
	}
</style>
