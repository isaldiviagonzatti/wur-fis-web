<!--
  Climate tab — climatological reference data (ERA5-Land normals).
  Raster layers and season/variable selectors to be added later.
-->
<script>
	import Map from '$lib/components/Map.svelte';

	let { active = false } = $props();

	let map = $state(null);
</script>

<div class="px-4 py-3">
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		{#if active}
			<Map bind:map />
		{/if}
	</div>
	<p class="mt-2 text-xs text-muted-foreground">Climate climatology layers (ERA5-Land temperature, precipitation) coming soon.</p>
</div>
