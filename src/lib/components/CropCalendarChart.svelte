<!--
  Horizontal Gantt chart showing sowing → maturity for each crop in a selected AEZ.
  Rows are shown in alphabetical crop order.
  Wrap-around seasons (maturity < sowing) are drawn as two segments.
  Drawn at the width it is given, not scaled, so its text keeps one size
  whether the chart sits beside the map or below it; narrower than
  MIN_CHART_WIDTH it scrolls sideways.
-->
<script>
	import {
		CALENDAR_STAGE_COLORS,
		MONTH_LABELS,
		getCalendarDisplayLabel,
		getCalendarDisplaySeasonLabel,
		getCalendarEntryLabel
	} from '$lib/calendar.js';

	let { entries = [] } = $props();

	const ROW_HEIGHT = 28;
	// Fits the longest label in the data, "Tropical cereals sorghum (short)" (180 px).
	const LABEL_WIDTH = 196;
	const MIN_CHART_WIDTH = 300;
	// Until the container is measured (and when prerendering).
	const DEFAULT_WIDTH = 760;
	let width = $state(0);
	const chartWidth = $derived(Math.max((width || DEFAULT_WIDTH) - LABEL_WIDTH, MIN_CHART_WIDTH));
	const monthWidth = $derived(chartWidth / 12);
	const CHART_PADDING_TOP = 24; // space for month axis labels
	const CHART_PADDING_BOTTOM = 8;
	const BAR_HEIGHT = 14;
	const BAR_RADIUS = 3;

	// x position (0..1) for a month within the 12-month axis
	function monthX(month) {
		return (month - 1) / 12;
	}

	// Returns one or two {x, width} segments for a bar (handles wrap-around)
	function barSegments(sowingMonth, maturityMonth) {
		if (maturityMonth >= sowingMonth) {
			return [{ x: monthX(sowingMonth), width: (maturityMonth - sowingMonth + 1) / 12 }];
		}
		// Wrap-around: two segments
		return [
			{ x: monthX(sowingMonth), width: (12 - sowingMonth + 1) / 12 },
			{ x: 0, width: maturityMonth / 12 }
		];
	}

	function markerX(month) {
		return LABEL_WIDTH + monthX(month) * chartWidth;
	}

	const sortedEntries = $derived.by(() =>
		[...entries].sort((left, right) => {
			const cropOrder = getCalendarEntryLabel(left).localeCompare(getCalendarEntryLabel(right));
			if (cropOrder !== 0) return cropOrder;
			return String(left.season ?? '').localeCompare(String(right.season ?? ''));
		})
	);

	const svgHeight = $derived(
		CHART_PADDING_TOP + sortedEntries.length * ROW_HEIGHT + CHART_PADDING_BOTTOM
	);
</script>

{#if sortedEntries.length === 0}
	<div class="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-muted/10">
		<p class="text-xs text-muted-foreground">Click an agro-ecological zone on the map  or select from the dropdown</p>
	</div>
{:else}
	<div class="w-full overflow-x-auto" bind:clientWidth={width}>
		<svg
			width={LABEL_WIDTH + chartWidth}
			height={svgHeight}
			viewBox="0 0 {LABEL_WIDTH + chartWidth} {svgHeight}"
			class="block"
		>
			<!-- Month axis labels -->
			{#each MONTH_LABELS as label, i (`month-label-${label}`)}
				<text
					x={LABEL_WIDTH + (i / 12) * chartWidth + chartWidth / 24}
					y={CHART_PADDING_TOP - 6}
					text-anchor="middle"
					font-size="11"
					fill="currentColor"
					opacity="0.5"
				>{label}</text>
			{/each}

			<!-- Month grid lines -->
			{#each MONTH_LABELS as _, i (`month-line-${i}`)}
				<line
					x1={LABEL_WIDTH + (i / 12) * chartWidth}
					y1={CHART_PADDING_TOP - 4}
					x2={LABEL_WIDTH + (i / 12) * chartWidth}
					y2={svgHeight - CHART_PADDING_BOTTOM}
					stroke="currentColor"
					stroke-opacity="0.08"
					stroke-width="1"
				/>
			{/each}

			<!-- Rows -->
			{#each sortedEntries as entry, i (`${entry.crop}-${entry.season}-${entry.sowing_month}-${entry.maturity_month}`)}
				{@const y = CHART_PADDING_TOP + i * ROW_HEIGHT}
				{@const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2}
				{@const segments = barSegments(entry.sowing_month, entry.maturity_month)}
				{@const sowingX = markerX(entry.sowing_month)}
				{@const harvestX = markerX(entry.maturity_month)}
				{@const isSingleMonth = entry.sowing_month === entry.maturity_month}

				<!-- Crop label -->
				<text
					x={LABEL_WIDTH - 8}
					y={y + ROW_HEIGHT / 2 + 4}
					text-anchor="end"
					font-size="12"
					fill="currentColor"
					opacity="0.8"
				>
					{getCalendarDisplayLabel(entry)}
					{#if entry.season !== 'annual'}
						<tspan font-size="10" opacity="0.5"> ({getCalendarDisplaySeasonLabel(entry)})</tspan>
					{/if}
				</text>

				<!-- Background track -->
				<rect
					x={LABEL_WIDTH}
					y={barY}
					width={chartWidth}
					height={BAR_HEIGHT}
					rx={BAR_RADIUS}
					fill="currentColor"
					opacity="0.05"
				/>

				<!-- Bar segment(s) -->
				{#each segments as seg, segmentIndex (`${entry.crop}-${entry.season}-${segmentIndex}`)}
					<rect
						x={LABEL_WIDTH + seg.x * chartWidth}
						y={barY}
						width={seg.width * chartWidth}
						height={BAR_HEIGHT}
						rx={BAR_RADIUS}
						fill={CALENDAR_STAGE_COLORS.season}
						opacity="0.85"
					/>
				{/each}

				{#if isSingleMonth}
					<rect
						x={sowingX}
						y={barY}
						width={monthWidth / 2}
						height={BAR_HEIGHT}
						rx={BAR_RADIUS}
						fill={CALENDAR_STAGE_COLORS.sowing}
					/>
					<rect
						x={sowingX + monthWidth / 2}
						y={barY}
						width={monthWidth / 2}
						height={BAR_HEIGHT}
						rx={BAR_RADIUS}
						fill={CALENDAR_STAGE_COLORS.harvest}
					/>
				{:else}
					<rect
						x={sowingX}
						y={barY}
						width={monthWidth}
						height={BAR_HEIGHT}
						rx={BAR_RADIUS}
						fill={CALENDAR_STAGE_COLORS.sowing}
					/>
					<rect
						x={harvestX}
						y={barY}
						width={monthWidth}
						height={BAR_HEIGHT}
						rx={BAR_RADIUS}
						fill={CALENDAR_STAGE_COLORS.harvest}
					/>
				{/if}
			{/each}
		</svg>
	</div>
{/if}
