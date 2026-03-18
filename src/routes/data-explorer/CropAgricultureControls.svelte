<script>
	import { Separator } from '$lib/components/ui/separator';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';

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

<div class="shrink-0 overflow-x-auto overflow-y-hidden px-4 py-1.5">
	<div class="flex min-w-max items-center gap-2">
		<LabeledSelect
			label="Fly to"
			showLabel={false}
			bind:value={flyToCountry}
			options={countryOptions}
			placeholder="Fly to country"
			widthClass="w-36"
		/>

		<Separator orientation="vertical" class="h-4" />

		<LabeledSelect
			label={layerLabel}
			bind:value={dataset}
			options={layerOptions}
			placeholder="Select variable"
			widthClass="w-48"
		/>

		<LabeledSelect
			label="Crop"
			bind:value={crop}
			options={cropOptions}
			placeholder="Select crop"
			widthClass={isCalendarDataset ? 'w-64' : 'w-36'}
			disabled={!hasSelectedLayer}
		/>

		{#if showSeasonSelect}
			<LabeledSelect
				label="Season"
				bind:value={season}
				options={seasonOptions}
				placeholder="Select season"
				widthClass="w-40"
				disabled={!hasSelectedLayer}
			/>
		{/if}

		{#if showBoundarySelect}
			<LabeledSelect
				label="Boundary"
				bind:value={boundary}
				options={boundaryOptions}
				placeholder="Select boundary"
				widthClass="w-32"
				disabled={!hasSelectedLayer}
			/>
		{/if}

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
