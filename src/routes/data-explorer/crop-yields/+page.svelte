<!--
  Crop Yields explorer — observed yield, production, and harvested area by country and admin region.
-->
<script>
	import Map from '$lib/components/Map.svelte';
	import CropAgricultureControls from '../CropAgricultureControls.svelte';
	import {
		resetObservedAezFill
	} from '$lib/calendar-map.js';
	import {
		COUNTRY_OPTIONS,
		OBSERVED_BOUNDARY_OPTIONS,
		OBSERVED_CROP_OPTIONS
	} from '$lib/data-config.js';

	let map = $state(null);

	let dataset = $state('yield');
	let boundary = $state('country');
	let crop = $state('maize');
	let flyToCountry = $state('');
	const datasetLabels = {
		yield: 'Observed yield',
		production: 'Observed production',
		harvested_area: 'Observed harvested area'
	};
	const layerOptions = Object.entries(datasetLabels).map(([value, label]) => ({ value, label }));
	const hasActiveControlSelection = $derived(Boolean(dataset || crop || flyToCountry));

	function clearAllSelections() {
		flyToCountry = '';
		dataset = '';
		boundary = '';
		crop = '';
	}

	$effect(() => {
		if (dataset && (!boundary || boundary === 'aez')) boundary = 'country';
		else if (!dataset) boundary = '';
	});

	$effect(() => {
		if (!map) return;
		resetObservedAezFill(map);
	});
</script>

<div class="flex flex-col gap-2 px-4 py-3">
	<CropAgricultureControls
		bind:dataset
		bind:crop
		season=""
		bind:boundary
		layerOptions={layerOptions}
		cropOptions={OBSERVED_CROP_OPTIONS}
		seasonOptions={[]}
		boundaryOptions={OBSERVED_BOUNDARY_OPTIONS}
		showSeasonSelect={false}
		layerLabel="Variable"
		isCalendarDataset={false}
		showClearButton={true}
		clearDisabled={!hasActiveControlSelection}
		onClear={clearAllSelections}
	/>
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		<Map bind:map bind:flyToCountry adminLevel={boundary} countryOptions={COUNTRY_OPTIONS} />
	</div>
</div>
