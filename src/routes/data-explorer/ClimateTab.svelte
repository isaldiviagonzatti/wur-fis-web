<script>
	import MapPlaceholderPanel from '$lib/components/MapPlaceholderPanel.svelte';

	let { active = false } = $props();
</script>

<MapPlaceholderPanel
	{active}
	message="Climate climatology layers (ERA5-Land temperature, precipitation) coming soon."
/>
