<!--
  Crop Calendars explorer — sowing and harvest dates by AEZ.

  The map and the calendar chart share one page: clicking a zone on the map
  shows its calendar beside it (below it on narrower screens), without
  switching views. Picking a country or zone by name above the chart selects
  the zone and zooms the map to it. Beside each other, map and calendar are
  one height.
-->
<script>
	import PageIntro from '$lib/components/PageIntro.svelte';
	import { PAGES } from '$lib/navigation.js';
	import Map from '$lib/components/Map.svelte';
	import MapFrame from '$lib/components/MapFrame.svelte';
	import MapToolLayout from '$lib/components/MapToolLayout.svelte';
	import CropCalendarChart from '$lib/components/CropCalendarChart.svelte';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import CropAgricultureControls from '../CropAgricultureControls.svelte';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import {
		CALENDAR_STAGE_COLORS,
		MONTH_COLORS,
		MONTH_LABELS,
		getAezFeatureKey,
		getCalendarEntriesForAez,
		getCalendarCropOptions,
		getCalendarSeasonOptions,
		getCalendarSeasonOptionsForAez,
		toSentenceCase
	} from '$lib/calendar.js';
	import {
		attachCalendarHoverPopup,
		bindAezSelection,
		trackAezBounds,
		updateAezOutline,
		updateCalendarAezFill,
		zoomToAez
	} from '$lib/calendar-map.js';
	import { buildCalendarHoverPopupContent } from '$lib/calendar-hover-popup.js';
	import { CALENDAR_URL } from '$lib/data-sources.js';
	import {
		CALENDAR_DATASET_OPTIONS,
		COUNTRY_LABELS,
		COUNTRY_OPTIONS,
		COUNTRY_VIEWS
	} from '$lib/domain-options.js';
	import { STUDY_AREA_VIEW } from '$lib/map-config.js';
	import { NO_DATA_LEGEND_LABEL } from '$lib/no-data-pattern.js';
	import '$lib/styles/calendar-map-popup.css';

	let map = $state(null);

	let dataset = $state('sowing_date');
	let crop = $state('maize');
	let season = $state('annual');

	let calendarData = $state.raw(null);
	let calendarState = $state('idle');
	let selectedAezCountry = $state('');
	let selectedAezName = $state('');
	let cancelZoneZoom = () => {};
	// Outline boxes of the zones, read from the map once it has shown them.
	// (`Map` on this page is the map component, hence globalThis.)
	const aezBounds = new globalThis.Map();
	// Beside the calendar (xl) the map fills the height both share, at least this.
	const MAP_HEIGHT = 'h-[42vh] min-h-[280px] max-h-[560px] xl:h-auto xl:min-h-[420px] xl:max-h-none xl:flex-1';

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
	// A selected zone narrows the season list to the crop's seasons there; a zone
	// without the crop keeps the whole list.
	const zoneSeasonOptions = $derived(
		getCalendarSeasonOptionsForAez(calendarData, crop, selectedAezCountry, selectedAezName)
	);
	const seasonOptions = $derived(zoneSeasonOptions.length ? zoneSeasonOptions : calendarSeasonOptions);
	const validSeasonValues = $derived.by(() => new Set(seasonOptions.map(({ value }) => value)));
	const requiresSeasonSelection = $derived(crop && calendarSeasonOptions.length > 1);
	const selectedAezKey = $derived(
		selectedAezCountry && selectedAezName
			? getAezFeatureKey(selectedAezCountry, selectedAezName)
			: ''
	);
	const selectedAezEntries = $derived.by(() =>
		getCalendarEntriesForAez(calendarData, selectedAezCountry, selectedAezName)
	);
	const aezOptionsByCountry = $derived.by(() => {
		if (!calendarData) return {};
		return Object.fromEntries(
			Object.entries(calendarData).map(([country, aezs]) => [
				country,
				Object.keys(aezs)
					.map((name) => ({ value: name, label: toSentenceCase(name) }))
					.sort((a, b) => a.label.localeCompare(b.label))
			])
		);
	});
	const aezOptions = $derived(
		selectedAezCountry ? (aezOptionsByCountry[selectedAezCountry] ?? []) : []
	);

	const chartAezName = $derived(selectedAezName ? toSentenceCase(selectedAezName) : null);
	const chartCountryLabel = $derived(
		selectedAezCountry ? (COUNTRY_LABELS[selectedAezCountry] ?? selectedAezCountry) : null
	);
	function setSelectedAez(country, aezName) {
		selectedAezCountry = country;
		selectedAezName = aezName;
	}

	// Picking by name moves the map to the zone; a click on the map does not, the
	// zone is already in view there.
	function showZone(country, aezName) {
		setSelectedAez(country, aezName);
		cancelZoneZoom();
		if (map && aezName) {
			cancelZoneZoom = zoomToAez(map, aezBounds, {
				country,
				aezName,
				countryView: COUNTRY_VIEWS[country]
			});
		}
	}

	// A country on its own shows nothing, so picking one picks its first zone.
	function pickCountry(country) {
		showZone(country, aezOptionsByCountry[country]?.[0]?.value ?? '');
	}

	function clearSelectedAez() {
		selectedAezCountry = '';
		selectedAezName = '';
	}

	$effect(() => {
		if (!crop || !calendarData) return;
		if (!validCropValues.has(crop)) crop = '';
	});

	$effect(() => {
		if (!crop) {
			season = '';
			return;
		}
		if (!calendarData) return;
		// Take the only season, or, in a zone without the chosen one, its first.
		if (seasonOptions.length === 1 || (zoneSeasonOptions.length && !validSeasonValues.has(season))) {
			const [first] = seasonOptions;
			if (season !== first.value) season = first.value;
			return;
		}
		if (!season) return;
		if (!validSeasonValues.has(season)) season = '';
	});

	$effect(() => {
		if (!calendarData && calendarState === 'idle') {
			calendarState = 'loading';
			fetch(CALENDAR_URL)
				.then((r) => r.json())
				.then((data) => {
					calendarData = data;
					calendarState = 'ready';
				})
				.catch(() => {
					calendarState = 'error';
				});
		}
	});

	$effect(() => {
		if (!map) return;
		updateCalendarAezFill(map, { calendarData, crop, season, dataset, selectedAezKey });
	});

	$effect(() => {
		if (!map) return;
		return trackAezBounds(map, aezBounds);
	});

	$effect(() => {
		if (!map) return;
		return bindAezSelection(map, (match) => {
			if (!match) {
				clearSelectedAez();
				return;
			}
			setSelectedAez(match.country, match.aezName);
		});
	});

	$effect(() => {
		if (!map) return;
		return attachCalendarHoverPopup(map, ({ country, aezName }) =>
			buildCalendarHoverPopupContent({
				calendarData,
				countryLabels: COUNTRY_LABELS,
				aezCountry: country,
				aezName,
				crop,
				cropLabels,
				season,
				requiresSeasonSelection
			})
		);
	});

	$effect(() => {
		updateAezOutline(map, { isCalendarDataset: true, selectedAezKey });
	});
</script>

<div class="flex flex-col gap-3 px-page py-3">
	<PageIntro page={PAGES.cropCalendars} class="pt-3 pb-1" />

	<div class="flex flex-col gap-2">
		<CropAgricultureControls
			bind:dataset
			bind:crop
			bind:season
			boundary="aez"
			layerOptions={CALENDAR_DATASET_OPTIONS}
			cropOptions={calendarCropOptions}
			{seasonOptions}
			boundaryOptions={[{ value: 'aez', label: 'AEZ' }]}
			showSeasonSelect={requiresSeasonSelection}
			layerLabel="Variable"
			showBoundarySelect={false}
		/>
		<MapToolLayout matchHeights>
			{#snippet mapArea()}
				<MapFrame class="xl:h-full" mapClass={MAP_HEIGHT}>
					<Map bind:map adminLevel="aez" initialView={STUDY_AREA_VIEW} cooperativeGestures="touch" />
					{#snippet legend()}
						<ColorScaleLegend
							colors={MONTH_COLORS}
							labels={MONTH_LABELS}
							noDataLabel={NO_DATA_LEGEND_LABEL}
							containerClass=""
						/>
					{/snippet}
				</MapFrame>
			{/snippet}

			{#snippet details()}
				<div class="rounded-md border border-border/70 bg-card/70 p-3 xl:h-full">
					<!-- Zone selection, for picking a zone by name instead of on the map -->
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 pb-3">
						<LabeledSelect
							label="Country"
							bind:value={() => selectedAezCountry, pickCountry}
							options={COUNTRY_OPTIONS}
							placeholder="Country"
							widthClass="w-28"
						/>
						<LabeledSelect
							label="Zone"
							bind:value={() => selectedAezName, (name) => showZone(selectedAezCountry, name)}
							options={aezOptions}
							placeholder="Zone"
							widthClass="w-56"
							disabled={!aezOptions.length}
						/>
					</div>

					<div class="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
						<p class="text-lg font-bold leading-tight text-foreground">
							{chartAezName ?? 'Click a zone on the map, or select a country and zone above'}
						</p>
						{#if chartCountryLabel}
							<p class="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
								{chartCountryLabel}
							</p>
						{/if}
						<div class="flex items-center gap-3 pl-4">
							{#each calendarStageLegendItems as item (item.label)}
								<span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
									<span class="h-3 w-3 rounded-full" style:background={item.color}></span>
									{item.label}
								</span>
							{/each}
						</div>
					</div>

					{#if calendarState === 'error'}
						<div class="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-muted/10">
							<p class="text-xs text-muted-foreground">Calendar data could not be loaded.</p>
						</div>
					{:else}
						<CropCalendarChart entries={selectedAezEntries} />
					{/if}
				</div>
			{/snippet}
		</MapToolLayout>
	</div>

	<p class="text-xs text-muted-foreground">
		<span class="font-medium text-foreground">Data source:</span> FAO crop calendars, validated by
		local experts.
	</p>
</div>
