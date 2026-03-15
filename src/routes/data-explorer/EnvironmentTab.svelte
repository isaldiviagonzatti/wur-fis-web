<!--
  Environment tab — static spatial layers: soil, land use, elevation.
  Raster layers to be added later; map placeholder shown for now.
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
	<p class="mt-2 text-xs text-muted-foreground">Environmental layers (soil, land use, elevation) coming soon.</p>
</div>
