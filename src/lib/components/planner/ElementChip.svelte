<!--
  ElementChip — a food-system element named in the toolshed, with its zone's
  colour. Clicking the name selects the element on the board; an optional
  button after it removes it (unlinks a card, or takes it out of the plan).
-->
<script>
	import X from '@lucide/svelte/icons/x';

	let { element, onselect, onremove = null, removeLabel = '' } = $props();
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pr-1 pl-2 text-xs"
>
	<span class="size-2 rounded-full" style:background="var(--zone-{element.zone})"></span>
	<button class="cursor-pointer hover:underline" onclick={() => onselect(element.id)}>
		{element.label}
	</button>
	{#if onremove}
		<button
			class="grid size-4 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
			aria-label={removeLabel || `Remove ${element.label}`}
			title={removeLabel || `Remove ${element.label}`}
			onclick={onremove}
		>
			<X size={11} />
		</button>
	{:else}
		<span class="w-1"></span>
	{/if}
</span>
