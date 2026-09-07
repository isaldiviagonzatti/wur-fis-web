<!--
  ForecastTab — controls bar, forecast grid map, and the density panel for a
  clicked cell.

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
	import Info from '@lucide/svelte/icons/info';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import Map from '$lib/components/Map.svelte';
	import MapPanel from '$lib/components/MapPanel.svelte';
	import PlaceSearch from '$lib/components/PlaceSearch.svelte';
	import YieldDensityChart from '$lib/components/YieldDensityChart.svelte';
	import { COUNTRY_OPTIONS, YIELD_FORECAST_BOUNDARY_OPTIONS } from '$lib/domain-options.js';
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
		loadCatalog,
		loadDensity,
		loadGrid,
		snapToCellCentre
	} from '$lib/yield-forecast.js';
	import {
		attachForecastInteractions,
		clearForecastCells,
		setColorMode,
		setForecastCells,
		setForecastOpacity,
		setSelectedCell
	} from '$lib/yield-forecast-map.js';

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
	let searchNotice = $state('');

	// Fired once at component init. Not an effect: it has no reactive input, so
	// making it one would only obscure that it runs exactly once.
	loadCatalog()
		.then((loaded) => (catalog = loaded))
		.catch((error) => (loadError = `Could not load the forecast catalog. ${error.message}`));

	const runId = $derived(catalog?.latest_run ?? null);
	const cropIndex = $derived(catalog ? buildCropIndex(catalog) : []);
	const cropOptions = $derived(cropIndex.map(({ id, label }) => ({ value: id, label })));
	const activeCrop = $derived(cropIndex.find((entry) => entry.id === crop) ?? null);
	const totalCells = $derived(entries.reduce((sum, entry) => sum + entry.grid.n_cells, 0));
	const isLoadedCropCurrent = $derived(loadedCrop === crop);
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
	// A position is held but this crop is not grown there.
	const selectionOutsideCrop = $derived(Boolean(selected) && isLoadedCropCurrent && !selectedCell);
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
		crop = '';
		country = '';
		adminLevel = 'grid';
		skillOverlay = false;
	}

	function clearCellSelection() {
		selected = null;
		setSelectedCell(map, null);
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
	function handlePlaceSelect({ lat, lon, name }) {
		if (!map) return;
		map.flyTo({ center: [lon, lat], zoom: 8, duration: 900, essential: true });

		const cellLat = snapToCellCentre(lat);
		const cellLon = snapToCellCentre(lon);
		for (const entry of entries) {
			const found = findCellAt([entry], entry.country, cellLat, cellLon);
			if (found) {
				selected = { country: entry.country, lat: cellLat, lon: cellLon, ...found };
				setSelectedCell(map, found.uid);
				searchNotice = '';
				return;
			}
		}
		clearCellSelection();
		searchNotice = `No ${activeCrop?.label ?? 'forecast'} cell at ${name}.`;
	}

	// A basemap style swap (dark mode, or the fallback kicking in) discards every
	// source and layer, so the forecast layer has to be rebuilt afterwards.
	function handleStyleReload(mapInstance) {
		if (!entries.length) return;
		setForecastCells(mapInstance, entries);
		setColorMode(mapInstance, skillOverlay ? 'skill' : 'percentile');
		setForecastOpacity(mapInstance, layerOpacity);
		setSelectedCell(mapInstance, selected?.uid ?? null);
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
		const previous = untrack(() =>
			selected ? { country: selected.country, lat: selected.lat, lon: selected.lon } : null
		);
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
				const carried = previous
					? findCellAt(loaded, previous.country, previous.lat, previous.lon)
					: null;
				selected = previous ? { ...previous, ...(carried ?? { uid: null, index: null }) } : null;
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

	// Kept apart from the layer effect so toggling the colour mode repaints
	// without re-uploading the geometry or dropping the selected cell.
	$effect(() => {
		if (!map) return;
		setColorMode(map, skillOverlay ? 'skill' : 'percentile');
	});

	$effect(() => {
		if (!map) return;
		setForecastOpacity(map, layerOpacity);
	});

	$effect(() => {
		if (!map) return;
		return attachForecastInteractions(map, {
			onSelect: ({ uid, country, index }) => {
				const cell = entries.find((entry) => entry.country === country)?.grid.cells?.[index];
				if (!cell) return;
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
				label="Boundary"
				bind:value={adminLevel}
				options={YIELD_FORECAST_BOUNDARY_OPTIONS}
				placeholder="Select boundary"
				widthClass="w-full"
			/>

			<button
				onclick={() => (skillOverlay = !skillOverlay)}
				class={[
					'flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors',
					skillOverlay
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-border text-muted-foreground hover:bg-accent'
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

			{#if searchNotice}
				<p class="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
					<Info size={12} class="mt-px shrink-0" />
					<span>{searchNotice}</span>
				</p>
			{/if}

			<button
				type="button"
				onclick={clearSelections}
				disabled={!hasActiveSelection}
				class="h-7 w-full cursor-pointer rounded-md border border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
			>
				Clear selection
			</button>
		</div>

		{#if skillOverlay}
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
			{#if selectionOutsideCrop}
				<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
					<p class="text-xs font-medium text-foreground">
						{selected.lat.toFixed(2)}°, {selected.lon.toFixed(2)}° in {formatCountryList([
							selected.country
						])}
					</p>
					<button
						type="button"
						onclick={clearCellSelection}
						class="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
					>
						Clear cell
					</button>
				</div>
				<div class="flex h-28 items-center justify-center rounded-md bg-background/60 px-4">
					<p class="text-center text-xs text-muted-foreground">
						No {activeCrop?.label ?? 'forecast'} for this location in this initialisation.
					</p>
				</div>
			{:else if !selectedCell}
				<p class="text-xs font-medium text-muted-foreground">Selected cell</p>
				<div class="mt-2 flex h-28 items-center justify-center rounded-md bg-background/60">
					<p class="text-xs text-muted-foreground">
						{totalCells
							? 'Click any of the cells to see its forecast distribution'
							: 'Select a crop to load the forecast'}
					</p>
				</div>
			{:else}
				<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
					<p class="text-xs font-medium text-foreground">
						{selectedGrid.crop_label} in {formatCountryList([selected.country])} at
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
