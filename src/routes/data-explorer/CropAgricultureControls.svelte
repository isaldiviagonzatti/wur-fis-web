<script>
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';

	let {
		flyToCountry = $bindable(''),
		dataset = $bindable(''),
		crop = $bindable(''),
		season = $bindable(''),
		boundary = $bindable(''),
		countryOptions = [],
		layerOptions = [],
		cropOptions = [],
		seasonOptions = [],
		boundaryOptions = [],
		showSeasonSelect = false,
		isCalendarDataset = false,
		showClearButton = false,
		clearDisabled = false,
		onClear = null
	} = $props();

	const hasSelectedLayer = $derived(Boolean(dataset));
</script>

<div class="shrink-0 overflow-x-auto overflow-y-hidden px-4 py-1.5">
	<div class="flex min-w-max items-center gap-2">
		<div class="flex items-center gap-1.5">
			<span class="text-xs font-medium text-muted-foreground">Fly to</span>
			<Select type="single" bind:value={flyToCountry}>
				<SelectTrigger size="sm" class="w-32">
					{countryOptions.find((option) => option.value === flyToCountry)?.label ?? 'Country'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each countryOptions as option (option.value)}
						<SelectItem value={option.value} label={option.label} />
					{/each}
				</SelectContent>
			</Select>
		</div>

		<Separator orientation="vertical" class="h-4" />

		<div class="flex items-center gap-1.5">
			<span class="text-xs font-medium text-muted-foreground">Layer</span>
			<Select type="single" bind:value={dataset}>
				<SelectTrigger size="sm" class="w-48">
					{layerOptions.find((option) => option.value === dataset)?.label ?? 'Select layer'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each layerOptions as option (option.value)}
						<SelectItem value={option.value} label={option.label} />
					{/each}
				</SelectContent>
			</Select>
		</div>

		<div class="flex items-center gap-1.5">
			<span class="text-xs font-medium text-muted-foreground">Crop</span>
			<Select type="single" bind:value={crop} disabled={!hasSelectedLayer}>
				<SelectTrigger size="sm" class={isCalendarDataset ? 'w-64' : 'w-36'}>
					{cropOptions.find((option) => option.value === crop)?.label ?? 'Select crop'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each cropOptions as option (option.value)}
						<SelectItem value={option.value} label={option.label} />
					{/each}
				</SelectContent>
			</Select>
		</div>

		{#if showSeasonSelect}
			<div class="flex items-center gap-1.5">
				<span class="text-xs font-medium text-muted-foreground">Season</span>
				<Select type="single" bind:value={season} disabled={!hasSelectedLayer}>
					<SelectTrigger size="sm" class="w-40">
						{seasonOptions.find((option) => option.value === season)?.label ?? 'Select season'}
					</SelectTrigger>
					<SelectContent style="width: var(--bits-select-anchor-width);">
						{#each seasonOptions as option (option.value)}
							<SelectItem value={option.value} label={option.label} />
						{/each}
					</SelectContent>
				</Select>
			</div>
		{/if}

		<div class="flex items-center gap-1.5">
			<span class="text-xs font-medium text-muted-foreground">Boundary</span>
			<Select type="single" bind:value={boundary} disabled={!hasSelectedLayer}>
				<SelectTrigger size="sm" class="w-32">
					{boundaryOptions.find((option) => option.value === boundary)?.label ?? 'Select boundary'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each boundaryOptions as option (option.value)}
						<SelectItem value={option.value} label={option.label} />
					{/each}
				</SelectContent>
			</Select>
		</div>

		{#if showClearButton}
			<button
				type="button"
				onclick={onClear}
				disabled={clearDisabled}
				class="ml-2 inline-flex cursor-pointer items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
			>
				Clear selection
			</button>
		{/if}
	</div>
</div>
