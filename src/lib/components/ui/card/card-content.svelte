<script>
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	} = $props();
</script>

<div bind:this={ref} data-slot="card-content" style="padding: 0 1.5rem 1.5rem;"
	class={cn("", className)} {...restProps}>
	{@render children?.()}
</div>