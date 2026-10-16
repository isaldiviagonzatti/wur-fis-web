<!--
  ForecastTab — controls bar, forecast map, and the distribution panel for the
  selected grid cell or administrative unit.

  Countries and crop are the primary controls. All countries start ticked; the
  crop list offers only crops forecast this month in a ticked country, and a crop
  is drawn for every ticked country that has it. Comparing countries on one map
  is only defensible because it is coloured by percentile within each cell's own
  reference distribution, a quantity that is comparable across countries.

  Changing crop never moves the camera. Only the deliberate navigation actions
  do: ticking countries (frames them), picking a search result (also ticks its
  country), and Clear all.

  Only cells the forecast beats its climatology on are published, so an absent
  cell means "no skill here", not "no crop here".

  The latest initialisation is shown by default. An older month is described by
  its own run.json, since the catalog's crop lists describe only the latest. Older
  months are reachable only through a ?run=YYYY-MM link: the month selector is
  hidden until users ask for it.
-->
<script>
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ColorScaleLegend from '$lib/components/ColorScaleLegend.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import LabeledMultiSelect from '$lib/components/LabeledMultiSelect.svelte';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import Map from '$lib/components/Map.svelte';
	import MapPanel from '$lib/components/MapPanel.svelte';
	import NowcastPanel from '$lib/components/NowcastPanel.svelte';
	import PlaceSearch from '$lib/components/PlaceSearch.svelte';
	import YieldDensityChart from '$lib/components/YieldDensityChart.svelte';
	import {
		COUNTRY_OPTIONS,
		YIELD_FORECAST_AGGREGATION_OPTIONS,
		countriesBounds,
		countryAt
	} from '$lib/domain-options.js';
	import { STUDY_AREA_VIEW } from '$lib/map-config.js';
	import {
		PERCENTILE_COLORS,
		PERCENTILE_LEGEND_LABELS,
		SKILL_COLORS,
		SKILL_LEGEND_LABELS,
		buildCropIndex,
		describePercentile,
		formatCountryList,
		formatCropLabel,
		formatDay,
		formatSigned,
		formatTercileSplit,
		loadAdmin,
		loadCatalog,
		loadDensity,
		loadGrid,
		loadNowcastAdmin,
		loadNowcastCell,
		loadRunDescription,
		snapToCellCentre
	} from '$lib/yield-forecast.js';
	import { CONTROL_HELP, LEGEND_HELP, METRIC_HELP, SECTION_HELP } from '$lib/yield-forecast-help.js';
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
		countries = $bindable([]),
		adminLevel = $bindable(),
		skillOverlay = $bindable(),
		// The chosen initialisation month; empty means the latest.
		run = $bindable('')
	} = $props();

	let map = $state(null);
	let catalog = $state(null);
	let entries = $state([]);
	let selected = $state(null);
	// Which run and crop `entries` actually holds, so a half-finished crop or month
	// switch cannot be read as data for the newly selected one.
	let loadedCropKey = $state('');
	let loadError = $state('');
	let layerOpacity = $state(0.85);
	let placeQuery = $state('');
	let zones = $state([]);
	let selectedZoneGid = $state(null);
	// Which (run, level, crop) `zones` holds, so a half-finished switch is not read as
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
	// run.json of the selected older month, once loaded.
	let runDescription = $state(null);

	// Fired once at component init. Not an effect: it has no reactive input, so
	// making it one would only obscure that it runs exactly once.
	loadCatalog()
		.then((loaded) => {
			catalog = loaded;
			// A shared link names its month; one no longer published falls back to the latest.
			if (!browser || run) return;
			const requested = new URL(window.location.href).searchParams.get('run');
			if (requested && requested !== loaded.latest_run && loaded.runs?.includes(requested)) {
				run = requested;
			}
		})
		.catch((error) => (loadError = `Could not load the forecast catalog. ${error.message}`));

	const latestRun = $derived(catalog?.latest_run ?? null);
	const isLatestRun = $derived(!run || run === latestRun);
	const shownRun = $derived(isLatestRun ? latestRun : run);
	// What the shown month contains. The catalog's top level describes the latest;
	// an older month has nothing to show until its run.json arrives, so `runId`
	// stays null meanwhile and every layer effect clears instead of mixing months.
	const runInfo = $derived(
		isLatestRun ? catalog : runDescription?.run_id === run ? runDescription : null
	);
	const runId = $derived(runInfo ? shownRun : null);
	const cropIndex = $derived(runInfo ? availableCrops(runInfo, countries) : []);
	const cropOptions = $derived(
		cropIndex.map(({ id, label }) => ({ value: id, label: formatCropLabel(label) }))
	);
	const activeCrop = $derived(cropIndex.find((entry) => entry.id === crop) ?? null);
	const totalCells = $derived(entries.reduce((sum, entry) => sum + entry.grid.n_cells, 0));
	const showZones = $derived(isAdminLevel(adminLevel));
	const isLoadedCropCurrent = $derived(loadedCropKey === `${runId}:${crop}`);
	const isZoneDataCurrent = $derived(loadedZoneKey === `${runId}:${adminLevel}:${crop}`);
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
	// What the panel below the map reports: the selected area at an admin level,
	// otherwise the selected cell. Both read the same way, so one layout serves.
	const result = $derived.by(() => {
		if (showZones && selectedZone) {
			const cropName = formatCropLabel(activeCrop?.label ?? '');
			const countryName = formatCountryList([selectedZone.country]);
			return {
				title:
					adminLevel === 'country'
						? `${cropName} in ${countryName}`
						: `${cropName} in ${selectedZone.zone_name}, ${countryName}`,
				clearLabel: 'Clear area',
				onClear: clearZoneSelection,
				metrics: [
					{ ...METRIC_HELP.percentile, value: selectedZone.percentile.toFixed(0) },
					{ ...METRIC_HELP.anomaly, value: `${formatSigned(selectedZone.anomaly_pct)}%` },
					{
						...METRIC_HELP.terciles,
						value: formatTercileSplit(
							selectedZone.prob_below,
							selectedZone.prob_near,
							selectedZone.prob_above
						).join(' / ')
					},
					{ ...METRIC_HELP.area, value: `${(100 * selectedZone.area_coverage).toFixed(0)}%` }
				],
				summary: `The ensemble mean sits ${describePercentile(selectedZone.percentile)}. Historical variability in this area is ${selectedZone.hist_cv_pct.toFixed(0)}%.`
			};
		}
		if (!showZones && selectedCell) {
			return {
				title: `${formatCropLabel(selectedGrid.crop_label)} in ${formatCountryList([selected.country])} at ${selectedCell.lat.toFixed(2)}°, ${selectedCell.lon.toFixed(2)}°`,
				clearLabel: 'Clear cell',
				onClear: clearCellSelection,
				metrics: [
					{ ...METRIC_HELP.percentile, value: selectedCell.percentile.toFixed(0) },
					{ ...METRIC_HELP.anomaly, value: `${formatSigned(selectedCell.anomalyPct)}%` },
					{
						...METRIC_HELP.terciles,
						value: formatTercileSplit(
							selectedCell.probBelow,
							selectedCell.probNear,
							selectedCell.probAbove
						).join(' / ')
					},
					{ ...METRIC_HELP.skill, value: selectedCell.skill.toFixed(2) }
				],
				summary: `The ensemble mean sits ${describePercentile(selectedCell.percentile)}. Historical variability in this cell is ${selectedCell.histCvPct.toFixed(0)}%.`
			};
		}
		return null;
	});

	// Requests are cached by URL, so re-deriving one for a different cell of the
	// same crop and country reuses the resolved promise rather than refetching.
	const densityRequest = $derived(
		selectedCell && runId && crop ? loadDensity(runId, selected.country, crop) : null
	);

	// The month's crop nowcast (season so far from observed weather), when it has one.
	const nowcastInfo = $derived(runInfo?.nowcast ?? null);
	// Season so far and the forecast each get a box, so the observed part is not
	// read as part of the forecast.
	const RESULT_BOX = 'rounded-lg border border-border bg-background/70 p-4';
	// Controls, legend and results panel: no fill or frame, only grouping.
	const PANEL = '';
	const nowcastZoneRequest = $derived(
		nowcastInfo && showZones && selectedZone && runId && crop
			? loadNowcastAdmin(runId, nowcastInfo, adminLevel, crop).then(
					(payload) => payload?.zones.find((zone) => zone.gid === selectedZone.gid) ?? null
				)
			: null
	);
	const nowcastCellRequest = $derived(
		nowcastInfo && selectedCell && runId && crop
			? loadNowcastCell(
					runId,
					nowcastInfo,
					selected.country,
					crop,
					selectedCell.zones.admin1,
					selectedCell.lat,
					selectedCell.lon
				)
			: null
	);

	const MONTH_NAMES = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	/** "2026-08" reads as a code; "August 2026" reads as a date. */
	function formatRunId(runId) {
		const [year, month] = String(runId ?? '').split('-');
		return MONTH_NAMES[Number(month) - 1] ? `${MONTH_NAMES[Number(month) - 1]} ${year}` : runId;
	}

	/** The day the forecast was published, as "14 October 2026". */
	function formatPublished(timestamp) {
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return '';
		return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
	}

	const lastUpdated = $derived(formatPublished(catalog?.generated_utc));

	const ALL_COUNTRIES = COUNTRY_OPTIONS.map(({ value }) => value);

	/** A month's crops grown in at least one of `selected`, each listing only those countries. */
	function availableCrops(description, selected) {
		return buildCropIndex(description)
			.map((entry) => ({
				...entry,
				countries: entry.countries.filter((name) => selected.includes(name))
			}))
			.filter((entry) => entry.countries.length);
	}

	/** A crop the month or the ticked countries do not have is dropped, as if never picked. */
	function dropUnavailableCrop(description) {
		if (crop && !availableCrops(description, countries).some((entry) => entry.id === crop)) {
			crop = '';
		}
	}

	function frameCountries(selected) {
		const bounds =
			selected.length === ALL_COUNTRIES.length ? STUDY_AREA_VIEW.bounds : countriesBounds(selected);
		if (!map || !bounds) return;
		map.fitBounds(bounds, { ...STUDY_AREA_VIEW.fitBoundsOptions, duration: 900 });
	}

	/**
	 * Tick or untick countries. A crop none of them has is dropped, and so is a
	 * selection in an unticked country, which would describe a place no longer drawn.
	 */
	function setCountries(next) {
		const ordered = ALL_COUNTRIES.filter((name) => next.includes(name));
		const removed = countries.filter((name) => !ordered.includes(name));
		countries = ordered;
		if (runInfo) dropUnavailableCrop(runInfo);
		if (anchor && removed.includes(countryAt(anchor.lat, anchor.lon))) {
			if (showZones) clearZoneSelection();
			else clearCellSelection();
		}
		frameCountries(ordered);
	}

	function selectRun(id) {
		const next = id === latestRun ? '' : id;
		if (next === run) return;
		run = next;
		loadError = '';
		if (!next) dropUnavailableCrop(catalog);
		// The latest needs no parameter, so its link stays the plain page URL.
		const url = new URL(window.location.href);
		if (next) url.searchParams.set('run', next);
		else url.searchParams.delete('run');
		replaceState(url, {});
	}

	/** Back to the opening state, camera included, without reloading the page. */
	function startOver() {
		anchorZones = {};
		placeQuery = '';
		crop = '';
		countries = ALL_COUNTRIES;
		adminLevel = 'grid';
		skillOverlay = false;
		// Without this the panel keeps reporting the last clicked cell, which then
		// reads as "no data here" for a crop that is no longer selected.
		anchor = null;
		selected = null;
		selectedZoneGid = null;
		if (!map) return;
		setSelectedCell(map, null);
		clearZoneLayers(map);
		map.fitBounds(STUDY_AREA_VIEW.bounds, { ...STUDY_AREA_VIEW.fitBoundsOptions, duration: 900 });
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
	function handlePlaceSelect({ lat, lon, countryCode }) {
		if (!map) return;
		const mapInstance = map;
		// Tick the place's country so its data is drawn; the others stay as they were.
		const placeCountry =
			COUNTRY_OPTIONS.find(({ isoCode }) => isoCode === countryCode)?.value ?? countryAt(lat, lon);
		if (placeCountry && !countries.includes(placeCountry)) {
			countries = ALL_COUNTRIES.filter((name) => name === placeCountry || countries.includes(name));
		}
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

	// An older month's description, fetched when it is selected. Cached by URL, so
	// returning to a month does not refetch.
	$effect(() => {
		if (!catalog || isLatestRun) return;
		const id = run;
		let cancelled = false;
		loadRunDescription(id)
			.then((description) => {
				if (cancelled) return;
				dropUnavailableCrop(description);
				runDescription = description;
			})
			.catch((error) => {
				if (cancelled) return;
				loadError = `Could not load the ${formatRunId(id)} forecast. ${error.message}`;
			});
		return () => {
			cancelled = true;
		};
	});

	// Load the selected crop for every country that has it, then hand the merged
	// set to the map and frame it. Depends on `map` so a crop resolved before the
	// map finished mounting is still drawn.
	$effect(() => {
		if (!map) return;
		const cropEntry = activeCrop;
		if (!runId || !cropEntry) {
			entries = [];
			loadedCropKey = '';
			clearForecastCells(map);
			return;
		}
		const mapInstance = map;
		const key = `${runId}:${cropEntry.id}`;
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
				loadedCropKey = key;
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
				loadedCropKey = '';
				clearForecastCells(mapInstance);
				loadError = `Could not load ${formatCropLabel(cropEntry.label)}. ${error.message}`;
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
		const shownCountries = countries;
		const key = `${runId}:${level}:${crop}`;
		let cancelled = false;
		loadAdmin(runId, level, crop)
			.then((payload) => {
				if (cancelled) return;
				zones = payload.zones.filter((zone) => shownCountries.includes(zone.country));
				loadedZoneKey = key;
				loadError = '';
				paintZones(mapInstance, level, zones, layerOpacity);
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
					const known = zones.some((zone) => zone.gid === remembered);
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


{#snippet nowcastBox(request)}
	<section class={RESULT_BOX}>
		<h3 class="mb-3 text-base font-semibold text-foreground">
			<InfoTip text={SECTION_HELP.seasonSoFar}>
				<span>
					Season so far
					<span class="font-normal text-muted-foreground">(up to {formatDay(nowcastInfo.through)})</span>
				</span>
			</InfoTip>
		</h3>
		{#await request}
			<p class="text-sm text-muted-foreground">Loading the season so far…</p>
		{:then entry}
			{#if entry}
				<NowcastPanel {entry} through={nowcastInfo.through} stepDays={nowcastInfo.step_days} />
			{:else}
				<p class="text-sm text-muted-foreground">Not sown yet.</p>
			{/if}
		{:catch error}
			<p class="text-sm text-destructive">Could not load the season so far. {error.message}</p>
		{/await}
	</section>
{/snippet}

{#snippet resultPanel(nowcastRequest, chart)}
	<div class="mb-3 flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_minmax(0,auto)_1fr] sm:items-center sm:gap-3">
		<span class="hidden sm:block"></span>
		<p class="text-center text-base font-semibold text-foreground">{result.title}</p>
		<div class="flex justify-end">
			<button
				type="button"
				onclick={result.onClear}
				class="cursor-pointer text-[13px] text-muted-foreground hover:text-foreground"
			>
				{result.clearLabel}
			</button>
		</div>
	</div>

	<div class={['grid items-start gap-4', nowcastInfo && 'lg:grid-cols-2']}>
		{#if nowcastInfo}
			{@render nowcastBox(nowcastRequest)}
		{/if}
		<section class={RESULT_BOX}>
			<h3 class="mb-3 text-base font-semibold text-foreground">
				<InfoTip text={SECTION_HELP.forecast}>Yield forecast</InfoTip>
			</h3>
			<div class="mb-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
				{#each result.metrics as metric (metric.label)}
					<div class="flex flex-col items-center gap-0.5 text-center">
						<InfoTip text={metric.text} class="text-[13px] text-muted-foreground">
							{metric.label}
						</InfoTip>
						<p class="text-base font-semibold text-foreground">{metric.value}</p>
					</div>
				{/each}
			</div>
			<p class="mb-2 text-[13px] text-muted-foreground">{result.summary}</p>
			{@render chart()}
		</section>
	</div>
{/snippet}

{#snippet zoneChart()}
	<YieldDensityChart forecast={selectedZone.members} historical={selectedZone.reference} />
{/snippet}

{#snippet cellChart()}
	{#await densityRequest}
		<div class="flex h-24 items-center justify-center">
			<p class="text-sm text-muted-foreground">Loading distribution…</p>
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
			<p class="text-sm text-destructive">Could not load the distribution. {error.message}</p>
		</div>
	{/await}
{/snippet}

{#snippet emptyState(message)}
	<div class="flex h-28 items-center justify-center rounded-md bg-background/60 px-4">
		<p class="text-center text-sm text-muted-foreground">{message}</p>
	</div>
{/snippet}

<div class="shrink-0 px-4 pt-2">
	<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
		<div class="flex flex-wrap items-start gap-x-8 gap-y-3">
		<div>
			<h1 class="text-xl font-semibold tracking-tight text-foreground">Seasonal yield forecast</h1>
			{#if catalog && !isLatestRun}
				<p class="mt-0.5 text-sm text-muted-foreground">Forecast of {formatRunId(shownRun)}</p>
			{:else if lastUpdated}
				<p class="mt-0.5 text-sm text-muted-foreground">Last updated {lastUpdated}</p>
			{/if}
		</div>
		<!-- Nothing is drawn without a crop, so it sits by the title rather than
		     among the controls that only decide where and how it is shown. -->
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
	{#if catalog && !isLatestRun}
		<p class="mt-1 text-sm text-muted-foreground">
			Older forecast. The latest is {formatRunId(latestRun)}.
			<button
				type="button"
				onclick={() => selectRun(latestRun)}
				class="cursor-pointer font-medium text-foreground underline underline-offset-2 hover:no-underline"
			>
				Show latest
			</button>
		</p>
	{/if}
</div>

<div class="grid gap-3 px-4 py-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
	<!-- Controls and legend share the left column so the map keeps its aspect and
	     the density plot below can use the full width. -->
	<div class="space-y-6">
		<div class="space-y-3 {PANEL}">
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
				label="Show by"
				labelClass="text-sm"
				help={CONTROL_HELP.showBy}
				bind:value={adminLevel}
				options={YIELD_FORECAST_AGGREGATION_OPTIONS}
				placeholder="Select level"
				widthClass="w-full"
			/>

			<div class="flex items-center justify-between gap-2">
				<InfoTip text={CONTROL_HELP.skill} class="text-sm font-medium text-muted-foreground">
					Colour by skill
				</InfoTip>
				<button
					type="button"
					role="switch"
					aria-checked={skillOverlay}
					aria-label="Colour by skill"
					onclick={() => (skillOverlay = !skillOverlay)}
					disabled={showZones}
					title={showZones ? 'Skill is only available per grid cell' : ''}
					class={[
						'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
						skillOverlay ? 'border-primary bg-primary' : 'border-border bg-muted'
					]}
				>
					<span
						class={[
							'inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform',
							skillOverlay ? 'translate-x-[1.1rem]' : 'translate-x-0.5'
						]}
					></span>
				</button>
			</div>

			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<InfoTip text={CONTROL_HELP.opacity} class="shrink-0">Opacity</InfoTip>
				<input
					type="range"
					min="0.2"
					max="1"
					step="0.05"
					bind:value={layerOpacity}
					aria-label="Forecast layer opacity"
					class="h-1 w-full cursor-pointer accent-foreground"
				/>
			</div>
		</div>

		{#if skillOverlay && !showZones}
			<ColorScaleLegend
				title="Forecast skill"
				subtitle="Higher means a more reliable forecast"
				help={LEGEND_HELP.skill}
				colors={SKILL_COLORS}
				labels={SKILL_LEGEND_LABELS}
				barHeightClass="h-5"
				containerClass={PANEL}
				large
			/>
		{:else}
			<ColorScaleLegend
				title="Yield compared with past years"
				subtitle="Brown is below the usual yield, green above it"
				help={showZones ? LEGEND_HELP.percentileAreas : LEGEND_HELP.percentileCells}
				colors={PERCENTILE_COLORS}
				labels={PERCENTILE_LEGEND_LABELS}
				noDataLabel={showZones ? '' : 'No forecast'}
				barHeightClass="h-5"
				containerClass={PANEL}
				large
			/>
		{/if}
	</div>

	<div class="space-y-2">
		{#if loadError}
			<div class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
				{loadError}
			</div>
		{/if}
		<MapPanel heightClass="h-[52vh] min-h-[340px] max-h-[620px]">
			<Map
				bind:map
				{adminLevel}
				onStyleReload={handleStyleReload}
				initialView={STUDY_AREA_VIEW}
				cooperativeGestures="touch"
			/>
		</MapPanel>
	</div>
</div>

<div class="px-4 pb-4">
	<div class={PANEL}>
		{#if anchorUnresolved}
			<!-- The coordinate names a cell, so it is only a heading in the grid
			     view. At an admin level the reported unit is the area, and a point
			     inside it would misdescribe what is missing. -->
			<div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
				{#if showZones}
					<span></span>
				{:else}
					<p class="text-sm font-medium text-foreground">
						{anchor.lat.toFixed(2)}°, {anchor.lon.toFixed(2)}°
					</p>
				{/if}
				<button
					type="button"
					onclick={clearCellSelection}
					class="cursor-pointer text-[13px] text-muted-foreground hover:text-foreground"
				>
					Clear
				</button>
			</div>
			{@render emptyState(
				`No ${activeCrop ? formatCropLabel(activeCrop.label).toLowerCase() : 'forecast'} data for this ${showZones ? 'area' : 'location'} in this initialisation.`
			)}
		{:else if result}
			{@render resultPanel(
				showZones ? nowcastZoneRequest : nowcastCellRequest,
				showZones ? zoneChart : cellChart
			)}
		{:else if !countries.length}
			{@render emptyState('Select at least one country to see the forecast')}
		{:else if showZones}
			{@render emptyState(
				zones.length
					? `Click any ${zoneLevelLabel.toLowerCase()} area to see its forecast distribution`
					: 'Select a crop to load the forecast'
			)}
		{:else}
			{@render emptyState(
				totalCells
					? 'Click any of the cells to see its forecast distribution'
					: 'Select a crop to load the forecast'
			)}
		{/if}
	</div>
</div>
