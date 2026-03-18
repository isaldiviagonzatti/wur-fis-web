<!--
  MapPanel — shared bordered container for map views.
-->
<script>
	let {
		heightClass = 'h-[55vh] min-h-[360px] max-h-[760px]',
		children
	} = $props();
</script>

<div class={`relative overflow-hidden rounded-md border border-border ${heightClass}`}>
	{@render children?.()}
</div>
