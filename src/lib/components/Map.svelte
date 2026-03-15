<!--
  MapLibre GL JS map component.
  Initialises on mount (browser-only). Exposes the map instance via bind:map
  for parent components to add layers. Swaps basemap style on dark mode toggle.
-->
<script>
	import { BASEMAP_STYLE_URLS, MAP_DEFAULTS } from '$lib/map-config.js';
	import { ADMIN_PMTILES_URLS } from '$lib/data-config.js';
	import { theme } from '$lib/theme.svelte.js';

	let { map = $bindable(null), adminLevel = 'admin1' } = $props();

	const ADMIN_LEVELS = ['country', 'admin1', 'admin2', 'aez'];
	const ADMIN_LAYER_SUFFIXES = ['fill', 'outline'];
	const PMTILES_PROTOCOL_KEY = '__fisPmtilesProtocolRegistered';
	const APP_SOURCE_IDS = new Set(ADMIN_LEVELS);
	const APP_LAYER_IDS = new Set([
		...ADMIN_LEVELS.flatMap((level) => ADMIN_LAYER_SUFFIXES.map((suffix) => `${level}-${suffix}`)),
		'aez-selected-fill'
	]);
	let activeBasemapStyleUrl = '';

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

	function ensureAdminLayers(mapInstance) {
		for (const level of ADMIN_LEVELS) {
			if (!mapInstance.getSource(level)) {
				mapInstance.addSource(level, {
					type: 'vector',
					url: `pmtiles://${ADMIN_PMTILES_URLS[level]}`
				});
			}

			if (!mapInstance.getLayer(`${level}-fill`)) {
				mapInstance.addLayer({
					id: `${level}-fill`,
					type: 'fill',
					source: level,
					'source-layer': level,
					layout: { visibility: 'none' },
					paint: { 'fill-color': '#4a90d9', 'fill-opacity': 0.15 }
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
				paint: { 'fill-color': '#4a90d9', 'fill-opacity': 0 }
			});
		}
	}

	function applyMapPresentation(mapInstance, currentAdminLevel) {
		mapInstance.setProjection({ type: 'globe' });
		setAdminLayerVisibility(mapInstance, currentAdminLevel);
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

	// Swap basemap style when dark mode changes, then re-add custom layers after load.
	$effect(() => {
		const isDark = theme.dark;
		if (!map) return;
		const mapInstance = map;

		const styleUrl = getBasemapStyleUrl(isDark);
		if (styleUrl === activeBasemapStyleUrl) return;

		const handleStyleLoad = () => {
			activeBasemapStyleUrl = styleUrl;
			ensureAdminLayers(mapInstance);
			applyMapPresentation(mapInstance, adminLevel);
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
				center: MAP_DEFAULTS.center,
				zoom: MAP_DEFAULTS.zoom,
				minZoom: MAP_DEFAULTS.minZoom,
				attributionControl: false
			});

			mapInstance.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-right');

			mapInstance.on('load', () => {
				// MapLibre has no public option for "compact and collapsed on first render".
				// Compact mode starts opened; remove the opened class once after load.
				const attributionControl = node.querySelector('.maplibregl-ctrl-attrib');
				attributionControl?.classList.remove('maplibregl-compact-show');

				ensureAdminLayers(mapInstance);
				applyMapPresentation(mapInstance, adminLevel);

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

<div use:mountMap class="w-full h-full"></div>
