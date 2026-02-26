<script>
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	} = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	data-slot="select-item"
	style="cursor: pointer;"
	class={cn(
		"data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:bg-muted data-[selected]:font-medium relative flex w-full !cursor-pointer items-center gap-2 rounded-sm py-1.5 px-3 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		className
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted })}
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>