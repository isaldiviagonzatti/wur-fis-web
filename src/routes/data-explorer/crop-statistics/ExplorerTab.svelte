<!--
  ExplorerTab — reported yield, harvested area and production since 1994, and
  how well the model reproduces the year-to-year ups and downs of yield.

  Statistics are drawn per area: HarvestStat for admin-1 units, FAOSTAT for
  countries. The model (LPJmL forced with ERA5-Land) is shown only as anomalies
  from its own trend, per grid cell or aggregated to the same areas, because its
  absolute yields are not comparable with the statistics.

  The year slider drives the map; the panel below always shows the whole period
  with the chosen year marked. Selection follows the forecast page: the clicked
  point is kept, and changing level or crop re-resolves it to whatever contains
  that point.
-->
<script>
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import LabeledMultiSelect from '$lib/components/LabeledMultiSelect.svelte';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import Map from '$lib/components/Map.svelte';
	import MapPanel from '$lib/components/MapPanel.svelte';
	import PlaceSearch from '$lib/components/PlaceSearch.svelte';
	import CropYieldsPanel from './CropYieldsPanel.svelte';
	import {
		COUNTRY_LABELS,
		COUNTRY_OPTIONS,
		countriesBounds,
		countryAt
	} from '$lib/domain-options.js';
	import { STUDY_AREA_VIEW } from '$lib/map-config.js';
	import { buildCropIndex, formatCropLabel } from '$lib/yield-forecast.js';
	import {
		ANOMALY_COLORS,
		ANOMALY_LEGEND_LABELS,
		LEVEL_LABELS,
		VARIABLES,
		VARIABLE_OPTIONS,
		anomalyFillExpression,
		buildAnomalyCellFeatures,
		buildScale,
		formatVariableValue,
		latestYearIndex,
		loadCatalog,
		loadCropMix,
		loadGrid,
		loadLanduse,
		loadZones,
		zoneValue,
		zonesWithVariable
	} from '$lib/crop-yields.js';
	import { CONTROL_HELP, LEGEND_HELP } from '$lib/crop-yields-help.js';
	import {
		attachCellInteractions,
		findCellIndex,
		setCellFeatures,
		setCellOpacity,
		setCellVisibility,
		setSelectedCellUid
	} from '$lib/cell-grid-map.js';
	import {
		attachZoneHoverPopup,
		attachZoneInteractions,
		clearZoneLayers,
		paintZones,
		setZoneOpacity,
		showSelectedZoneOnly,
		zoneAtPoint
	} from '$lib/admin-zone-map.js';
	import '$lib/styles/info-card.css';

	const LAYER_PREFIX = 'crop-yields';
	const ALL_COUNTRIES = COUNTRY_OPTIONS.map(({ value }) => value);
	const DEFAULT_CROP = 'maize';

	let map = $state(null);
	let catalog = $state(null);
	let loadError = $state('');
	// Held by the page, so the choices survive switching to the guide and back.
	let {
		countries = $bindable(ALL_COUNTRIES),
		crop = $bindable(DEFAULT_CROP),
		variable = $bindable('yield'),
		level = $bindable('admin1'),
		// The year the user picked on the slider; null until they do.
		chosenYear = $bindable(null)
	} = $props();
	let layerOpacity = $state(0.85);
	let placeQuery = $state('');
	// Bumped when a basemap swap drops every layer, so the paint effects rerun.
	let styleVersion = $state(0);

	let zones = $state([]);
	// Which level and crop `zones` holds, so a half-finished switch is not read
	// as data for the new selection.
	let zoneKey = $state('');
	let grids = $state([]);

	// The location the user is interested in; what is selected is whichever
	// cell or area contains it at the current level.
	let anchor = $state(null);
	let selectedGid = $state(null);
	let selectedCell = $state(null);
	let province = $state(null);

	// Fired once at component init in the browser; it has no reactive input. The
	// page is prerendered, and the data is not needed to build it.
	if (browser) {
		loadCatalog()
			.then((loaded) => (catalog = loaded))
			.catch((error) => (loadError = `Could not load the crop statistics catalog. ${error.message}`));
	}

	const years = $derived(
		catalog
			? Array.from(
					{ length: catalog.years[1] - catalog.years[0] + 1 },
					(_, index) => catalog.years[0] + index
				)
			: []
	);
	const cropIndex = $derived(
		catalog
			? buildCropIndex(catalog)
					.map((entry) => ({
						...entry,
						countries: entry.countries.filter((name) => countries.includes(name))
					}))
					.filter((entry) => entry.countries.length)
			: []
	);
	const cropOptions = $derived(
		cropIndex.map(({ id, label }) => ({ value: id, label: formatCropLabel(label) }))
	);
	const activeCrop = $derived(cropIndex.find((entry) => entry.id === crop) ?? null);
	const cropName = $derived(activeCrop ? formatCropLabel(activeCrop.label) : '');
	// The crop's catalog entry in every shown country that has it.
	const cropEntries = $derived(
		activeCrop
			? activeCrop.countries.map((name) => ({
					country: name,
					...catalog.countries[name].crops.find((entry) => entry.id === crop)
				}))
			: []
	);
	const cropLevels = $derived(
		new Set([
			...cropEntries.flatMap((entry) => Object.keys(entry.levels)),
			...(cropEntries.some((entry) => entry.grid) ? ['grid'] : [])
		])
	);
	const levelOptions = $derived(
		VARIABLES[variable].levels
			.filter((value) => cropLevels.has(value))
			.map((value) => ({ value, label: LEVEL_LABELS[value] }))
	);
	const isGrid = $derived(level === 'grid');
	const shownZones = $derived(
		zoneKey === `${level}:${crop}` ? zones.filter((zone) => countries.includes(zone.country)) : []
	);
	const mappedZones = $derived(isGrid ? [] : zonesWithVariable(level, shownZones, variable));
	// The year the user picked, or until they pick one, the latest year every shown
	// country reports. A picked year sticks across crops and variables even
	// where it has no data: the map then hatches what is not reported.
	const yearIndex = $derived.by(() => {
		const picked = chosenYear === null ? -1 : years.indexOf(chosenYear);
		if (picked >= 0) return picked;
		if (isGrid) return years.length - 1;
		return latestYearIndex(level, mappedZones, variable, years.length);
	});
	const scale = $derived(
		mappedZones.length ? buildScale(level, mappedZones, variable, yearIndex, years.length) : null
	);
	const shownGrids = $derived(grids.filter((grid) => countries.includes(grid.country)));
	const selectedZone = $derived(
		selectedGid ? (shownZones.find((zone) => zone.gid === selectedGid) ?? null) : null
	);
	const cellGrid = $derived(
		selectedCell ? (shownGrids.find((grid) => grid.country === selectedCell.country) ?? null) : null
	);
	const cellData = $derived.by(() => {
		const cell = cellGrid?.cells[selectedCell.index];
		if (!cell) return null;
		return {
			...cell,
			anomaly: cellGrid.anomaly.map((row) => row[selectedCell.index])
		};
	});
	const selectionCountry = $derived(selectedZone?.country ?? cellGrid?.country ?? null);

	const panelTitle = $derived.by(() => {
		if (isGrid && cellData) {
			const where = province ? ` in ${province.zone_name}, ${COUNTRY_LABELS[cellGrid.country]}` : '';
			return `${cropName} at ${cellData.lat.toFixed(2)}°, ${cellData.lon.toFixed(2)}°${where}`;
		}
		if (!selectedZone) return '';
		const country = COUNTRY_LABELS[selectedZone.country];
		return level === 'country'
			? `${cropName} in ${country}`
			: `${cropName} in ${selectedZone.zone_name}, ${country}`;
	});
	const hasSelection = $derived(isGrid ? Boolean(cellData) : Boolean(selectedZone));
	// A point is held but nothing at this level and crop contains it.
	const anchorUnresolved = $derived(
		Boolean(anchor) && !hasSelection && (isGrid ? grids.length > 0 : zoneKey === `${level}:${crop}`)
	);

	const legend = $derived.by(() => {
		const spec = VARIABLES[variable];
		if (spec.kind === 'anomaly') {
			return {
				title: spec.source === 'model' ? 'Model yield anomaly' : 'Reported yield anomaly',
				subtitle: 'Standard deviations from the trend; brown is a poor year, teal a good one',
				help: LEGEND_HELP.anomaly,
				colors: ANOMALY_COLORS,
				labels: ANOMALY_LEGEND_LABELS,
				noData: isGrid ? '' : 'Not reported'
			};
		}
		if (!scale) return null;
		if (spec.kind === 'agreement') {
			return {
				title: 'Model–reported agreement',
				subtitle: 'Correlation of year-to-year anomalies',
				help: LEGEND_HELP.agreement,
				colors: scale.colors,
				labels: scale.labels,
				noData: ''
			};
		}
		return {
			title: `${spec.label} (${spec.unit})`,
			subtitle: level === 'country' ? 'FAOSTAT' : 'HarvestStat',
			help: LEGEND_HELP.reported,
			colors: scale.colors,
			labels: scale.labels,
			noData: 'Not reported'
		};
	});

	/** Change variable, moving to a level it exists at if the current one has none. */
	function setVariable(next) {
		variable = next;
		const allowed = VARIABLES[next].levels.filter((value) => cropLevels.has(value));
		if (!allowed.includes(level)) level = allowed.includes('admin1') ? 'admin1' : allowed[0];
	}

	function setCountries(next) {
		countries = ALL_COUNTRIES.filter((name) => next.includes(name));
		if (anchor && !countries.includes(countryAt(anchor.lat, anchor.lon))) clearSelection();
		const bounds =
			countries.length === ALL_COUNTRIES.length ? STUDY_AREA_VIEW.bounds : countriesBounds(countries);
		if (map && bounds) map.fitBounds(bounds, { ...STUDY_AREA_VIEW.fitBoundsOptions, duration: 900 });
	}

	function clearSelection() {
		anchor = null;
		selectedGid = null;
		selectedCell = null;
	}

	function startOver() {
		clearSelection();
		placeQuery = '';
		countries = ALL_COUNTRIES;
		crop = DEFAULT_CROP;
		variable = 'yield';
		level = 'admin1';
		chosenYear = null;
		map?.fitBounds(STUDY_AREA_VIEW.bounds, { ...STUDY_AREA_VIEW.fitBoundsOptions, duration: 900 });
	}

	/** Select whatever contains `point` at the current level. */
	function resolveAnchor(point) {
		if (!point) return;
		if (isGrid) {
			for (const grid of shownGrids) {
				const index = findCellIndex(grid.cells, point.lat, point.lon);
				if (index >= 0) {
					selectedCell = { country: grid.country, index };
					return;
				}
			}
			selectedCell = null;
			return;
		}
		const gid = zoneAtPoint(map, level, point, shownGrids);
		selectedGid = gid;
		if (gid || !map) return;
		// Off the crop's cells the answer comes from the rendered polygons, which
		// a level just switched to has not drawn yet. Ask again once it has,
		// unless the user has moved on.
		const targetLevel = level;
		map.once('idle', () => {
			if (level !== targetLevel || anchor !== point) return;
			selectedGid = zoneAtPoint(map, level, point, shownGrids);
		});
	}

	/**
	 * Hover popup content for one area: the place, then country, crop and year
	 * (agreement covers every year, so none), then the value. The variable is
	 * the one chosen above the map, and the unit or "r =" says what it is.
	 */
	function describeZone(gid) {
		const zone = mappedZones.find((entry) => entry.gid === gid);
		if (!zone) return null;
		const value = zoneValue(level, zone, variable, yearIndex);
		const meta = [
			level === 'country' ? null : COUNTRY_LABELS[zone.country],
			cropName,
			VARIABLES[variable].kind === 'agreement' ? null : String(years[yearIndex])
		].filter(Boolean);
		return {
			title: level === 'country' ? COUNTRY_LABELS[zone.country] : zone.zone_name,
			meta: meta.join(' · '),
			value: Number.isFinite(value) ? formatVariableValue(variable, value) : 'Not reported'
		};
	}

	function handlePlaceSelect({ lat, lon, countryCode }) {
		if (!map) return;
		const placeCountry =
			COUNTRY_OPTIONS.find(({ isoCode }) => isoCode === countryCode)?.value ?? countryAt(lat, lon);
		if (placeCountry && !countries.includes(placeCountry)) {
			countries = ALL_COUNTRIES.filter((name) => name === placeCountry || countries.includes(name));
		}
		map.flyTo({ center: [lon, lat], zoom: 7, duration: 900, essential: true });
		anchor = { lat, lon };
		resolveAnchor(anchor);
	}

	// A crop the shown countries do not have is dropped, as if never picked.
	$effect(() => {
		if (catalog && crop && !activeCrop) crop = cropIndex[0]?.id ?? '';
	});

	// Area values for the level and crop, across all countries.
	$effect(() => {
		if (isGrid || !activeCrop || !cropLevels.has(level)) {
			zones = [];
			zoneKey = '';
			return;
		}
		const key = `${level}:${crop}`;
		let cancelled = false;
		loadZones(level, crop)
			.then((payload) => {
				if (cancelled) return;
				zones = payload.zones;
				zoneKey = key;
				loadError = '';
			})
			.catch((error) => {
				if (cancelled) return;
				zones = [];
				zoneKey = '';
				loadError = `Could not load ${cropName.toLowerCase()} for this level. ${error.message}`;
			});
		return () => {
			cancelled = true;
		};
	});

	// Grid cells of the crop. Loaded at every level: their zone ids are how a
	// point is resolved to an area without waiting for tiles to render.
	$effect(() => {
		const targets = cropEntries.filter((entry) => entry.grid).map((entry) => entry.country);
		if (!targets.length) {
			grids = [];
			return;
		}
		let cancelled = false;
		Promise.all(targets.map((name) => loadGrid(name, crop)))
			.then((loaded) => {
				if (!cancelled) grids = loaded;
			})
			.catch((error) => {
				if (!cancelled) loadError = `Could not load the model grid. ${error.message}`;
			});
		return () => {
			cancelled = true;
		};
	});

	// Keep the selection on the same spot when the level, crop or data change.
	$effect(() => {
		if (!map) return;
		level;
		zoneKey;
		shownGrids;
		resolveAnchor(untrack(() => anchor));
	});

	$effect(() => {
		if (!map) return;
		styleVersion;
		if (isGrid) {
			clearZoneLayers(map);
			setCellFeatures(
				map,
				LAYER_PREFIX,
				anomalyFillExpression(),
				shownGrids.flatMap((grid) => buildAnomalyCellFeatures(grid, yearIndex))
			);
			setCellOpacity(map, LAYER_PREFIX, untrack(() => layerOpacity));
			setCellVisibility(map, LAYER_PREFIX, true);
			return;
		}
		setCellVisibility(map, LAYER_PREFIX, false);
		if (!scale) {
			clearZoneLayers(map);
			return;
		}
		paintZones(map, level, mappedZones, untrack(() => layerOpacity), scale);
	});

	// Selection outlines, apart from the fills so a click does not repaint.
	$effect(() => {
		if (!map) return;
		styleVersion;
		scale;
		if (isGrid) {
			const uid = selectedCell ? `${selectedCell.country}:${selectedCell.index}` : null;
			setSelectedCellUid(map, LAYER_PREFIX, uid);
		} else {
			showSelectedZoneOnly(map, level, selectedGid);
		}
	});

	$effect(() => {
		if (!map) return;
		setCellOpacity(map, LAYER_PREFIX, layerOpacity);
		if (!isGrid) setZoneOpacity(map, level, layerOpacity);
	});

	$effect(() => {
		if (!map || isGrid) return;
		return attachZoneHoverPopup(map, level, describeZone);
	});

	$effect(() => {
		if (!map || isGrid) return;
		return attachZoneInteractions(map, level, {
			onSelect: (gid, lngLat) => {
				anchor = { lat: lngLat.lat, lon: lngLat.lng };
				selectedGid = gid;
			}
		});
	});

	$effect(() => {
		if (!map) return;
		return attachCellInteractions(map, LAYER_PREFIX, {
			onSelect: ({ country, index }) => {
				const cell = grids.find((grid) => grid.country === country)?.cells[index];
				if (!cell) return;
				anchor = { lat: cell.lat, lon: cell.lon };
				selectedCell = { country, index };
			}
		});
	});

	// The province of a selected cell, whose statistics the cell is drawn against.
	$effect(() => {
		const gid = cellData?.zones.admin1;
		if (!isGrid || !gid) {
			province = null;
			return;
		}
		let cancelled = false;
		loadZones('admin1', crop)
			.then((payload) => {
				if (!cancelled) province = payload.zones.find((zone) => zone.gid === gid) ?? null;
			})
			.catch(() => {
				if (!cancelled) province = null;
			});
		return () => {
			cancelled = true;
		};
	});

	// Crop mix of the selection: model land use and reported area per crop for an
	// area, the model's land use alone for a cell. Requests are cached by URL.
	const cropMixRequest = $derived.by(() => {
		if (isGrid && cellData) {
			const { lat, lon } = cellData;
			return loadLanduse(cellGrid.country).then((landuse) => {
				const cells = landuse.lat.map((cellLat, index) => ({ lat: cellLat, lon: landuse.lon[index] }));
				const index = findCellIndex(cells, lat, lon);
				if (index < 0) return [];
				return landuse.crops
					.map((id, position) => ({
						crop: id,
						label: formatCropLabel(landuse.labels[position]),
						model: landuse.area_ha[position][index]
					}))
					.filter((item) => item.model > 0);
			});
		}
		if (isGrid || !selectedZone) return null;
		const gid = selectedZone.gid;
		return loadCropMix(level).then((payload) =>
			(payload.zones[gid] ?? []).map((item) => ({
				crop: item.crop,
				label: formatCropLabel(item.label),
				model: item.model_area_ha,
				reported: item.reported_area_ha
			}))
		);
	});
</script>

{#snippet emptyState(message)}
	<div class="flex h-28 items-center justify-center rounded-md bg-background/60 px-4">
		<p class="text-center text-sm text-muted-foreground">{message}</p>
	</div>
{/snippet}

<div class="shrink-0 px-4 pt-2">
	<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
		<div class="flex flex-wrap items-start gap-x-8 gap-y-3">
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-foreground">Crop statistics</h1>
			</div>
			<LabeledSelect
				label="Crop"
				labelClass="text-sm"
				bind:value={crop}
				options={cropOptions}
				placeholder={countries.length ? 'Select crop' : 'Select a country first'}
				widthClass="w-64"
				triggerStyle="height: 2.25rem; font-size: 0.9375rem;"
				disabled={!cropOptions.length}
			/>
		</div>
		<button
			type="button"
			onclick={startOver}
			class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
		>
			<RotateCcw size={14} />
			Clear all
		</button>
	</div>
</div>

<div class="grid gap-3 px-4 py-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
	<div class="space-y-6">
		<div class="space-y-3">
			<PlaceSearch bind:query={placeQuery} onSelect={handlePlaceSelect} />

			<LabeledMultiSelect
				label="Countries"
				labelClass="text-sm"
				bind:value={() => countries, setCountries}
				options={COUNTRY_OPTIONS}
				noneLabel="None selected"
				widthClass="w-full"
			/>

			<LabeledSelect
				label="Show"
				labelClass="text-sm"
				help={CONTROL_HELP.variable}
				bind:value={() => variable, setVariable}
				options={VARIABLE_OPTIONS}
				widthClass="w-full"
			/>

			<LabeledSelect
				label="Show by"
				labelClass="text-sm"
				help={CONTROL_HELP.showBy}
				bind:value={level}
				options={levelOptions}
				placeholder="Select level"
				widthClass="w-full"
			/>

			<div class="space-y-1">
				<div class="flex items-center justify-between text-sm">
					<InfoTip text={CONTROL_HELP.year} class="font-medium text-muted-foreground">Year</InfoTip>
					<span class="font-semibold tabular-nums text-foreground">
						{yearIndex >= 0 ? years[yearIndex] : ''}
					</span>
				</div>
				<input
					type="range"
					min="0"
					max={Math.max(years.length - 1, 0)}
					step="1"
					bind:value={() => yearIndex, (index) => (chosenYear = years[Number(index)] ?? null)}
					disabled={!years.length}
					aria-label="Year shown on the map"
					class="h-1 w-full cursor-pointer accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
				/>
				{#if years.length}
					<div class="flex justify-between text-[11px] text-muted-foreground">
						<span>{years[0]}</span>
						<span>{years[years.length - 1]}</span>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<InfoTip text={CONTROL_HELP.opacity} class="shrink-0">Opacity</InfoTip>
				<input
					type="range"
					min="0.2"
					max="1"
					step="0.05"
					bind:value={layerOpacity}
					aria-label="Data layer opacity"
					class="h-1 w-full cursor-pointer accent-foreground"
				/>
			</div>
		</div>

		{#if legend}
			<ColorScaleLegend
				title={legend.title}
				subtitle={legend.subtitle}
				help={legend.help}
				colors={legend.colors}
				labels={legend.labels}
				noDataLabel={legend.noData}
				barHeightClass="h-5"
				containerClass=""
				large
			/>
		{/if}
	</div>

	<div class="space-y-2">
		{#if loadError}
			<div
				class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{loadError}
			</div>
		{/if}
		<MapPanel heightClass="h-[52vh] min-h-[340px] max-h-[620px]">
			<Map
				bind:map
				adminLevel={level}
				onStyleReload={() => (styleVersion += 1)}
				initialView={STUDY_AREA_VIEW}
				cooperativeGestures="touch"
			/>
		</MapPanel>
	</div>
</div>

<div class="px-4 pb-4">
	{#if hasSelection}
		<CropYieldsPanel
			title={panelTitle}
			{level}
			{variable}
			{years}
			{yearIndex}
			cropId={crop.replace(/_[12]$/, '')}
			faoItems={cropEntries.find((entry) => entry.country === selectionCountry)?.fao_items ?? []}
			zone={isGrid ? null : selectedZone}
			cell={isGrid ? cellData : null}
			{province}
			{cropMixRequest}
			notes={catalog?.countries[selectionCountry]?.notes ?? []}
			clearLabel={isGrid ? 'Clear cell' : 'Clear area'}
			onClear={clearSelection}
			selectableCrops={cropIndex.map((entry) => entry.id)}
			onSelectCrop={(id) => (crop = id)}
		/>
	{:else if anchorUnresolved}
		<div class="mb-2 flex justify-end">
			<button
				type="button"
				onclick={clearSelection}
				class="cursor-pointer text-[13px] text-muted-foreground hover:text-foreground"
			>
				Clear
			</button>
		</div>
		{@render emptyState(
			`No ${cropName.toLowerCase() || 'crop'} data for this ${isGrid ? 'location' : 'area'} at this level.`
		)}
	{:else if !countries.length}
		{@render emptyState('Select at least one country')}
	{:else}
		{@render emptyState(
			isGrid
				? 'Click any cell to see its yield anomalies against its province'
				: `Click any ${level === 'country' ? 'country' : 'area'} to see its yield history`
		)}
	{/if}
</div>
