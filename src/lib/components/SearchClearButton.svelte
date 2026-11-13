<!--
  SearchClearButton — the X that empties a search field. Search fields use
  type="text" with role="searchbox" and this button instead of the browser's
  own clear button, which ignores the theme.
-->
<script>
	import X from '@lucide/svelte/icons/x';

	let { onclick } = $props();
</script>

<button
	type="button"
	{onclick}
	aria-label="Clear search"
	class="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-sm p-0.5 text-foreground/70 hover:text-foreground"
>
	<X size={14} />
</button>
