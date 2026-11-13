<!--
  Environment explorer — soil, land use, and elevation layers.
-->
<script>
	import MapPlaceholderPanel from '$lib/components/MapPlaceholderPanel.svelte';
	import PageIntro from '$lib/components/PageIntro.svelte';
	import { PAGES } from '$lib/navigation.js';
</script>

<PageIntro page={PAGES.environment} class="px-page pt-6 pb-1" />

<MapPlaceholderPanel
	message="Environmental layers (soil, land use, elevation) coming soon."
/>
