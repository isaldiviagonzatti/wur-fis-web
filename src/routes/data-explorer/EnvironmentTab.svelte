<script>
	import MapPlaceholderPanel from '$lib/components/MapPlaceholderPanel.svelte';

	let { active = false } = $props();
</script>

<MapPlaceholderPanel
	{active}
	message="Environmental layers (soil, land use, elevation) coming soon."
/>
