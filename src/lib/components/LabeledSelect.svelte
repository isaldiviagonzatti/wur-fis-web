<script>
	import InfoTip from '$lib/components/InfoTip.svelte';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';

	let {
		label = '',
		showLabel = true,
		value = $bindable(''),
		options = [],
		placeholder = 'Select option',
		widthClass = 'w-32',
		disabled = false,
		triggerStyle = '',
		// A short explanation of the control, shown on hovering its label.
		help = '',
		class: className = ''
	} = $props();

	const selectedLabel = $derived(
		options.find((option) => option.value === value)?.label ?? placeholder
	);
</script>

<div class={['flex items-center gap-1.5', className]}>
	{#if showLabel}
		{#if help}
			<InfoTip text={help} class="field-label shrink-0">{label}</InfoTip>
		{:else}
			<span class="field-label">{label}</span>
		{/if}
	{/if}
	<Select type="single" bind:value disabled={disabled}>
		<SelectTrigger size="sm" class="{widthClass} min-w-0" style={triggerStyle}>
			<span class="truncate">{selectedLabel}</span>
		</SelectTrigger>
		<SelectContent style="width: var(--bits-select-anchor-width);">
			{#each options as option (option.value)}
				<SelectItem value={option.value} label={option.label} />
			{/each}
		</SelectContent>
	</Select>
</div>
