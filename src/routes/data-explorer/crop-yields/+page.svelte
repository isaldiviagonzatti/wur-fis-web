<!--
  Crop Yields explorer — observed yield, production, and harvested area by country and admin region.
-->
<script>
	import Map from '$lib/components/Map.svelte';
	import MapPanel from '$lib/components/MapPanel.svelte';
	import CropAgricultureControls from '../CropAgricultureControls.svelte';
	import {
		COUNTRY_OPTIONS,
		OBSERVED_DATASET_OPTIONS,
		OBSERVED_BOUNDARY_OPTIONS,
		OBSERVED_CROP_OPTIONS
	} from '$lib/data-config.js';
	import { resetObservedAezFill } from '$lib/calendar-map.js';

	let map = $state(null);

	let dataset = $state('yield');
	let boundary = $state('country');
	let crop = $state('maize');
	let flyToCountry = $state('');
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
		layerOptions={OBSERVED_DATASET_OPTIONS}
		cropOptions={OBSERVED_CROP_OPTIONS}
		seasonOptions={[]}
		boundaryOptions={OBSERVED_BOUNDARY_OPTIONS}
		showSeasonSelect={false}
		layerLabel="Variable"
		showClearButton={true}
		clearDisabled={!hasActiveControlSelection}
		onClear={clearAllSelections}
	/>
	<MapPanel>
		<Map bind:map bind:flyToCountry adminLevel={boundary} countryOptions={COUNTRY_OPTIONS} />
	</MapPanel>
</div>
