<!--
  Crop Calendars explorer — sowing and harvest dates by AEZ.
-->
<script>
	import Map from '$lib/components/Map.svelte';
	import CropCalendarChart from '$lib/components/CropCalendarChart.svelte';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import CropAgricultureControls from '../CropAgricultureControls.svelte';
	import {
		CALENDAR_STAGE_COLORS,
		MONTH_COLORS,
		MONTH_LABELS,
		getAezFeatureKey,
		getCalendarEntriesForAez,
		getCalendarCropOptions,
		getCalendarSeasonOptions,
		toSentenceCase
	} from '$lib/calendar.js';
	import {
		getAezFeatureAtPoint,
		readAezFeature,
		updateAezOutline,
		updateCalendarAezFill
	} from '$lib/calendar-map.js';
	import {
		buildCalendarHoverPopupContent,
		CALENDAR_MAP_POPUP_CLASS
	} from '$lib/calendar-hover-popup.js';
	import {
		CALENDAR_URL,
		COUNTRY_LABELS,
		COUNTRY_OPTIONS,
		COUNTRY_VIEWS
	} from '$lib/data-config.js';
	import '$lib/styles/calendar-map-popup.css';

	let map = $state(null);

	let dataset = $state('sowing_date');
	let crop = $state('maize');
	let season = $state('annual');
	let flyToCountry = $state('');
	let previousFlyToCountry = '';

	let calendarData = $state.raw(null);
	let calendarState = $state('idle');
	let selectedAezCountry = $state('');
	let selectedAezName = $state('');

	const calendarDatasets = ['sowing_date', 'harvest_date'];
	const datasetLabels = { sowing_date: 'Sowing date', harvest_date: 'Harvest date' };
	const layerOptions = Object.entries(datasetLabels).map(([value, label]) => ({ value, label }));
	const calendarStageLegendItems = [
		{ label: 'Sowing', color: CALENDAR_STAGE_COLORS.sowing },
		{ label: 'In season', color: CALENDAR_STAGE_COLORS.season },
		{ label: 'Harvest', color: CALENDAR_STAGE_COLORS.harvest }
	];

	const calendarCropOptions = $derived.by(() => getCalendarCropOptions(calendarData));
	const calendarSeasonOptions = $derived.by(() => getCalendarSeasonOptions(calendarData, crop));
	const cropLabels = $derived.by(() =>
		Object.fromEntries(calendarCropOptions.map(({ value, label }) => [value, label]))
	);
	const validCropValues = $derived.by(() => new Set(calendarCropOptions.map(({ value }) => value)));
	const seasonLabels = $derived.by(() =>
		Object.fromEntries(calendarSeasonOptions.map(({ value, label }) => [value, label]))
	);
	const validSeasonValues = $derived.by(() => new Set(calendarSeasonOptions.map(({ value }) => value)));
	const requiresSeasonSelection = $derived(crop && calendarSeasonOptions.length > 1);
	const selectedAezKey = $derived(
		selectedAezCountry && selectedAezName
			? getAezFeatureKey(selectedAezCountry, selectedAezName)
			: ''
	);
	const selectedAezEntries = $derived.by(() =>
		getCalendarEntriesForAez(calendarData, selectedAezCountry, selectedAezName)
	);
	const chartTitle = $derived(
		selectedAezName
			? `${toSentenceCase(selectedAezName)} — ${COUNTRY_LABELS[selectedAezCountry] ?? selectedAezCountry}`
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
		crop = '';
		season = '';
		previousFlyToCountry = '';
		clearSelectedAez();
	}

	$effect(() => {
		if (!crop || !calendarData) return;
		if (!validCropValues.has(crop)) crop = '';
	});

	$effect(() => {
		if (!crop) { season = ''; return; }
		if (!calendarData) return;
		if (calendarSeasonOptions.length === 1) {
			const [only] = calendarSeasonOptions;
			if (season !== only.value) season = only.value;
			return;
		}
		if (!season) return;
		if (!validSeasonValues.has(season)) season = '';
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
		if (!calendarData && calendarState === 'idle') {
			calendarState = 'loading';
			fetch(CALENDAR_URL)
				.then((r) => r.json())
				.then((data) => { calendarData = data; calendarState = 'ready'; })
				.catch(() => { calendarState = 'error'; });
		}
	});

	$effect(() => {
		if (!map) return;
		updateCalendarAezFill(map, { calendarData, crop, season, dataset, selectedAezKey });
	});

	$effect(() => {
		if (!map) return;
		const mapInstance = map;

		const onMapClick = (event) => {
			const match = readAezFeature(getAezFeatureAtPoint(mapInstance, event.point));
			if (!match) { clearSelectedAez(); return; }
			selectedAezCountry = match.country;
			selectedAezName = match.aezName;
		};

		mapInstance.on('click', onMapClick);
		mapInstance.getCanvas().style.cursor = '';
		return () => {
			mapInstance.off('click', onMapClick);
			mapInstance.getCanvas().style.cursor = '';
		};
	});

	$effect(() => {
		if (!map) return;
		const mapInstance = map;

		let cancelled = false;
		let popup = null;
		let removeListeners = () => {};

		import('maplibre-gl').then(({ Popup }) => {
			if (cancelled) return;

			popup = new Popup({
				closeButton: false, closeOnClick: false, closeOnMove: false,
				className: CALENDAR_MAP_POPUP_CLASS, offset: 14
			});

			const hidePopup = () => {
				mapInstance.getCanvas().style.cursor = '';
				popup?.remove();
			};

			const onMapMove = (event) => {
				const match = readAezFeature(getAezFeatureAtPoint(mapInstance, event.point));
				if (!match) { hidePopup(); return; }

				mapInstance.getCanvas().style.cursor = 'pointer';
				const popupContent = buildCalendarHoverPopupContent({
					calendarData, countryLabels: COUNTRY_LABELS,
					aezCountry: match.country, aezName: match.aezName,
					crop, cropLabels, season, requiresSeasonSelection
				});
				popup.setLngLat(event.lngLat).setDOMContent(popupContent).addTo(mapInstance);
			};

			mapInstance.on('mousemove', onMapMove);
			mapInstance.on('mouseout', hidePopup);
			removeListeners = () => {
				mapInstance.off('mousemove', onMapMove);
				mapInstance.off('mouseout', hidePopup);
				hidePopup();
			};
		});

		return () => { cancelled = true; removeListeners(); };
	});

	$effect(() => {
		updateAezOutline(map, { isCalendarDataset: true, selectedAezKey });
	});
</script>

<CropAgricultureControls
	bind:flyToCountry
	bind:dataset
	bind:crop
	bind:season
	boundary="aez"
	countryOptions={COUNTRY_OPTIONS}
	layerOptions={layerOptions}
	cropOptions={calendarCropOptions}
	seasonOptions={calendarSeasonOptions}
	boundaryOptions={[{ value: 'aez', label: 'AEZ' }]}
	showSeasonSelect={requiresSeasonSelection}
	layerLabel="Variable"
	showBoundarySelect={false}
	isCalendarDataset={true}
	showClearButton={true}
	clearDisabled={!hasActiveControlSelection}
	onClear={clearAllSelections}
/>

<div class="space-y-3 px-4 py-3">
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		<Map bind:map adminLevel="aez" />
	</div>

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
					{#each calendarStageLegendItems as item (item.label)}
						<span class="inline-flex items-center gap-1.5">
							<span class="h-2.5 w-2.5 rounded-full" style:background={item.color}></span>
							{item.label}
						</span>
					{/each}
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
</div>
