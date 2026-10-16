<!--
  LabeledMultiSelect — a dropdown where any number of options can be ticked.
  The trigger lists what is ticked, cut short with an ellipsis when it does not fit.
-->
<script>
	import Check from '@lucide/svelte/icons/check';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	let {
		label = '',
		value = $bindable([]),
		options = [],
		noneLabel = 'None',
		widthClass = 'w-32',
		labelClass = 'text-xs'
	} = $props();

	const summary = $derived(
		value.length
			? options
					.filter((option) => value.includes(option.value))
					.map((option) => option.label)
					.join(', ')
			: noneLabel
	);
</script>

<div class="flex items-center gap-1.5">
	<span class="shrink-0 {labelClass} font-medium text-muted-foreground">{label}</span>
	<Select type="multiple" bind:value>
		<SelectTrigger size="sm" aria-label={label} class="{widthClass} min-w-0">
			<span class="truncate">{summary}</span>
		</SelectTrigger>
		<SelectContent style="width: var(--bits-select-anchor-width);">
			{#each options as option (option.value)}
				<SelectItem value={option.value} label={option.label}>
					{#snippet children({ selected })}
						<span class="flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-border">
							{#if selected}<Check size={11} />{/if}
						</span>
						{option.label}
					{/snippet}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>
</div>
