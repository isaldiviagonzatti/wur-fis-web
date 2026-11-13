<!--
  MapFitButton — the map control that brings the camera back to the page's
  selection after a drag or zoom. Mounted by `addFitControl` (map-camera.js)
  into a MapLibre control container, so it stacks under the zoom buttons.
  `getLabel` is a function so the label follows the selection as it changes.
-->
<script>
	import Maximize from '@lucide/svelte/icons/maximize';

	let { getLabel, onfit } = $props();
</script>

<!-- Inline display: maplibre-gl.css sets control buttons to display: block. -->
<button
	type="button"
	title={getLabel()}
	aria-label={getLabel()}
	onclick={onfit}
	style="display: flex; align-items: center; justify-content: center; cursor: pointer;"
>
	<Maximize size={15} aria-hidden="true" />
</button>
