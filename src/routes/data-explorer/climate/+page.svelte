<!--
  Climate explorer — ERA5-Land climatology layers.
-->
<script>
	import MapPlaceholderPanel from '$lib/components/MapPlaceholderPanel.svelte';
	import PageIntro from '$lib/components/PageIntro.svelte';
	import { PAGES } from '$lib/navigation.js';
</script>

<PageIntro page={PAGES.climate} class="px-page pt-6 pb-1" />

<MapPlaceholderPanel
	message="Climate climatology layers (ERA5-Land temperature, precipitation) coming soon."
/>
