<!--
  CropMixBars — harvested area per crop in one place, as horizontal bars.

  Each crop gets up to two bars: the model's land use (SPAM 2017, fixed over
  time) and the reported area, when the statistics have it. Crops are ordered by
  the larger of the two, so the main crops lead whichever source knows about
  them. The crop selected on the map is named in bold; the others can be
  clicked to switch the page to them, when `onSelectCrop` is given and the crop
  is in `selectable`.
-->
<script>
	import { formatCompact } from '$lib/crop-yields.js';

	let {
		// [{ crop, label, model, reported }]
		items = [],
		selectedCrop = '',
		modelLabel = 'Model land use',
		reportedLabel = '',
		modelColor,
		reportedColor,
		limit = 10,
		selectable = [],
		onSelectCrop = null
	} = $props();

	const sorted = $derived(
		[...items]
			.sort(
				(left, right) =>
					Math.max(right.model ?? 0, right.reported ?? 0) -
					Math.max(left.model ?? 0, left.reported ?? 0)
			)
			.slice(0, limit)
	);
	const largest = $derived(
		Math.max(1, ...sorted.flatMap((item) => [item.model ?? 0, item.reported ?? 0]))
	);
	const hasReported = $derived(sorted.some((item) => Number.isFinite(item.reported)));
	const width = (value) => `${(100 * (value ?? 0)) / largest}%`;
</script>

<div class="space-y-1.5">
	{#each sorted as item (item.crop)}
		<div class="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-2 text-xs">
			{#if onSelectCrop && item.crop !== selectedCrop && selectable.includes(item.crop)}
				<button
					type="button"
					onclick={() => onSelectCrop(item.crop)}
					class="cursor-pointer truncate text-right text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
					title={`Show ${item.label}`}
				>
					{item.label}
				</button>
			{:else}
				<span
					class={[
						'truncate text-right',
						item.crop === selectedCrop ? 'font-semibold text-foreground' : 'text-muted-foreground'
					]}
					title={item.label}
				>
					{item.label}
				</span>
			{/if}
			<div class="space-y-0.5">
				{#each [{ value: item.model, color: modelColor, name: modelLabel }, ...(hasReported ? [{ value: item.reported, color: reportedColor, name: reportedLabel }] : [])] as bar (bar.name)}
					<div class="flex items-center gap-1.5" title={`${bar.name}: ${formatCompact(bar.value)} ha`}>
						<span
							class="h-2 min-w-px rounded-r-sm"
							style:width={width(bar.value)}
							style:background={bar.color}
						></span>
						<span class="shrink-0 tabular-nums text-muted-foreground">
							{Number.isFinite(bar.value) ? formatCompact(bar.value) : '—'}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<div class="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
	<span class="inline-flex items-center gap-1.5">
		<span class="h-2 w-4 rounded-sm" style:background={modelColor}></span>
		{modelLabel} (ha)
	</span>
	{#if hasReported}
		<span class="inline-flex items-center gap-1.5">
			<span class="h-2 w-4 rounded-sm" style:background={reportedColor}></span>
			{reportedLabel} (ha)
		</span>
	{/if}
</div>
