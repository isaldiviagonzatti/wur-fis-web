<!--
  MapPanel — shared bordered container for map views.
-->
<script>
	let {
		heightClass = 'h-[42vh] min-h-[280px] max-h-[560px]',
		shellClass = 'relative overflow-hidden rounded-md border border-border',
		children
	} = $props();
</script>

<div class={`${shellClass} ${heightClass}`}>
	{@render children?.()}
</div>
