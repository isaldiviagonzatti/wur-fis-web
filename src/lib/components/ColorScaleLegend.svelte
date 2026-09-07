<script>
	import { getNoDataHatchBackground } from '$lib/no-data-pattern.js';

	let {
		title = '',
		subtitle = '',
		colors = [],
		labels = [],
		noDataLabel = '',
		containerClass = 'rounded-md border border-border/70 bg-card/80 p-3',
		noDataSwatchClass = 'w-10 sm:w-12',
		barHeightClass = 'h-3'
	} = $props();

	const gridTemplate = $derived(`repeat(${Math.max(colors.length, 1)}, minmax(0, 1fr))`);
	const noDataHatchBackground = getNoDataHatchBackground();
	// Without a no-data swatch the reserved first column is dead space that makes
	// the ramp look cramped, so collapse to a single column in that case.
	const outerColumns = $derived(
		noDataLabel ? 'grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3rem_minmax(0,1fr)]' : 'grid-cols-1'
	);
</script>

<div class={containerClass}>
	{#if title || subtitle}
		<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
			{#if title}
				<p class="text-xs font-medium text-foreground">{title}</p>
			{/if}
			{#if subtitle}
				<p class="text-[11px] text-muted-foreground">{subtitle}</p>
			{/if}
		</div>
	{/if}

	<div class={`grid items-start gap-x-2 gap-y-1.5 sm:gap-x-3 ${outerColumns}`}>
		{#if noDataLabel}
			<div class="flex justify-center">
				<span class={`grid overflow-hidden rounded-sm border border-border/70 bg-border/70 ${noDataSwatchClass}`}>
					<span
						class="h-3 bg-muted/30"
						style:background-image={noDataHatchBackground}
					></span>
				</span>
			</div>
		{/if}

		<div
			class="grid gap-px overflow-hidden rounded-sm border border-border/70 bg-border/70"
			style:grid-template-columns={gridTemplate}
		>
			{#each colors as color, index (`${color}-${index}`)}
				<div class={barHeightClass} style:background={color}></div>
			{/each}
		</div>

		{#if noDataLabel}
			<div class="flex justify-center">
				<span class="text-center text-[9px] font-medium tracking-tight text-muted-foreground">
					{noDataLabel}
				</span>
			</div>
		{/if}

		{#if labels.length === colors.length}
			<div class="grid" style:grid-template-columns={gridTemplate}>
				{#each labels as label, index (`${label}-${index}`)}
					<span class="text-center text-[9px] font-medium uppercase tracking-tight text-muted-foreground">
						{label}
					</span>
				{/each}
			</div>
		{/if}
	</div>
</div>
