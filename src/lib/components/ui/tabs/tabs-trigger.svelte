<script>
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	} = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	style="cursor: pointer;"
	class={cn(
		"text-muted-foreground data-[state=active]:text-foreground data-[state=active]:[box-shadow:inset_0_-2px_0_currentColor] inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-0 text-xs font-medium transition-colors hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
/>
