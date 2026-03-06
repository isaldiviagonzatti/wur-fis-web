<!--
  Agriculture tab — observed crop statistics and calendars by crop, boundary, and dataset.
-->
<script>
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import Map from '$lib/components/Map.svelte';

	let { active = false } = $props();

	let map = $state(null);

	let dataset = $state('');
	let boundary = $state('');
	let crop = $state('');
	let country = $state('');
	let previousCountry = '';

	const countryViews = {
		ghana: { center: [-1.02, 7.95], zoom: 5 },
		kenya: { center: [37.91, 0.15], zoom: 5 },
		zimbabwe: { center: [29.15, -19.02], zoom: 5 }
	};

	$effect(() => {
		if (!map || !country || country === previousCountry) return;
		previousCountry = country;
		const target = countryViews[country];
		if (!target) return;
		const fly = () => map.flyTo({ center: target.center, zoom: target.zoom, duration: 900, essential: true });
		if (!map.isStyleLoaded()) map.once('load', fly);
		else fly();
	});

	const observedDatasets = ['yield', 'production', 'harvested_area'];

	// Auto-set boundary based on dataset selection
	$effect(() => {
		if (dataset === 'calendar') boundary = 'aez';
		else if (observedDatasets.includes(dataset) && (!boundary || boundary === 'aez')) boundary = 'country';
		else if (dataset === '') boundary = '';
	});

	const datasetLabels = {
		yield: 'Observed yield',
		production: 'Observed production',
		harvested_area: 'Observed harvested area',
		calendar: 'Crop calendar'
	};

	const countryLabels = {
		ghana: 'Ghana',
		kenya: 'Kenya',
		zimbabwe: 'Zimbabwe'
	};

	const boundaryLabels = {
		country: 'Country',
		admin1: 'Admin 1',
		admin2: 'Admin 2',
		aez: 'AEZ'
	};

	const cropLabels = {
		maize: 'Maize',
		sorghum: 'Sorghum'
	};

	const availableBoundaries = $derived(
		dataset === 'calendar' ? ['aez'] : ['country', 'admin1', 'admin2']
	);
</script>

<!-- Controls bar -->
<div class="shrink-0 px-4 py-1.5 overflow-x-auto overflow-y-hidden">
	<div class="flex min-w-max items-center gap-2">
		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Dataset</span>
			<Select type="single" bind:value={dataset}>
				<SelectTrigger size="sm" class="w-48">
					{datasetLabels[dataset] ?? 'Select dataset'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					<SelectItem value="yield" label="Observed yield" />
					<SelectItem value="production" label="Observed production" />
					<SelectItem value="harvested_area" label="Observed harvested area" />
					<SelectItem value="calendar" label="Crop calendar" />
				</SelectContent>
			</Select>
		</div>

		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Country</span>
			<Select type="single" bind:value={country}>
				<SelectTrigger size="sm" class="w-32">
					{countryLabels[country] ?? 'Select country'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					<SelectItem value="ghana" label="Ghana" />
					<SelectItem value="kenya" label="Kenya" />
					<SelectItem value="zimbabwe" label="Zimbabwe" />
				</SelectContent>
			</Select>
		</div>

		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Boundary</span>
				<Select type="single" bind:value={boundary}>
					<SelectTrigger size="sm" class="w-32">
						{boundaryLabels[boundary] ?? 'Select boundary'}
					</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each availableBoundaries as b (b)}
						<SelectItem value={b} label={boundaryLabels[b]} />
					{/each}
				</SelectContent>
			</Select>
		</div>

		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Crop</span>
			<Select type="single" bind:value={crop}>
				<SelectTrigger size="sm" class="w-36">
					{cropLabels[crop] ?? 'Select crop'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each Object.entries(cropLabels) as [value, label] (value)}
						<SelectItem {value} {label} />
					{/each}
				</SelectContent>
			</Select>
		</div>
	</div>
</div>

<div class="px-4 py-3">
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		{#if active}
			<Map bind:map adminLevel={boundary} />
		{/if}
	</div>
</div>
