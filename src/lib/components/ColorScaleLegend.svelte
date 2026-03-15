<script>
	let { title = 'Legend', subtitle = '', colors = [], labels = [] } = $props();

	const gridTemplate = $derived(`repeat(${Math.max(colors.length, 1)}, minmax(0, 1fr))`);
</script>

<div class="rounded-md border border-border/70 bg-card/80 p-3">
	<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
		<p class="text-xs font-medium text-foreground">{title}</p>
		{#if subtitle}
			<p class="text-[11px] text-muted-foreground">{subtitle}</p>
		{/if}
	</div>

	<div class="overflow-x-auto">
		<div class="min-w-[34rem]">
			<div
				class="grid gap-px overflow-hidden rounded-sm border border-border/70 bg-border/70"
				style:grid-template-columns={gridTemplate}
			>
				{#each colors as color, index (`${color}-${index}`)}
					<div class="h-3.5" style:background={color}></div>
				{/each}
			</div>

			{#if labels.length === colors.length}
				<div class="mt-2 grid gap-2" style:grid-template-columns={gridTemplate}>
					{#each labels as label (`${label}`)}
						<span class="text-center text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
							{label}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
