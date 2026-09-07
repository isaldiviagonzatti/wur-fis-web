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
		OBSERVED_BOUNDARY_OPTIONS
	} from '$lib/domain-options.js';
	import { resetObservedAezFill } from '$lib/calendar-map.js';

	// Placeholder until observed yield artifacts are published. This page draws no
	// data layer yet, so the list only fills the control. It is local rather than
	// shared so it cannot be mistaken for a real crop source: the yield forecast
	// gets its crops from the published catalog.
	const PLACEHOLDER_CROP_OPTIONS = [
		{ value: 'maize', label: 'Maize' },
		{ value: 'sorghum', label: 'Sorghum' }
	];

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
		cropOptions={PLACEHOLDER_CROP_OPTIONS}
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
