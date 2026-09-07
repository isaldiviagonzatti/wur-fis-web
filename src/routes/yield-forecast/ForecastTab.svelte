<!--
  ForecastTab — controls bar, forecast map, and the distribution panel for the
  selected grid cell or administrative unit.

  The crop is the primary control: selecting one draws it for every country that
  has it in this initialization, which is only defensible because the map is
  coloured by percentile within each cell's own reference distribution, a
  quantity that is comparable across countries.

  Changing crop never moves the camera. Only the two deliberate navigation
  actions do: the in-map "Zoom to" country control, and picking a search result.

  Only cells the forecast beats its climatology on are published, so an absent
  cell means "no skill here", not "no crop here".
-->
<script>
	import { untrack } from 'svelte';
	import Gauge from '@lucide/svelte/icons/gauge';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import Map from '$lib/components/Map.svelte';
	import MapPanel from '$lib/components/MapPanel.svelte';
	import PlaceSearch from '$lib/components/PlaceSearch.svelte';
	import YieldDensityChart from '$lib/components/YieldDensityChart.svelte';
	import { COUNTRY_OPTIONS, YIELD_FORECAST_AGGREGATION_OPTIONS } from '$lib/domain-options.js';
	import { STUDY_AREA_VIEW } from '$lib/map-config.js';
	import {
		PERCENTILE_COLORS,
		PERCENTILE_LEGEND_LABELS,
		SKILL_COLORS,
		SKILL_LEGEND_LABELS,
		buildCropIndex,
		describePercentile,
		formatCountryList,
		formatSigned,
		formatTercileSplit,
		loadAdmin,
		loadCatalog,
		loadDensity,
		loadGrid,
		snapToCellCentre,
		toSentenceCase
	} from '$lib/yield-forecast.js';
	import {
		attachForecastInteractions,
		clearForecastCells,
		setForecastVisibility,
		setColorMode,
		setForecastCells,
		setForecastOpacity,
		setSelectedCell
	} from '$lib/yield-forecast-map.js';
	import {
		attachZoneInteractions,
		clearZoneLayers,
		isAdminLevel,
		paintZones,
		zoneIdProperty,
		setSelectedZone,
		setZoneOpacity
	} from '$lib/yield-forecast-admin-map.js';

	let {
		crop = $bindable(),
		country = $bindable(),
		adminLevel = $bindable(),
		skillOverlay = $bindable()
	} = $props();

	let map = $state(null);
	let catalog = $state(null);
	let entries = $state([]);
	let selected = $state(null);
	// Which crop `entries` actually holds, so a half-finished crop switch cannot be
	// read as data for the newly selected crop.
	let loadedCrop = $state('');
	let loadError = $state('');
	let layerOpacity = $state(0.85);
	let zones = $state([]);
	let selectedZoneGid = $state(null);
	// Which (level, crop) `zones` holds, so a half-finished switch is not read as
	// data for the newly selected one.
	let loadedZoneKey = $state('');
	// The location the user is interested in, as plain coordinates. Everything
	// selected — a grid cell, a province, a country — is whichever unit contains
	// this point, so changing the aggregation level re-resolves rather than
	// clearing. Set by a search, or by clicking anywhere on the map.
	let anchor = $state(null);
	// What the anchor resolved to at each aggregation level, so returning to a
	// level restores what was selected there. Without it, a level the anchor
	// cannot be re-resolved at — a point on a cell this crop does not cover —
	// loses its selection permanently, even though the unit is still valid.
	let anchorZones = $state({});

	// Fired once at component init. Not an effect: it has no reactive input, so
	// making it one would only obscure that it runs exactly once.
	loadCatalog()
		.then((loaded) => (catalog = loaded))
		.catch((error) => (loadError = `Could not load the forecast catalog. ${error.message}`));

	const runId = $derived(catalog?.latest_run ?? null);
	const cropIndex = $derived(catalog ? buildCropIndex(catalog) : []);
	const cropOptions = $derived(
		cropIndex.map(({ id, label }) => ({ value: id, label: toSentenceCase(label) }))
	);
	const activeCrop = $derived(cropIndex.find((entry) => entry.id === crop) ?? null);
	const totalCells = $derived(entries.reduce((sum, entry) => sum + entry.grid.n_cells, 0));
	const showZones = $derived(isAdminLevel(adminLevel));
	const isLoadedCropCurrent = $derived(loadedCrop === crop);
	const isZoneDataCurrent = $derived(loadedZoneKey === `${adminLevel}:${crop}`);
	const selectedZone = $derived(
		isZoneDataCurrent && selectedZoneGid
			? (zones.find((zone) => zone.gid === selectedZoneGid) ?? null)
			: null
	);
	const zoneLevelLabel = $derived(
		{ country: 'Country', admin1: 'Admin 1', admin2: 'Admin 2' }[adminLevel] ?? ''
	);
	const selectedGrid = $derived(
		isLoadedCropCurrent && selected
			? (entries.find((entry) => entry.country === selected.country)?.grid ?? null)
			: null
	);
	const selectedCell = $derived(
		selected?.index === null || selected?.index === undefined
			? null
			: (selectedGrid?.cells?.[selected.index] ?? null)
	);
	// A location is held but the current crop and level have nothing for it. Covers
	// both a searched place with no data and a crop switch away from a covered cell.
	const anchorUnresolved = $derived(
		Boolean(anchor) &&
			(showZones ? isZoneDataCurrent && !selectedZone : isLoadedCropCurrent && !selectedCell)
	);
	const hasActiveSelection = $derived(
		Boolean(crop || country || adminLevel !== 'grid' || skillOverlay)
	);

	// Requests are cached by URL, so re-deriving one for a different cell of the
	// same crop and country reuses the resolved promise rather than refetching.
	const densityRequest = $derived(
		selectedCell && runId && crop ? loadDensity(runId, selected.country, crop) : null
	);

	const RUN_MONTHS = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	/** "2026-08" reads as a code; "August 2026" reads as a date. */
	function formatRunId(runId) {
		const [year, month] = String(runId ?? '').split('-');
		return RUN_MONTHS[Number(month) - 1] ? `${RUN_MONTHS[Number(month) - 1]} ${year}` : runId;
	}

	function clearSelections() {
		anchorZones = {};
		crop = '';
		country = '';
		adminLevel = 'grid';
		skillOverlay = false;
		// Without this the panel keeps reporting the last clicked cell, which then
		// reads as "no data here" for a crop that is no longer selected.
		anchor = null;
		selected = null;
		selectedZoneGid = null;
		setSelectedCell(map, null);
		clearZoneLayers(map);
	}

	function clearCellSelection() {
		anchor = null;
		anchorZones = {};
		selected = null;
		setSelectedCell(map, null);
	}

	function clearZoneSelection() {
		anchor = null;
		anchorZones = {};
		selectedZoneGid = null;
		setSelectedZone(map, adminLevel, null);
	}

	/** The cell containing a point, across every loaded country. */
	function selectCellAtPoint(mapInstance, loaded, lat, lon) {
		const cellLat = snapToCellCentre(lat);
		const cellLon = snapToCellCentre(lon);
		for (const entry of loaded) {
			const found = findCellAt([entry], entry.country, cellLat, cellLon);
			if (found) {
				selected = { country: entry.country, lat: cellLat, lon: cellLon, ...found };
				setSelectedCell(mapInstance, found.uid);
				return true;
			}
		}
		selected = null;
		setSelectedCell(mapInstance, null);
		return false;
	}

	/**
	 * The zone containing a point.
	 *
	 * Answered from the grid payload, which records each cell's zone ids. Asking
	 * the rendered map instead needs the point on screen with its tiles drawn,
	 * which is a race every time the aggregation level changes.
	 */
	function resolveZoneAtPoint(mapInstance, level, point) {
		// Data first: the grid payload records each cell's zone, so this is exact
		// and works even when the point is off screen.
		const cellLat = snapToCellCentre(point.lat);
		const cellLon = snapToCellCentre(point.lon);
		for (const entry of entries) {
			const cell = entry.grid.cells.find(
				(candidate) =>
					Math.abs(candidate.lat - cellLat) < 1e-6 && Math.abs(candidate.lon - cellLon) < 1e-6
			);
			if (cell?.zones?.[level]) return cell.zones[level];
		}
		// Fall back to the rendered polygons for a point inside a published unit but
		// on a cell this crop does not cover.
		const pixel = mapInstance.project([point.lon, point.lat]);
		const hits = mapInstance.queryRenderedFeatures(pixel, { layers: [`${level}-fill`] });
		return hits?.[0]?.properties?.[zoneIdProperty(level)] ?? null;
	}

	/** Locate the cell at a given position, since indices differ between crops. */
	function findCellAt(loaded, country, lat, lon) {
		const entry = loaded.find((candidate) => candidate.country === country);
		const cell = entry?.grid.cells.find(
			(candidate) => Math.abs(candidate.lat - lat) < 1e-6 && Math.abs(candidate.lon - lon) < 1e-6
		);
		return cell ? { uid: `${country}:${cell.index}`, index: cell.index } : null;
	}

	/**
	 * Fly to a searched place and select the cell containing it.
	 *
	 * The grid is a regular lattice, so the containing cell is found by snapping
	 * the coordinate rather than by any spatial search. A place with no published
	 * cell still moves the map and reports why, rather than doing nothing.
	 */
	function handlePlaceSelect({ lat, lon }) {
		if (!map) return;
		const mapInstance = map;
		mapInstance.flyTo({ center: [lon, lat], zoom: 8, duration: 900, essential: true });
		// Setting the anchor is enough: the panel reports whether anything was found
		// there, which is where the user is already looking for the answer.
		anchor = { lat, lon };
		anchorZones = {};

		if (showZones) {
			const gid = resolveZoneAtPoint(mapInstance, adminLevel, { lat, lon });
			selectedZoneGid = gid;
			setSelectedZone(mapInstance, adminLevel, gid);
			return;
		}
		selectCellAtPoint(mapInstance, entries, lat, lon);
	}

	// A basemap style swap (dark mode, or the fallback kicking in) discards every
	// source and layer, so the forecast layer has to be rebuilt afterwards.
	function handleStyleReload(mapInstance) {
		// Rebuild the grid layer even in zone mode: the swap dropped it entirely, and
		// it has to exist again before it can be hidden.
		if (entries.length) {
			setForecastCells(mapInstance, entries);
			setColorMode(mapInstance, skillOverlay ? 'skill' : 'percentile');
			setForecastOpacity(mapInstance, layerOpacity);
			setSelectedCell(mapInstance, selected?.uid ?? null);
		}
		if (!showZones) return;
		setForecastVisibility(mapInstance, false);
		if (!zones.length) return;
		// The zone fill is a fresh copy of the admin tiles, so its paint and the
		// lazily-added selection outline both have to be reapplied.
		paintZones(mapInstance, adminLevel, zones, layerOpacity);
		setSelectedZone(mapInstance, adminLevel, selectedZoneGid);
	}

	// Load the selected crop for every country that has it, then hand the merged
	// set to the map and frame it. Depends on `map` so a crop resolved before the
	// map finished mounting is still drawn.
	$effect(() => {
		if (!map) return;
		const cropEntry = activeCrop;
		if (!runId || !cropEntry) {
			entries = [];
			loadedCrop = '';
			clearForecastCells(map);
			return;
		}
		const mapInstance = map;
		let cancelled = false;
		// Read without subscribing: this steers the load, it must not retrigger it.
		// Taken straight from the stored position rather than by looking the index up
		// in `entries` — after a crop the cell is missing from, there is no index to
		// look up, and resolving through one silently dropped the selection.
		const previous = untrack(() => anchor);
		Promise.all(
			cropEntry.countries.map((name) =>
				loadGrid(runId, name, cropEntry.id).then((grid) => ({ country: name, grid }))
			)
		)
			.then((loaded) => {
				if (cancelled) return;
				entries = loaded;
				loadedCrop = cropEntry.id;
				loadError = '';
				setForecastCells(mapInstance, loaded);
				// Carry the selection across the crop change when the new crop is grown
				// in the same place, so the panel updates instead of emptying.
				// The position is kept even when the new crop is not grown there, so the
				// panel can say so rather than silently emptying and jumping the map.
				if (!previous) {
					selected = null;
					setSelectedCell(mapInstance, null);
					return;
				}
				const cellLat = snapToCellCentre(previous.lat);
				const cellLon = snapToCellCentre(previous.lon);
				let carried = null;
				let carriedCountry = null;
				for (const entry of loaded) {
					const found = findCellAt([entry], entry.country, cellLat, cellLon);
					if (found) {
						carried = found;
						carriedCountry = entry.country;
						break;
					}
				}
				selected = {
					country: carriedCountry ?? previous.country ?? loaded[0]?.country,
					lat: cellLat,
					lon: cellLon,
					...(carried ?? { uid: null, index: null })
				};
				setSelectedCell(mapInstance, carried?.uid ?? null);
			})
			.catch((error) => {
				if (cancelled) return;
				entries = [];
				loadedCrop = '';
				clearForecastCells(mapInstance);
				loadError = `Could not load ${cropEntry.label}. ${error.message}`;
			});
		return () => {
			cancelled = true;
		};
	});

	// Aggregated zones for the chosen level. Grid cells and zone polygons are
	// mutually exclusive views of the same forecast, so one hides the other.
	$effect(() => {
		if (!map) return;
		const mapInstance = map;
		if (!showZones || !runId || !crop) {
			zones = [];
			loadedZoneKey = '';
			clearZoneLayers(mapInstance);
			setForecastVisibility(mapInstance, true);
			return;
		}
		setForecastVisibility(mapInstance, false);
		// Reset every level first. The selection outlines are layers this component
		// adds, so Map.svelte's visibility handling does not know about them and a
		// level change would otherwise leave the previous level's outline on screen.
		clearZoneLayers(mapInstance);
		const level = adminLevel;
		const key = `${level}:${crop}`;
		let cancelled = false;
		loadAdmin(runId, level, crop)
			.then((payload) => {
				if (cancelled) return;
				zones = payload.zones;
				loadedZoneKey = key;
				loadError = '';
				paintZones(mapInstance, level, payload.zones, layerOpacity);
				const point = untrack(() => anchor);
				if (!point) {
					selectedZoneGid = null;
					setSelectedZone(mapInstance, level, null);
					return;
				}
				// Carry the anchor across the level change: the same location, resolved
				// to whichever unit of the new level contains it.
				const apply = () => {
					const remembered = untrack(() => anchorZones)[level];
					const known = payload.zones.some((zone) => zone.gid === remembered);
					const gid = known ? remembered : resolveZoneAtPoint(mapInstance, level, point);
					if (gid) anchorZones = { ...untrack(() => anchorZones), [level]: gid };
					selectedZoneGid = gid;
					setSelectedZone(mapInstance, level, gid);
				};
				if (mapInstance.areTilesLoaded()) apply();
				else mapInstance.once('idle', apply);
			})
			.catch((error) => {
				if (cancelled) return;
				zones = [];
				loadedZoneKey = '';
				clearZoneLayers(mapInstance);
				loadError = `Could not load ${level} aggregates for ${crop}. ${error.message}`;
			});
		return () => {
			cancelled = true;
		};
	});

	// Switching back to grid does not reload anything, so the anchor has to be
	// re-resolved to a cell here.
	$effect(() => {
		if (!map || showZones || !entries.length) return;
		const point = untrack(() => anchor);
		if (!point) return;
		selectCellAtPoint(map, entries, point.lat, point.lon);
	});

	$effect(() => {
		if (!map || !showZones) return;
		return attachZoneInteractions(map, adminLevel, {
			onSelect: (gid, lngLat) => {
				if (lngLat) {
					anchor = { lat: lngLat.lat, lon: lngLat.lng };
					anchorZones = {};
				}
				// Remember it: this click is the ground truth for this level, and it
				// cannot always be recovered from the anchor alone.
				anchorZones = { ...anchorZones, [adminLevel]: gid };
				selectedZoneGid = gid;
				setSelectedZone(map, adminLevel, gid);
			}
		});
	});

	// Kept apart from the layer effect so toggling the colour mode repaints
	// without re-uploading the geometry or dropping the selected cell.
	$effect(() => {
		if (!map) return;
		setColorMode(map, skillOverlay ? 'skill' : 'percentile');
	});

	$effect(() => {
		if (!map) return;
		setForecastOpacity(map, layerOpacity);
		if (showZones) setZoneOpacity(map, adminLevel, layerOpacity);
	});

	$effect(() => {
		if (!map) return;
		return attachForecastInteractions(map, {
			onSelect: ({ uid, country, index }) => {
				const cell = entries.find((entry) => entry.country === country)?.grid.cells?.[index];
				if (!cell) return;
				anchor = { lat: cell.lat, lon: cell.lon };
				anchorZones = {};
				selected = { country, lat: cell.lat, lon: cell.lon, uid, index };
			}
		});
	});
</script>

{#if catalog}
	<div class="shrink-0 px-4 pt-2">
		<p class="text-sm font-semibold text-foreground">
			Forecast initialised {formatRunId(catalog.latest_run)}
		</p>
	</div>
{/if}

<div class="grid gap-3 px-4 py-2 lg:grid-cols-[17rem_minmax(0,1fr)]">
	<!-- Controls and legend share the left column so the map keeps its aspect and
	     the density plot below can use the full width. -->
	<div class="space-y-3">
		<div class="space-y-2.5 rounded-md bg-muted/30 p-3">
			<LabeledSelect
				label="Crop"
				bind:value={crop}
				options={cropOptions}
				placeholder="Select crop"
				widthClass="w-full"
				disabled={!cropOptions.length}
			/>

			<LabeledSelect
				label="Aggregation"
				bind:value={adminLevel}
				options={YIELD_FORECAST_AGGREGATION_OPTIONS}
				placeholder="Select level"
				widthClass="w-full"
			/>

			<button
				onclick={() => (skillOverlay = !skillOverlay)}
				disabled={showZones}
				title={showZones ? 'Skill is only available per grid cell' : ''}
				class={[
					'flex h-7 w-full items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors',
					showZones
						? 'cursor-not-allowed border-border text-muted-foreground opacity-50'
						: skillOverlay
							? 'cursor-pointer border-primary bg-primary text-primary-foreground'
							: 'cursor-pointer border-border text-muted-foreground hover:bg-accent'
				]}
			>
				<Gauge size={12} />
				Colour by skill
			</button>

			<label class="flex items-center gap-2 text-xs text-muted-foreground">
				<span class="shrink-0">Opacity</span>
				<input
					type="range"
					min="0.2"
					max="1"
					step="0.05"
					bind:value={layerOpacity}
					aria-label="Forecast layer opacity"
					class="h-1 w-full cursor-pointer accent-foreground"
				/>
			</label>

			<PlaceSearch onSelect={handlePlaceSelect} />


			<button
				type="button"
				onclick={clearSelections}
				disabled={!hasActiveSelection}
				class="h-7 w-full cursor-pointer rounded-md border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
			>
				Clear selection
			</button>
		</div>

		{#if skillOverlay && !showZones}
			<ColorScaleLegend
				title="Forecast skill"
				subtitle="Fair CRPSS vs 5-year climatology"
				colors={SKILL_COLORS}
				labels={SKILL_LEGEND_LABELS}
				barHeightClass="h-5"
				containerClass="rounded-md bg-muted/30 p-3"
			/>
		{:else}
			<ColorScaleLegend
				title="Forecast percentile"
				subtitle="within 1994–2023 reference"
				colors={PERCENTILE_COLORS}
				labels={PERCENTILE_LEGEND_LABELS}
				noDataLabel={showZones ? '' : 'No forecast'}
				barHeightClass="h-5"
				containerClass="rounded-md bg-muted/30 p-3"
			/>
		{/if}
	</div>

	<div class="space-y-2">
		{#if loadError}
			<div class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
				{loadError}
			</div>
		{/if}
		<MapPanel heightClass="h-[52vh] min-h-[340px] max-h-[620px]">
			<Map
				bind:map
				bind:flyToCountry={country}
				{adminLevel}
				countryOptions={COUNTRY_OPTIONS}
				onStyleReload={handleStyleReload}
				initialView={STUDY_AREA_VIEW}
			/>
		</MapPanel>
	</div>
</div>

<div class="px-4 pb-4">
	<div class="rounded-md bg-muted/30 p-3">
			{#if anchorUnresolved}
				<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
					<p class="text-xs font-medium text-foreground">
						{anchor.lat.toFixed(2)}°, {anchor.lon.toFixed(2)}°
					</p>
					<button
						type="button"
						onclick={clearCellSelection}
						class="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
					>
						Clear
					</button>
				</div>
				<div class="flex h-28 items-center justify-center rounded-md bg-background/60 px-4">
					<p class="text-center text-xs text-muted-foreground">
						No {activeCrop?.label ?? 'forecast'} data for this location in this initialisation.
					</p>
				</div>
			{:else if showZones}
				{#if !selectedZone}
					<div class="flex h-28 items-center justify-center rounded-md bg-background/60">
						<p class="text-xs text-muted-foreground">
							{zones.length
								? `Click any ${zoneLevelLabel.toLowerCase()} area to see its forecast distribution`
								: 'Select a crop to load the forecast'}
						</p>
					</div>
				{:else}
					<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
						<p class="text-xs font-medium text-foreground">
							{adminLevel === 'country'
								? `${toSentenceCase(activeCrop?.label ?? '')} in ${formatCountryList([
										selectedZone.country
									])}`
								: `${toSentenceCase(activeCrop?.label ?? '')} in ${selectedZone.zone_name}, ${formatCountryList(
										[selectedZone.country]
									)}`}
						</p>
						<button
							type="button"
							onclick={clearZoneSelection}
							class="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
						>
							Clear area
						</button>
					</div>

					<div class="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
						<div class="text-center">
							<span class="text-muted-foreground">Percentile</span>
							<p class="text-sm font-medium text-foreground">
								{selectedZone.percentile.toFixed(0)}
							</p>
						</div>
						<div class="text-center">
							<span class="text-muted-foreground">Anomaly</span>
							<p class="text-sm font-medium text-foreground">
								{formatSigned(selectedZone.anomaly_pct)}%
							</p>
						</div>
						<div class="text-center">
							<span class="text-muted-foreground">Below / near / above</span>
							<p class="text-sm font-medium text-foreground">
								{formatTercileSplit(
									selectedZone.prob_below,
									selectedZone.prob_near,
									selectedZone.prob_above
								).join(' / ')}
							</p>
						</div>
						<div class="text-center">
							<span class="text-muted-foreground">Area covered</span>
							<p class="text-sm font-medium text-foreground">
								{(100 * selectedZone.area_coverage).toFixed(0)}%
							</p>
						</div>
					</div>

					<p class="mb-2 text-[11px] text-muted-foreground">
						The ensemble mean sits {describePercentile(selectedZone.percentile)}. Historical
						variability in this area is {selectedZone.hist_cv_pct.toFixed(0)}%.
					</p>

					<YieldDensityChart
						forecast={selectedZone.members}
						historical={selectedZone.reference}
					/>
				{/if}
			{:else if !selectedCell}
				<div class="flex h-28 items-center justify-center rounded-md bg-background/60">
					<p class="text-xs text-muted-foreground">
						{totalCells
							? 'Click any of the cells to see its forecast distribution'
							: 'Select a crop to load the forecast'}
					</p>
				</div>
			{:else}
				<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
					<p class="text-xs font-medium text-foreground">
						{toSentenceCase(selectedGrid.crop_label)} in {formatCountryList([selected.country])} at
						{selectedCell.lat.toFixed(2)}°, {selectedCell.lon.toFixed(2)}°
					</p>
					<button
						type="button"
						onclick={clearCellSelection}
						class="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
					>
						Clear cell
					</button>
				</div>

				<div class="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
					<div class="text-center">
						<span class="text-muted-foreground">Percentile</span>
						<p class="text-sm font-medium text-foreground">
							{selectedCell.percentile.toFixed(0)}
						</p>
					</div>
					<div class="text-center">
						<span class="text-muted-foreground">Anomaly</span>
						<p class="text-sm font-medium text-foreground">
							{formatSigned(selectedCell.anomalyPct)}%
						</p>
					</div>
					<div class="text-center">
						<span class="text-muted-foreground">Below / near / above</span>
						<p class="text-sm font-medium text-foreground">
							{formatTercileSplit(
								selectedCell.probBelow,
								selectedCell.probNear,
								selectedCell.probAbove
							).join(' / ')}
						</p>
					</div>
					<div class="text-center">
						<span class="text-muted-foreground">Skill (CRPSS)</span>
						<p class="text-sm font-medium text-foreground">{selectedCell.skill.toFixed(2)}</p>
					</div>
				</div>

				<p class="mb-2 text-[11px] text-muted-foreground">
					The ensemble mean sits {describePercentile(selectedCell.percentile)}. Historical
					variability in this cell is {selectedCell.histCvPct.toFixed(0)}%.
				</p>

				{#await densityRequest}
					<div class="flex h-24 items-center justify-center">
						<p class="text-xs text-muted-foreground">Loading distribution…</p>
					</div>
				{:then density}
					{#if density}
						<YieldDensityChart
							forecast={density.forecast[selected.index] ?? []}
							historical={density.historical[selected.index] ?? []}
						/>
					{/if}
				{:catch error}
					<div class="flex h-24 items-center justify-center">
						<p class="text-xs text-destructive">
							Could not load the distribution. {error.message}
						</p>
					</div>
				{/await}
			{/if}
	</div>
</div>
