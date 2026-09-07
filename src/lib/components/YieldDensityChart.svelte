<!--
  Density plot for one clicked grid cell: the forecast ensemble against the
  reference years.

  Both distributions are rescaled to percent difference from the cell's own
  1994-2023 mean. That is the same linear transform applied to both, so the
  shapes are unchanged, but it makes the axis publishable — LPJmL absolute
  yields diverge from reported statistics by design and must not be shown, while
  a relative difference is exactly the quantity the map already reports. The
  reference distribution therefore centres on zero and the forecast mean lands on
  the same anomaly quoted in the panel above.

  Mean markers are positioned from the shared x domain rather than by the
  charting library, and the key below is a fixed row, so two means falling close
  together cannot overlap.
-->
<script>
	import { Area, Axis, Chart, Svg } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { FORECAST_COLOR, HISTORICAL_COLOR, kernelDensity, mean } from '$lib/yield-forecast.js';

	let { forecast = [], historical = [], height = 200 } = $props();

	// Must match the Chart padding below so markers line up with the curves.
	const PAD_LEFT = 8;
	const PAD_RIGHT = 8;
	const PAD_BOTTOM = 26;

	const referenceMean = $derived(mean(historical));

	/** Express yields as percent difference from the cell's reference mean. */
	function toAnomaly(values) {
		if (!Number.isFinite(referenceMean) || referenceMean === 0) return [];
		return values
			.filter((value) => Number.isFinite(value))
			.map((value) => (100 * (value - referenceMean)) / referenceMean);
	}

	const forecastAnomalies = $derived(toAnomaly(forecast));
	const historicalAnomalies = $derived(toAnomaly(historical));
	const forecastMeanValue = $derived(mean(forecastAnomalies));

	/**
	 * Scale a density curve to peak at 1.
	 *
	 * A kernel density integrates to 1, so a narrow distribution is tall and a
	 * wide one is low. By this initialization the forecast ensemble is often 10 to
	 * 100 times narrower than the reference, which on a shared density axis
	 * flattens the reference into an invisible line. Normalising each curve to its
	 * own peak keeps both readable and makes their relative width — the actual
	 * message — the thing you see.
	 */
	function normalize(curve) {
		const peak = Math.max(...curve.map((point) => point.y));
		if (!(peak > 0)) return curve;
		return curve.map((point) => ({ x: point.x, y: point.y / peak }));
	}

	const forecastCurve = $derived(normalize(kernelDensity(forecastAnomalies)));
	const historicalCurve = $derived(normalize(kernelDensity(historicalAnomalies)));
	// A reference curve is enough to plot against: where every member agrees the
	// forecast collapses to a single value, drawn as its marker line alone.
	const hasCurves = $derived(historicalCurve.length > 0);

	const combined = $derived([
		...forecastCurve,
		...historicalCurve,
		...(Number.isFinite(forecastMeanValue) ? [{ x: forecastMeanValue, y: 0 }] : [])
	]);
	const xDomain = $derived(
		combined.length
			? [Math.min(...combined.map((d) => d.x)), Math.max(...combined.map((d) => d.x))]
			: [-1, 1]
	);
	const yMax = $derived(1);

	const forecastMean = $derived(forecastMeanValue);

	/** Position across the plotting area, accounting for the chart's own padding. */
	function markerLeft(value) {
		const [low, high] = xDomain;
		if (!Number.isFinite(value) || high === low) return null;
		const fraction = Math.min(Math.max((value - low) / (high - low), 0), 1);
		return `calc(${PAD_LEFT}px + ${fraction} * (100% - ${PAD_LEFT + PAD_RIGHT}px))`;
	}

	// The reference mean is zero by construction on this scale, so it gets a plain
	// dashed rule and no key entry — naming it would only state the obvious.
	const referenceLeft = $derived(markerLeft(0));
	const forecastLeft = $derived(markerLeft(forecastMean));

	function formatPercent(value) {
		return `${value > 0 ? '+' : ''}${Math.round(value)}%`;
	}

	// One decimal so the marker matches the anomaly quoted in the panel above,
	// while the axis ticks stay as whole percents.
	function formatMean(value) {
		return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	}
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
		<span class="inline-flex items-center gap-1.5">
			<span class="h-2 w-4 rounded-sm" style:background={FORECAST_COLOR}></span>
			Forecast ensemble
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="h-2 w-4 rounded-sm" style:background={HISTORICAL_COLOR}></span>
			Reference years
		</span>
	</div>

	{#if hasCurves}
		<div class="relative" style:height={`${height}px`}>
			<Chart
				data={forecastCurve}
				x="x"
				y="y"
				xScale={scaleLinear()}
				yScale={scaleLinear()}
				{xDomain}
				yDomain={[0, yMax * 1.08]}
				padding={{ top: 8, right: PAD_RIGHT, bottom: PAD_BOTTOM, left: PAD_LEFT }}
			>
				<Svg>
					<Axis placement="bottom" ticks={6} format={formatPercent} />
					<Area
						data={historicalCurve}
						fill={HISTORICAL_COLOR}
						fillOpacity={0.28}
						line={{ stroke: HISTORICAL_COLOR, 'stroke-width': 1.5 }}
					/>
					{#if forecastCurve.length}
						<Area
							data={forecastCurve}
							fill={FORECAST_COLOR}
							fillOpacity={0.38}
							line={{ stroke: FORECAST_COLOR, 'stroke-width': 1.5 }}
						/>
					{/if}
				</Svg>
			</Chart>

			{#if referenceLeft}
				<span
					class="pointer-events-none absolute top-2 w-0 border-l border-dashed"
					style:left={referenceLeft}
					style:bottom={`${PAD_BOTTOM}px`}
					style:border-color={HISTORICAL_COLOR}
					aria-hidden="true"
				></span>
			{/if}
			{#if forecastLeft}
				<span
					class="pointer-events-none absolute top-2 w-0 border-l border-dashed"
					style:left={forecastLeft}
					style:bottom={`${PAD_BOTTOM}px`}
					style:border-color={FORECAST_COLOR}
					aria-hidden="true"
				></span>
				<span
					class="pointer-events-none absolute -translate-x-1/2 text-[10px] leading-none"
					style:left={forecastLeft}
					style:bottom={`${PAD_BOTTOM - 6}px`}
					style:color={FORECAST_COLOR}
					aria-hidden="true">▲</span
				>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
			{#if forecastLeft}
				<span class="inline-flex items-center gap-1" style:color={FORECAST_COLOR}>
					▲ Forecast mean ({formatMean(forecastMean)})
				</span>
			{/if}
		</div>
	{:else}
		<div class="flex h-24 items-center justify-center rounded-md bg-background/60">
			<p class="text-xs text-muted-foreground">No reference distribution for this cell.</p>
		</div>
	{/if}
</div>
