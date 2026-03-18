<!--
  Crop Calendars explorer — sowing and harvest dates by AEZ.
-->
<script>
	import Map from '$lib/components/Map.svelte';
	import MapPanel from '$lib/components/MapPanel.svelte';
	import CropCalendarChart from '$lib/components/CropCalendarChart.svelte';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import CropAgricultureControls from '../CropAgricultureControls.svelte';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import MapIcon from '@lucide/svelte/icons/map';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
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
		attachCalendarHoverPopup,
		bindAezSelection,
		updateAezOutline,
		updateCalendarAezFill
	} from '$lib/calendar-map.js';
	import { buildCalendarHoverPopupContent } from '$lib/calendar-hover-popup.js';
	import {
		CALENDAR_DATASET_LABELS,
		CALENDAR_DATASET_OPTIONS,
		CALENDAR_URL,
		COUNTRY_LABELS,
		COUNTRY_OPTIONS
	} from '$lib/data-config.js';
	import '$lib/styles/calendar-map-popup.css';

	let activeView = $state('map');
	let map = $state(null);

	let dataset = $state('sowing_date');
	let crop = $state('maize');
	let season = $state('annual');
	let flyToCountry = $state('');

	let calendarData = $state.raw(null);
	let calendarState = $state('idle');
	let selectedAezCountry = $state('');
	let selectedAezName = $state('');
	let preserveSelectedAezName = false;

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
	const legendTitle = $derived(CALENDAR_DATASET_LABELS[dataset] ?? 'Calendar month');
	const legendSubtitle = $derived(
		requiresSeasonSelection && !season
			? 'Choose a season to color the AEZs'
			: dataset === 'harvest_date'
				? `Area fill colors show harvest month${seasonLabels[season] ? ` for ${seasonLabels[season]}` : ''}`
				: `Area fill colors show sowing month${seasonLabels[season] ? ` for ${seasonLabels[season]}` : ''}`
	);
	const hasActiveControlSelection = $derived(
		Boolean(dataset || crop || season || flyToCountry || selectedAezKey)
	);

	$effect(() => {
		selectedAezCountry;
		if (preserveSelectedAezName) {
			preserveSelectedAezName = false;
			return;
		}
		selectedAezName = '';
	});

	function setSelectedAez(country, aezName) {
		preserveSelectedAezName = true;
		selectedAezCountry = country;
		selectedAezName = aezName;
	}

	function clearSelectedAez() {
		selectedAezCountry = '';
		selectedAezName = '';
	}

	function clearAllSelections() {
		flyToCountry = '';
		dataset = '';
		crop = '';
		season = '';
		clearSelectedAez();
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
		if (calendarSeasonOptions.length === 1) {
			const [only] = calendarSeasonOptions;
			if (season !== only.value) season = only.value;
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

<Tabs bind:value={activeView} class="flex flex-col">
	<div class="flex items-center gap-4 px-4 py-2">
		<TabsList>
			<TabsTrigger value="map">
				<MapIcon class="h-3.5 w-3.5" />
				Map
			</TabsTrigger>
			<TabsTrigger value="calendar">
				<CalendarIcon class="h-3.5 w-3.5" />
				Calendar
			</TabsTrigger>
		</TabsList>
	</div>

	<TabsContent value="map" class="m-0 p-0">
		<div class="flex flex-col gap-2 px-4 pb-3">
			<CropAgricultureControls
				bind:dataset
				bind:crop
				bind:season
				boundary="aez"
				layerOptions={CALENDAR_DATASET_OPTIONS}
				cropOptions={calendarCropOptions}
				seasonOptions={calendarSeasonOptions}
				boundaryOptions={[{ value: 'aez', label: 'AEZ' }]}
				showSeasonSelect={requiresSeasonSelection}
				layerLabel="Variable"
				showBoundarySelect={false}
				showClearButton={true}
				clearDisabled={!hasActiveControlSelection}
				onClear={clearAllSelections}
			/>
			<MapPanel heightClass="h-[60vh] min-h-[360px]">
				<Map bind:map bind:flyToCountry adminLevel="aez" countryOptions={COUNTRY_OPTIONS} />
			</MapPanel>
			<ColorScaleLegend
				title={legendTitle}
				subtitle={legendSubtitle}
				colors={MONTH_COLORS}
				labels={MONTH_LABELS}
			/>
		</div>
	</TabsContent>

	<TabsContent value="calendar" class="m-0 p-0">
		<div class="px-4 pb-3">
			<!-- Zone selection -->
			<div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 py-1.5">
				<LabeledSelect
					label="Country"
					bind:value={selectedAezCountry}
					options={COUNTRY_OPTIONS}
					placeholder="Country"
					widthClass="w-28"
				/>
				<LabeledSelect
					label="Zone"
					bind:value={selectedAezName}
					options={aezOptions}
					placeholder="Zone"
					widthClass="w-56"
					disabled={!selectedAezCountry}
				/>
			</div>

			<div class="rounded-md border border-border/70 bg-card/70 p-3">
				<div class="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
					<p class="text-lg font-bold leading-tight text-foreground">
						{chartAezName ?? 'Select a country and zone above'}
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
		</div>
	</TabsContent>
</Tabs>
