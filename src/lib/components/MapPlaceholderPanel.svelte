<script>
	import Map from '$lib/components/Map.svelte';
	import MapPanel from '$lib/components/MapPanel.svelte';

	let { message = '' } = $props();
</script>

<div class="px-4 py-3">
	<MapPanel>
		<Map />
	</MapPanel>
	<p class="mt-2 text-xs text-muted-foreground">{message}</p>
</div>
