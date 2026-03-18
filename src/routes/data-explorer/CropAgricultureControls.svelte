<script>
import LabeledSelect from '$lib/components/LabeledSelect.svelte';

	let {
		dataset = $bindable(''),
		crop = $bindable(''),
		season = $bindable(''),
		boundary = $bindable(''),
		layerOptions = [],
		cropOptions = [],
		seasonOptions = [],
		boundaryOptions = [],
		layerLabel = 'Layer',
		showSeasonSelect = false,
		showBoundarySelect = true,
		isCalendarDataset = false,
		showClearButton = false,
		clearDisabled = false,
		onClear = null
	} = $props();

	const hasSelectedLayer = $derived(Boolean(dataset));
</script>

<div class="shrink-0 py-1.5">
	<div class="flex items-center justify-between gap-4">
		<!-- Left: data selectors -->
		<div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
			<LabeledSelect
				label="Crop"
				bind:value={crop}
				options={cropOptions}
				placeholder="Crop"
				widthClass="w-28"
				disabled={!hasSelectedLayer}
			/>

			{#if showSeasonSelect}
				<LabeledSelect
					label="Season"
					bind:value={season}
					options={seasonOptions}
					placeholder="Season"
					widthClass="w-28"
					disabled={!hasSelectedLayer}
				/>
			{/if}

			<LabeledSelect
				label={layerLabel}
				bind:value={dataset}
				options={layerOptions}
				placeholder="Variable"
				widthClass="w-32"
			/>

			{#if showBoundarySelect}
				<LabeledSelect
					label="Boundary"
					bind:value={boundary}
					options={boundaryOptions}
					placeholder="Boundary"
					widthClass="w-24"
					disabled={!hasSelectedLayer}
				/>
			{/if}
		</div>

		<!-- Right: navigation + clear -->
		{#if showClearButton}
			<div class="flex shrink-0 items-center gap-2">
				<button
					type="button"
					onclick={onClear}
					disabled={clearDisabled}
					class="inline-flex cursor-pointer items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
				>
					Clear selection
				</button>
			</div>
		{/if}
	</div>
</div>
