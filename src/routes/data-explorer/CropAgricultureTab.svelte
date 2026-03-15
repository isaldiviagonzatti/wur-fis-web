<!--
  Agriculture tab — observed crop statistics and calendars by crop, boundary, and dataset.
-->
<script>
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import Map from '$lib/components/Map.svelte';
	import CropCalendarChart from '$lib/components/CropCalendarChart.svelte';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import {
		CALENDAR_STAGE_COLORS,
		MONTH_COLORS,
		MONTH_LABELS,
		CALENDAR_OUTLINE_BASE,
		buildCalendarFillExpression,
		getAezFeatureExpression,
		getAezFeatureKey,
		getCalendarCropOptions,
		getCalendarSeasonOptions
	} from '$lib/calendar.js';
	import { CALENDAR_URL, COUNTRY_OPTIONS, OBSERVED_CROP_OPTIONS } from '$lib/data-config.js';

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

	const datasetLabels = {
		yield: 'Observed yield',
		production: 'Observed production',
		harvested_area: 'Observed harvested area',
		sowing_date: 'Sowing date',
		harvest_date: 'Harvest date'
	};

	const countryLabels = Object.fromEntries(COUNTRY_OPTIONS.map(({ value, label }) => [value, label]));
	const countryViews = Object.fromEntries(COUNTRY_OPTIONS.map(({ value, view }) => [value, view]));

	const boundaryLabels = {
		country: 'Country',
		admin1: 'Admin 1',
		admin2: 'Admin 2',
		aez: 'AEZ'
	};

	const observedCropLabels = Object.fromEntries(
		OBSERVED_CROP_OPTIONS.map(({ value, label }) => [value, label])
	);

	const observedDatasets = ['yield', 'production', 'harvested_area'];
	const calendarDatasets = ['sowing_date', 'harvest_date'];
	const isCalendarDataset = $derived(calendarDatasets.includes(dataset));

	const calendarCropOptions = $derived.by(() => getCalendarCropOptions(calendarData));
	const calendarSeasonOptions = $derived.by(() => getCalendarSeasonOptions(calendarData, crop));
	const cropLabels = $derived.by(() => {
		if (!isCalendarDataset) return observedCropLabels;
		return Object.fromEntries(calendarCropOptions.map(({ value, label }) => [value, label]));
	});
	const validCropValues = $derived.by(() => new Set(Object.keys(cropLabels)));
	const seasonLabels = $derived.by(
		() => Object.fromEntries(calendarSeasonOptions.map(({ value, label }) => [value, label]))
	);
	const validSeasonValues = $derived.by(() => new Set(calendarSeasonOptions.map(({ value }) => value)));
	const requiresSeasonSelection = $derived(
		isCalendarDataset && crop && calendarSeasonOptions.length > 1
	);
	const showSeasonSelect = $derived(requiresSeasonSelection);
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
			? `${selectedAezName} — ${countryLabels[selectedAezCountry] ?? selectedAezCountry}`
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

	function clearSelectedAez() {
		selectedAezCountry = '';
		selectedAezName = '';
	}

	// Reset crop selection when switching between calendar and observed datasets
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

	const availableBoundaries = $derived(isCalendarDataset ? ['aez'] : ['country', 'admin1', 'admin2']);

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
		const fly = () => map.flyTo({ center: target.center, zoom: target.zoom, duration: 900, essential: true });
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
		const colorExpr = buildCalendarFillExpression(calendarData, crop, season, dataset);
		if (map.getLayer('aez-fill')) {
			map.setPaintProperty('aez-fill', 'fill-color', colorExpr);
			map.setPaintProperty('aez-fill', 'fill-opacity', selectedAezKey ? 0.4 : crop && season ? 0.88 : 0.7);
		}
		if (map.getLayer('aez-selected-fill')) {
			map.setPaintProperty('aez-selected-fill', 'fill-color', colorExpr);
			map.setPaintProperty('aez-selected-fill', 'fill-opacity', selectedAezKey ? 1 : 0);
			map.setFilter(
				'aez-selected-fill',
				['==', getAezFeatureExpression(), selectedAezKey || '__none__']
			);
		}
	});

	$effect(() => {
		if (!map || isCalendarDataset) return;
		if (map.getLayer('aez-fill')) {
			map.setPaintProperty('aez-fill', 'fill-color', '#4a90d9');
			map.setPaintProperty('aez-fill', 'fill-opacity', 0.15);
		}
		if (map.getLayer('aez-selected-fill')) {
			map.setPaintProperty('aez-selected-fill', 'fill-opacity', 0);
			map.setFilter('aez-selected-fill', ['==', ['get', 'aez_name'], '__none__']);
		}
	});

	$effect(() => {
		if (!map) return;

		const onMapClick = (event) => {
			const [feature] = map.queryRenderedFeatures(event.point, { layers: ['aez-fill'] });
			if (!feature) {
				clearSelectedAez();
				return;
			}

			const props = feature.properties ?? {};
			const aezName = props.aez_name;
			const aezCountry = props.country;
			if (!aezCountry || !aezName) return;
			selectedAezCountry = aezCountry;
			selectedAezName = aezName;
		};
		const onMouseEnter = () => {
			map.getCanvas().style.cursor = 'pointer';
		};
		const onMouseLeave = () => {
			map.getCanvas().style.cursor = '';
		};

		map.on('click', onMapClick);
		map.getCanvas().style.cursor = '';
		map.on('mouseenter', 'aez-fill', onMouseEnter);
		map.on('mouseleave', 'aez-fill', onMouseLeave);

		return () => {
			map.off('click', onMapClick);
			map.off('mouseenter', 'aez-fill', onMouseEnter);
			map.off('mouseleave', 'aez-fill', onMouseLeave);
			map.getCanvas().style.cursor = '';
		};
	});

	$effect(() => {
		if (!map || !map.getLayer('aez-outline')) return;

		if (!isCalendarDataset) {
			map.setPaintProperty('aez-outline', 'line-color', '#2c5f8a');
			map.setPaintProperty('aez-outline', 'line-width', 1);
			map.setPaintProperty('aez-outline', 'line-opacity', 1);
			return;
		}

		map.setPaintProperty('aez-outline', 'line-color', CALENDAR_OUTLINE_BASE);
		map.setPaintProperty('aez-outline', 'line-width', 0.65);
		map.setPaintProperty('aez-outline', 'line-opacity', selectedAezKey ? 0.35 : 0.55);
	});
</script>

<!-- Controls bar -->
<div class="shrink-0 px-4 py-1.5 overflow-x-auto overflow-y-hidden">
	<div class="flex min-w-max items-center gap-2">
		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Fly to</span>
			<Select type="single" bind:value={flyToCountry}>
				<SelectTrigger size="sm" class="w-32">
					{countryLabels[flyToCountry] ?? 'Country'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each COUNTRY_OPTIONS as option (option.value)}
						<SelectItem value={option.value} label={option.label} />
					{/each}
				</SelectContent>
			</Select>
		</div>

		<Separator orientation="vertical" class="h-4" />

		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Layer</span>
			<Select type="single" bind:value={dataset}>
				<SelectTrigger size="sm" class="w-48">
					{datasetLabels[dataset] ?? 'Select layer'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					<SelectItem value="yield" label="Observed yield" />
					<SelectItem value="production" label="Observed production" />
					<SelectItem value="harvested_area" label="Observed harvested area" />
					<SelectItem value="sowing_date" label="Sowing date" />
					<SelectItem value="harvest_date" label="Harvest date" />
				</SelectContent>
			</Select>
		</div>

		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Crop</span>
			<Select type="single" bind:value={crop}>
				<SelectTrigger size="sm" class={isCalendarDataset ? 'w-64' : 'w-36'}>
					{cropLabels[crop] ?? 'Select crop'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					{#each Object.entries(cropLabels) as [value, label] (value)}
						<SelectItem {value} {label} />
					{/each}
				</SelectContent>
			</Select>
		</div>

		{#if showSeasonSelect}
			<div class="flex items-center gap-1.5">
				<span class="text-xs text-muted-foreground font-medium">Season</span>
				<Select type="single" bind:value={season}>
					<SelectTrigger size="sm" class="w-40">
						{seasonLabels[season] ?? 'Select season'}
					</SelectTrigger>
					<SelectContent style="width: var(--bits-select-anchor-width);">
						{#each calendarSeasonOptions as option (option.value)}
							<SelectItem value={option.value} label={option.label} />
						{/each}
					</SelectContent>
				</Select>
			</div>
		{/if}

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
	</div>
</div>

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
						<p class="mt-1 text-xs text-muted-foreground">
							The chart shows the full AEZ calendar for all crops and seasons in the selected shape.
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
