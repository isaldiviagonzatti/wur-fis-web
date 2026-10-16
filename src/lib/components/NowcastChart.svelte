<!--
  NowcastChart — one indicator of the crop nowcast: this season so far against
  the 1994-2023 reference seasons, from sowing onwards.

  The reference appears as its 5-95% range (band) and mean (dashed); this season
  is the solid line, ending at the last ERA5-Land day, which is also marked.
  Values arrive already scaled for display (percent), so no absolute model value
  is ever drawn. The day marker is placed from the shared x domain, like the
  markers of the density chart.
-->
<script>
	import { Area, Axis, Chart, Spline, Svg, Tooltip } from 'layerchart';
	import { scaleLinear, scaleUtc } from 'd3-scale';
	import { theme } from '$lib/theme.svelte.js';
	import { chartColors } from '$lib/yield-forecast.js';

	let { rows = [], through, yMax = null, height = 150 } = $props();

	const colors = $derived(chartColors(theme.dark));

	// Must match the Chart padding below so the day marker lines up.
	const PAD = { top: 8, right: 8, bottom: 22, left: 34 };
	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	const band = $derived(rows.filter((d) => d.p05 !== null && d.p95 !== null));
	const current = $derived(rows.filter((d) => d.current !== null));
	const xDomain = $derived(
		rows.length ? [rows[0].date, rows[rows.length - 1].date] : [new Date(0), new Date(1)]
	);
	const yTop = $derived(
		yMax ??
			1.05 *
				Math.max(1, ...rows.flatMap((d) => [d.p95, d.mean, d.current]).filter(Number.isFinite))
	);
	const throughLeft = $derived.by(() => {
		const day = new Date(`${through}T00:00:00Z`).getTime();
		const [low, high] = xDomain.map((date) => date.getTime());
		if (!(high > low) || day < low || day > high) return null;
		return `calc(${PAD.left}px + ${(day - low) / (high - low)} * (100% - ${PAD.left + PAD.right}px))`;
	});

	// Dates are UTC days and the ticks fall on UTC month starts (scaleUtc); a local-time scale
	// would put them at local midnight, i.e. the previous UTC day east of Greenwich.
	const formatMonth = (date) => MONTHS[date.getUTCMonth()];
	const formatDay = (date) => `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
	const formatValue = (value) => `${Math.round(value)}%`;
</script>

<div class="nowcast-chart relative" style:height={`${height}px`}>
	<Chart
		data={rows}
		x="date"
		y="mean"
		xScale={scaleUtc()}
		yScale={scaleLinear()}
		{xDomain}
		yDomain={[0, yTop]}
		padding={PAD}
		tooltip={{ mode: 'bisect-x' }}
	>
		<Svg>
			<Axis placement="left" ticks={4} format={formatValue} />
			<Axis placement="bottom" ticks={4} format={formatMonth} />
			<Area data={band} y0="p05" y1="p95" fill={colors.reference} fillOpacity={0.18} />
			<Spline
				data={rows}
				y="mean"
				defined={(d) => d.mean !== null}
				stroke={colors.reference}
				stroke-width={1.5}
				stroke-dasharray="4 3"
			/>
			<Spline data={current} y="current" stroke={colors.forecast} stroke-width={2.25} />
		</Svg>
		<Tooltip.Root>
			{#snippet children({ data })}
				<Tooltip.Header>{formatDay(data.date)}</Tooltip.Header>
				<Tooltip.List>
					{#if data.current !== null}
						<Tooltip.Item label="This season" value={formatValue(data.current)} color={colors.forecast} />
					{/if}
					{#if data.mean !== null}
						<Tooltip.Item label="Normal" value={formatValue(data.mean)} color={colors.reference} />
					{/if}
					{#if data.p05 !== null && data.p95 !== null}
						<Tooltip.Item
							label="Usual range"
							value={`${formatValue(data.p05)}–${formatValue(data.p95)}`}
						/>
					{/if}
				</Tooltip.List>
			{/snippet}
		</Tooltip.Root>
	</Chart>

	{#if throughLeft}
		<span
			class="pointer-events-none absolute w-0 border-l border-dotted border-muted-foreground"
			style:left={throughLeft}
			style:top={`${PAD.top}px`}
			style:bottom={`${PAD.bottom}px`}
			aria-hidden="true"
		></span>
	{/if}
</div>

<style>
	/* LayerChart's 10px tick labels are too small to read on a laptop. */
	.nowcast-chart :global(.lc-axis-tick-label) {
		font-size: 12px;
	}
</style>
