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
		COUNTRY_VIEWS,
		OBSERVED_BOUNDARY_OPTIONS,
		OBSERVED_CROP_OPTIONS
	} from '$lib/data-config.js';

	let map = $state(null);

	let dataset = $state('yield');
	let boundary = $state('country');
	let crop = $state('maize');
	let flyToCountry = $state('');
	let previousFlyToCountry = '';

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
		previousFlyToCountry = '';
	}

	$effect(() => {
		if (dataset && (!boundary || boundary === 'aez')) boundary = 'country';
		else if (!dataset) boundary = '';
	});

	$effect(() => {
		if (!map || !flyToCountry || flyToCountry === previousFlyToCountry) return;
		const mapInstance = map;
		previousFlyToCountry = flyToCountry;

		const target = COUNTRY_VIEWS[flyToCountry];
		if (!target) return;

		const fly = () => {
			mapInstance.flyTo({ center: target.center, zoom: target.zoom, duration: 900, essential: true });
		};

		if (!mapInstance.isStyleLoaded()) mapInstance.once('load', fly);
		else fly();
	});

	$effect(() => {
		if (!map) return;
		resetObservedAezFill(map);
	});
</script>

<CropAgricultureControls
	bind:flyToCountry
	bind:dataset
	bind:crop
	season=""
	bind:boundary
	countryOptions={COUNTRY_OPTIONS}
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

<div class="px-4 py-3">
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		<Map bind:map adminLevel={boundary} />
	</div>
</div>
