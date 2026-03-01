<!--
  MapLibre GL JS map component.
  Initialises on mount (browser-only). Exposes the map instance via bind:map
  for parent components to add layers.
-->
<script>
	import { BASEMAP_STYLE_URL, MAP_DEFAULTS } from '$lib/map-config.js';

	let { map = $bindable(null) } = $props();

	function mountMap(node) {
		let isDestroyed = false;
		let mapInstance = null;

		(async () => {
			const maplibre = await import('maplibre-gl');
			await import('maplibre-gl/dist/maplibre-gl.css');
			if (isDestroyed) {
				return;
			}

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
			});

			map = mapInstance;
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
