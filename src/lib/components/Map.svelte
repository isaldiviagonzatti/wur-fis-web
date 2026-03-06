<!--
  MapLibre GL JS map component.
  Initialises on mount (browser-only). Exposes the map instance via bind:map
  for parent components to add layers.
-->
<script>
	import { BASEMAP_STYLE_URL, MAP_DEFAULTS } from '$lib/map-config.js';
	import { ADMIN_PMTILES_URLS } from '$lib/data-config.js';

	let { map = $bindable(null), adminLevel = 'admin1' } = $props();

	const ADMIN_LEVELS = ['country', 'admin1', 'admin2', 'aez'];
	const ADMIN_LAYER_SUFFIXES = ['fill', 'outline'];

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
	}

	$effect(() => {
		if (!map) return;
		setAdminLayerVisibility(map, adminLevel);
	});

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

			const protocol = new Protocol();
			maplibre.addProtocol('pmtiles', protocol.tile);

			mapInstance = new maplibre.Map({
				container: node,
				style: BASEMAP_STYLE_URL,
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

				mapInstance.setProjection({ type: 'vertical-perspective' });

				for (const level of ADMIN_LEVELS) {
					mapInstance.addSource(level, {
						type: 'vector',
						url: `pmtiles://${ADMIN_PMTILES_URLS[level]}`
					});

					mapInstance.addLayer({
						id: `${level}-fill`,
						type: 'fill',
						source: level,
						'source-layer': level,
						layout: { visibility: 'none' },
						paint: {
							'fill-color': '#4a90d9',
							'fill-opacity': 0.15
						}
					});

					mapInstance.addLayer({
						id: `${level}-outline`,
						type: 'line',
						source: level,
						'source-layer': level,
						layout: { visibility: 'none' },
						paint: {
							'line-color': '#2c5f8a',
							'line-width': 1
						}
					});
				}

				setAdminLayerVisibility(mapInstance, adminLevel);

				// Expose instance only after layers are ready so $effect can call getLayer()
				map = mapInstance;
			});
		})();

		return {
			destroy() {
				isDestroyed = true;
				mapInstance?.remove();
				map = null;
			}
		};
	}
</script>

<div use:mountMap class="w-full h-full"></div>
