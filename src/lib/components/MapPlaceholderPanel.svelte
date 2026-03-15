<script>
	import Map from '$lib/components/Map.svelte';

	let { active = false, message = '' } = $props();

	let map = $state(null);
</script>

<div class="px-4 py-3">
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		{#if active}
			<Map bind:map />
		{/if}
	</div>
	<p class="mt-2 text-xs text-muted-foreground">{message}</p>
</div>
