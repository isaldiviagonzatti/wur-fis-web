<!--
  MapFrame — a map and its legend in one frame, the legend in a strip under the
  map. `class` sets the frame's height and the map fills what the legend leaves,
  so a legend never makes the frame taller. Where the frame's height is not set,
  `mapClass` sizes the map part instead.
-->
<script>
	let { class: className = '', mapClass = 'min-h-0 flex-1', legend, children } = $props();
</script>

<div class={['flex flex-col overflow-hidden rounded-md border border-border/70 bg-card/80', className]}>
	<div class={['relative overflow-hidden', mapClass]}>
		{@render children()}
	</div>
	{#if legend}
		<div class="shrink-0 border-t border-border/70 p-3">
			{@render legend()}
		</div>
	{/if}
</div>
