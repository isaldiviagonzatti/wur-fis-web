<!--
  MapLibre GL JS map component.
  Initialises on mount (browser-only). Exposes the map instance via bind:map
  for parent components to add layers. Swaps basemap style on dark mode toggle
  and exposes an in-map projection toggle.
-->
<script>
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import { BASEMAP_STYLE_URLS, FALLBACK_STYLE_URLS, MAP_DEFAULTS } from '$lib/map-config.js';
	import { ADMIN_PMTILES_URLS } from '$lib/data-sources.js';
	import { COUNTRY_VIEWS } from '$lib/domain-options.js';
	import { createNoDataPatternImage } from '$lib/no-data-pattern.js';
	import { theme } from '$lib/theme.svelte.js';

	let {
		map = $bindable(null),
		adminLevel = 'admin1',
		flyToCountry = $bindable(''),
		countryOptions = [],
		onStyleReload = undefined,
		// Opening camera. Defaults to the shared continental view; pages whose data
		// only covers part of it can pass {bounds, fitBoundsOptions} to frame that
		// instead, which stays correct at any container width.
		initialView = undefined
	} = $props();

	const ADMIN_LEVELS = ['country', 'admin1', 'admin2', 'aez'];
	const ADMIN_LAYER_SUFFIXES = ['hatch', 'fill', 'outline'];
	const PROJECTION_OPTIONS = [
		{ value: 'mercator', label: 'Mercator' },
		{ value: 'globe', label: 'Globe' }
	];
	const NO_DATA_PATTERN_ID = 'fis-no-data-hatch';
	const PMTILES_PROTOCOL_KEY = '__fisPmtilesProtocolRegistered';
	const APP_SOURCE_IDS = new Set(ADMIN_LEVELS);
	const APP_LAYER_IDS = new Set([
		...ADMIN_LEVELS.flatMap((level) => ADMIN_LAYER_SUFFIXES.map((suffix) => `${level}-${suffix}`)),
		'aez-selected-fill'
	]);
	let activeBasemapStyleUrl = '';
	let previousFlyToCountry = '';
	let projectionMode = $state('mercator');

	function getBasemapStyleUrl(isDark) {
		return isDark ? BASEMAP_STYLE_URLS.dark : BASEMAP_STYLE_URLS.light;
	}

	function mergeCustomStyle(previousStyle, nextStyle) {
		if (!previousStyle) return nextStyle;

		const nextSourceIds = new Set(Object.keys(nextStyle.sources ?? {}));
		const preservedSources = Object.fromEntries(
			Object.entries(previousStyle.sources ?? {}).filter(
				([sourceId]) => APP_SOURCE_IDS.has(sourceId) && !nextSourceIds.has(sourceId)
			)
		);

		const nextLayerIds = new Set((nextStyle.layers ?? []).map((layer) => layer.id));
		const preservedLayers = (previousStyle.layers ?? []).filter(
			(layer) => APP_LAYER_IDS.has(layer.id) && !nextLayerIds.has(layer.id)
		);

		return {
			...nextStyle,
			sources: {
				...(nextStyle.sources ?? {}),
				...preservedSources
			},
			layers: [...(nextStyle.layers ?? []), ...preservedLayers]
		};
	}

	function ensureNoDataPattern(mapInstance) {
		if (mapInstance.hasImage(NO_DATA_PATTERN_ID)) return;
		mapInstance.addImage(NO_DATA_PATTERN_ID, createNoDataPatternImage());
	}

	function ensureAdminLayers(mapInstance) {
		for (const level of ADMIN_LEVELS) {
			if (!mapInstance.getSource(level)) {
				mapInstance.addSource(level, {
					type: 'vector',
					url: `pmtiles://${ADMIN_PMTILES_URLS[level]}`
				});
			}

			if (!mapInstance.getLayer(`${level}-hatch`)) {
				mapInstance.addLayer({
					id: `${level}-hatch`,
					type: 'fill',
					source: level,
					'source-layer': level,
					layout: { visibility: 'none' },
					paint: { 'fill-pattern': NO_DATA_PATTERN_ID, 'fill-opacity': 0 }
				});
			}

			if (!mapInstance.getLayer(`${level}-fill`)) {
				mapInstance.addLayer({
					id: `${level}-fill`,
					type: 'fill',
					source: level,
					'source-layer': level,
					layout: { visibility: 'none' },
					paint: { 'fill-color': 'rgba(0, 0, 0, 0)', 'fill-opacity': 0.85 }
				});
			}

			if (!mapInstance.getLayer(`${level}-outline`)) {
				mapInstance.addLayer({
					id: `${level}-outline`,
					type: 'line',
					source: level,
					'source-layer': level,
					layout: { visibility: 'none' },
					paint: { 'line-color': '#2c5f8a', 'line-width': 1 }
				});
			}
		}

		if (!mapInstance.getLayer('aez-selected-fill')) {
			mapInstance.addLayer({
				id: 'aez-selected-fill',
				type: 'fill',
				source: 'aez',
				'source-layer': 'aez',
				layout: { visibility: 'none' },
				filter: ['==', ['get', 'aez_name'], '__none__'],
				paint: { 'fill-color': 'rgba(0, 0, 0, 0)', 'fill-opacity': 0 }
			});
		}
	}

	function applyMapPresentation(mapInstance, currentAdminLevel) {
		mapInstance.setProjection({ type: projectionMode });
		setAdminLayerVisibility(mapInstance, currentAdminLevel);
	}

	function syncMapAssets(mapInstance, currentAdminLevel) {
		ensureNoDataPattern(mapInstance);
		ensureAdminLayers(mapInstance);
		applyMapPresentation(mapInstance, currentAdminLevel);
		// A style swap discards every source and layer this component does not
		// explicitly preserve, so consumers that added their own must re-add them.
		onStyleReload?.(mapInstance);
	}

	/**
	 * Fall back to the open basemap when the configured style cannot be fetched.
	 *
	 * A restricted Protomaps key answers 403 "Invalid origin for API key", and
	 * MapLibre then never fires `load` — which would leave `map` unbound and every
	 * data layer silently unmounted, looking like missing data rather than a
	 * missing basemap.
	 */
	function attachStyleFallback(mapInstance) {
		const handleError = (event) => {
			const status = event?.error?.status;
			if (mapInstance.isStyleLoaded() || (status !== 403 && status !== 401)) return;
			const fallback = theme.dark ? FALLBACK_STYLE_URLS.dark : FALLBACK_STYLE_URLS.light;
			if (activeBasemapStyleUrl === fallback) return;
			console.warn(
				`Basemap style rejected (${status}); falling back to the open basemap.`
			);
			activeBasemapStyleUrl = fallback;
			mapInstance.setStyle(fallback);
		};
		mapInstance.on('error', handleError);
	}

	function setProjectionMode(nextProjection) {
		if (projectionMode === nextProjection) return;
		projectionMode = nextProjection;
		if (!map) return;
		applyMapPresentation(map, adminLevel);
	}

	function setAdminLayerVisibility(mapInstance, currentAdminLevel) {
		for (const level of ADMIN_LEVELS) {
			const visibility = currentAdminLevel === level ? 'visible' : 'none';
			for (const suffix of ADMIN_LAYER_SUFFIXES) {
				const layerId = `${level}-${suffix}`;
				if (mapInstance.getLayer(layerId)) {
					mapInstance.setLayoutProperty(layerId, 'visibility', visibility);
				}
			}
		}

		if (mapInstance.getLayer('aez-selected-fill')) {
			mapInstance.setLayoutProperty(
				'aez-selected-fill',
				'visibility',
				currentAdminLevel === 'aez' ? 'visible' : 'none'
			);
		}
	}

	$effect(() => {
		if (!map) return;
		setAdminLayerVisibility(map, adminLevel);
	});

	$effect(() => {
		if (!flyToCountry) {
			previousFlyToCountry = '';
			return;
		}
		if (!map || flyToCountry === previousFlyToCountry) return;

		const target = COUNTRY_VIEWS[flyToCountry];
		if (!target) return;

		previousFlyToCountry = flyToCountry;

		const fly = () => {
			map.flyTo({ center: target.center, zoom: target.zoom, duration: 900, essential: true });
		};

		// `load` has already fired by the time this component exposes `map`, and it
		// only fires once, so waiting on it here would drop the camera move
		// forever. `idle` fires again after the next render settles.
		if (map.isStyleLoaded()) fly();
		else map.once('idle', fly);
	});

	// Swap basemap style when dark mode changes, then re-add custom layers after load.
	$effect(() => {
		const isDark = theme.dark;
		if (!map) return;
		const mapInstance = map;

		const styleUrl = getBasemapStyleUrl(isDark);
		if (styleUrl === activeBasemapStyleUrl) return;

		const handleStyleLoad = () => {
			activeBasemapStyleUrl = styleUrl;
			syncMapAssets(mapInstance, adminLevel);
		};

		mapInstance.on('style.load', handleStyleLoad);
		mapInstance.setStyle(styleUrl, { transformStyle: mergeCustomStyle });

		return () => {
			mapInstance.off('style.load', handleStyleLoad);
		};
	});

	function ensurePmtilesProtocol(maplibre, Protocol) {
		if (globalThis[PMTILES_PROTOCOL_KEY]) return;

		const protocol = new Protocol();

		try {
			maplibre.addProtocol('pmtiles', protocol.tile);
		} catch (error) {
			const message = String(error?.message ?? error ?? '');
			if (!message.toLowerCase().includes('already exists')) throw error;
		}

		globalThis[PMTILES_PROTOCOL_KEY] = true;
	}

	function mountMap(node) {
		let isDestroyed = false;
		let mapInstance = null;

		(async () => {
			const maplibre = await import('maplibre-gl');
			await import('maplibre-gl/dist/maplibre-gl.css');
			const { Protocol } = await import('pmtiles');
			if (isDestroyed) {
				return;
			}

			ensurePmtilesProtocol(maplibre, Protocol);

			const initialStyleUrl = getBasemapStyleUrl(theme.dark);
			activeBasemapStyleUrl = initialStyleUrl;

			mapInstance = new maplibre.Map({
				container: node,
				style: initialStyleUrl,
				...(initialView?.bounds
					? {
							bounds: initialView.bounds,
							fitBoundsOptions: initialView.fitBoundsOptions ?? { padding: 20 }
						}
					: {
							center: initialView?.center ?? MAP_DEFAULTS.center,
							zoom: initialView?.zoom ?? MAP_DEFAULTS.zoom
						}),
				maxZoom: MAP_DEFAULTS.maxZoom,
				minZoom: MAP_DEFAULTS.minZoom,
				renderWorldCopies: false,
				cooperativeGestures: true,
				attributionControl: false
			});

			mapInstance.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-right');
			attachStyleFallback(mapInstance);

			mapInstance.on('load', () => {
				// MapLibre has no public option for "compact and collapsed on first render".
				// Compact mode starts opened; remove the opened class once after load.
				const attributionControl = node.querySelector('.maplibregl-ctrl-attrib');
				attributionControl?.classList.remove('maplibregl-compact-show');

				syncMapAssets(mapInstance, adminLevel);

				// Expose instance only after layers are ready so $effect can call getLayer()
				map = mapInstance;
			});
		})();

		return {
			destroy() {
				isDestroyed = true;
				mapInstance?.remove();
				activeBasemapStyleUrl = '';
				map = null;
			}
		};
	}
</script>

<div class="relative h-full w-full">
	<div use:mountMap class="h-full w-full"></div>

	<div class="pointer-events-none absolute right-3 top-3 z-10">
		<div class="pointer-events-auto flex w-[8.5rem] flex-col gap-1.5 rounded-lg border border-border/80 bg-background/88 p-1.5 shadow-sm backdrop-blur">
			<div class="grid w-full grid-cols-2 gap-1 rounded-md bg-muted/75 p-0.5">
				{#each PROJECTION_OPTIONS as option (option.value)}
					<button
						type="button"
						aria-pressed={projectionMode === option.value}
						aria-label={`Switch projection to ${option.label}.`}
						onclick={() => setProjectionMode(option.value)}
						class={[
							'inline-flex w-full min-w-0 cursor-pointer items-center justify-center rounded-[calc(var(--radius)-4px)] px-2 py-1 text-center text-[11px] font-medium leading-none transition-colors',
							projectionMode === option.value
								? 'bg-foreground text-background shadow-xs'
								: 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
						]}
					>
						{option.label}
					</button>
				{/each}
			</div>

			{#if countryOptions.length}
				<LabeledSelect
					showLabel={false}
					bind:value={flyToCountry}
					options={countryOptions}
					placeholder="Zoom to"
					widthClass="w-full"
					triggerStyle="height: auto; padding-top: 0.35rem; padding-bottom: 0.35rem; background: color-mix(in oklab, var(--background) 92%, transparent); backdrop-filter: blur(6px);"
				/>
			{/if}
		</div>
	</div>
</div>
