<!--
  Agriculture tab — observed crop statistics and calendars by crop, boundary, and dataset.
-->
<script>
	import Map from '$lib/components/Map.svelte';
	import CropCalendarChart from '$lib/components/CropCalendarChart.svelte';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import CropAgricultureControls from './CropAgricultureControls.svelte';
	import {
		CALENDAR_STAGE_COLORS,
		MONTH_COLORS,
		MONTH_LABELS,
		getAezFeatureKey,
		getCalendarCropOptions,
		getCalendarSeasonOptions,
		toSentenceCase
	} from '$lib/calendar.js';
	import {
		getAezFeatureAtPoint,
		readAezFeature,
		resetObservedAezFill,
		updateAezOutline,
		updateCalendarAezFill
	} from '$lib/calendar-map.js';
	import {
		buildCalendarHoverPopupContent,
		CALENDAR_MAP_POPUP_CLASS
	} from '$lib/calendar-hover-popup.js';
	import { CALENDAR_URL, COUNTRY_OPTIONS, OBSERVED_CROP_OPTIONS } from '$lib/data-config.js';
	import '$lib/styles/calendar-map-popup.css';

	let { active = false } = $props();

	let map = $state(null);

	let dataset = $state('');
	let boundary = $state('');
	let crop = $state('');
	let season = $state('');
	let flyToCountry = $state('');
	let previousFlyToCountry = '';

	let calendarData = $state.raw(null);
	let calendarState = $state('idle');
	let selectedAezCountry = $state('');
	let selectedAezName = $state('');

	const observedDatasets = ['yield', 'production', 'harvested_area'];
	const calendarDatasets = ['sowing_date', 'harvest_date'];
	const datasetLabels = {
		yield: 'Observed yield',
		production: 'Observed production',
		harvested_area: 'Observed harvested area',
		sowing_date: 'Sowing date',
		harvest_date: 'Harvest date'
	};
	const boundaryLabels = {
		country: 'Country',
		admin1: 'Admin 1',
		admin2: 'Admin 2',
		aez: 'AEZ'
	};
	const countryLabels = Object.fromEntries(COUNTRY_OPTIONS.map(({ value, label }) => [value, label]));
	const countryViews = Object.fromEntries(COUNTRY_OPTIONS.map(({ value, view }) => [value, view]));
	const observedCropLabels = Object.fromEntries(
		OBSERVED_CROP_OPTIONS.map(({ value, label }) => [value, label])
	);
	const layerOptions = Object.entries(datasetLabels).map(([value, label]) => ({ value, label }));

	const isCalendarDataset = $derived(calendarDatasets.includes(dataset));
	const calendarCropOptions = $derived.by(() => getCalendarCropOptions(calendarData));
	const calendarSeasonOptions = $derived.by(() => getCalendarSeasonOptions(calendarData, crop));
	const cropOptions = $derived(isCalendarDataset ? calendarCropOptions : OBSERVED_CROP_OPTIONS);
	const cropLabels = $derived.by(() => {
		if (!isCalendarDataset) return observedCropLabels;
		return Object.fromEntries(calendarCropOptions.map(({ value, label }) => [value, label]));
	});
	const validCropValues = $derived.by(() => new Set(cropOptions.map(({ value }) => value)));
	const seasonLabels = $derived.by(
		() => Object.fromEntries(calendarSeasonOptions.map(({ value, label }) => [value, label]))
	);
	const validSeasonValues = $derived.by(() => new Set(calendarSeasonOptions.map(({ value }) => value)));
	const requiresSeasonSelection = $derived(
		isCalendarDataset && crop && calendarSeasonOptions.length > 1
	);
	const showSeasonSelect = $derived(requiresSeasonSelection);
	const availableBoundaries = $derived(isCalendarDataset ? ['aez'] : ['country', 'admin1', 'admin2']);
	const boundaryOptions = $derived.by(() =>
		availableBoundaries.map((value) => ({ value, label: boundaryLabels[value] }))
	);
	const selectedAezKey = $derived(
		selectedAezCountry && selectedAezName
			? getAezFeatureKey(selectedAezCountry, selectedAezName)
			: ''
	);
	const selectedAezEntries = $derived.by(() => {
		if (!selectedAezCountry || !selectedAezName) return [];
		return calendarData?.[selectedAezCountry]?.[selectedAezName] ?? [];
	});
	const chartTitle = $derived(
		selectedAezName
			? `${toSentenceCase(selectedAezName)} — ${countryLabels[selectedAezCountry] ?? selectedAezCountry}`
			: null
	);
	const legendTitle = $derived(datasetLabels[dataset] ?? 'Calendar month');
	const legendSubtitle = $derived(
		requiresSeasonSelection && !season
			? 'Choose a season to color the AEZs'
			: dataset === 'harvest_date'
				? `AEZ fill colors show harvest month${seasonLabels[season] ? ` for ${seasonLabels[season]}` : ''}`
			: `AEZ fill colors show sowing month${seasonLabels[season] ? ` for ${seasonLabels[season]}` : ''}`
	);
	const hasActiveControlSelection = $derived(
		Boolean(dataset || crop || season || flyToCountry || selectedAezKey)
	);

	function clearSelectedAez() {
		selectedAezCountry = '';
		selectedAezName = '';
	}

	function clearAllSelections() {
		flyToCountry = '';
		dataset = '';
		boundary = '';
		crop = '';
		season = '';
		previousFlyToCountry = '';
		clearSelectedAez();
	}

	$effect(() => {
		if (!crop) return;
		if (!validCropValues.has(crop)) crop = '';
	});

	$effect(() => {
		if (!isCalendarDataset || !crop) {
			season = '';
			return;
		}

		if (calendarSeasonOptions.length === 1) {
			const [onlySeason] = calendarSeasonOptions;
			if (season !== onlySeason.value) season = onlySeason.value;
			return;
		}

		if (!season) return;
		if (!validSeasonValues.has(season)) season = '';
	});

	$effect(() => {
		if (isCalendarDataset) boundary = 'aez';
		else if (observedDatasets.includes(dataset) && (!boundary || boundary === 'aez')) boundary = 'country';
		else if (dataset === '') boundary = '';
	});

	$effect(() => {
		if (!map || !flyToCountry || flyToCountry === previousFlyToCountry) return;
		previousFlyToCountry = flyToCountry;

		const target = countryViews[flyToCountry];
		if (!target) return;

		const fly = () => {
			map.flyTo({
				center: target.center,
				zoom: target.zoom,
				duration: 900,
				essential: true
			});
		};

		if (!map.isStyleLoaded()) map.once('load', fly);
		else fly();
	});

	$effect(() => {
		if (!isCalendarDataset || calendarData || calendarState === 'loading') return;
		calendarState = 'loading';

		fetch(CALENDAR_URL)
			.then((response) => response.json())
			.then((data) => {
				calendarData = data;
				calendarState = 'ready';
			})
			.catch(() => {
				calendarState = 'error';
			});
	});

	$effect(() => {
		if (!map || !isCalendarDataset) return;
		updateCalendarAezFill(map, { calendarData, crop, season, dataset, selectedAezKey });
	});

	$effect(() => {
		if (!map || isCalendarDataset) return;
		resetObservedAezFill(map);
	});

	$effect(() => {
		if (!map) return;

		const onMapClick = (event) => {
			const match = readAezFeature(getAezFeatureAtPoint(map, event.point));
			if (!match) {
				clearSelectedAez();
				return;
			}

			selectedAezCountry = match.country;
			selectedAezName = match.aezName;
		};

		map.on('click', onMapClick);
		map.getCanvas().style.cursor = '';

		return () => {
			map.off('click', onMapClick);
			map.getCanvas().style.cursor = '';
		};
	});

	$effect(() => {
		if (!map) return;

		let cancelled = false;
		let popup = null;
		let removeListeners = () => {};

		import('maplibre-gl').then(({ Popup }) => {
			if (cancelled) return;

			popup = new Popup({
				closeButton: false,
				closeOnClick: false,
				closeOnMove: false,
				className: CALENDAR_MAP_POPUP_CLASS,
				offset: 14
			});

			const hidePopup = () => {
				map.getCanvas().style.cursor = '';
				popup?.remove();
			};

			const onMapMove = (event) => {
				if (!isCalendarDataset) {
					hidePopup();
					return;
				}

				const match = readAezFeature(getAezFeatureAtPoint(map, event.point));
				if (!match) {
					hidePopup();
					return;
				}

				map.getCanvas().style.cursor = 'pointer';

				const popupContent = buildCalendarHoverPopupContent({
					calendarData,
					countryLabels,
					aezCountry: match.country,
					aezName: match.aezName,
					crop,
					cropLabels,
					season,
					requiresSeasonSelection
				});

				popup.setLngLat(event.lngLat).setDOMContent(popupContent).addTo(map);
			};

			map.on('mousemove', onMapMove);
			map.on('mouseout', hidePopup);

			removeListeners = () => {
				map.off('mousemove', onMapMove);
				map.off('mouseout', hidePopup);
				hidePopup();
			};
		});

		return () => {
			cancelled = true;
			removeListeners();
		};
	});

	$effect(() => {
		updateAezOutline(map, { isCalendarDataset, selectedAezKey });
	});
</script>

<CropAgricultureControls
	bind:flyToCountry
	bind:dataset
	bind:crop
	bind:season
	bind:boundary
	countryOptions={COUNTRY_OPTIONS}
	layerOptions={layerOptions}
	cropOptions={cropOptions}
	seasonOptions={calendarSeasonOptions}
	boundaryOptions={boundaryOptions}
	{showSeasonSelect}
	{isCalendarDataset}
	showClearButton={true}
	clearDisabled={!hasActiveControlSelection}
	onClear={clearAllSelections}
/>

<div class="space-y-3 px-4 py-3">
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		{#if active}
			<Map bind:map adminLevel={boundary} />
		{/if}
	</div>

	{#if isCalendarDataset}
		<ColorScaleLegend
			title={legendTitle}
			subtitle={legendSubtitle}
			colors={MONTH_COLORS}
			labels={MONTH_LABELS}
		/>

		<div class="rounded-md border border-border/70 bg-card/70 p-3">
				<div class="mb-3 flex flex-wrap items-start justify-between gap-3">
					<div>
					<p class="text-xs font-medium text-muted-foreground">Crop calendar</p>
					<p class="mt-1 text-sm font-semibold text-foreground">
						{chartTitle ?? 'Select an AEZ on the map'}
					</p>
					<div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
						<span class="inline-flex items-center gap-1.5">
							<span
								class="h-2.5 w-2.5 rounded-full"
								style:background={CALENDAR_STAGE_COLORS.sowing}
							></span>
							Sowing
						</span>
						<span class="inline-flex items-center gap-1.5">
							<span
								class="h-2.5 w-2.5 rounded-full"
								style:background={CALENDAR_STAGE_COLORS.season}
							></span>
							In season
						</span>
						<span class="inline-flex items-center gap-1.5">
							<span
								class="h-2.5 w-2.5 rounded-full"
								style:background={CALENDAR_STAGE_COLORS.harvest}
							></span>
							Harvest
						</span>
						</div>
					</div>

					{#if selectedAezKey}
						<button
							type="button"
							onclick={clearSelectedAez}
							class="inline-flex cursor-pointer items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							Clear selection
						</button>
					{/if}

				</div>

			{#if calendarState === 'error'}
				<div class="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-muted/10">
					<p class="text-xs text-muted-foreground">Calendar data could not be loaded.</p>
				</div>
			{:else}
				<CropCalendarChart entries={selectedAezEntries} />
			{/if}
		</div>
	{/if}
</div>
