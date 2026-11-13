<!--
  LabeledChecklist — options listed one under the other, each ticked or unticked
  by clicking its row. Past `maxRows` rows the list scrolls, so a longer list
  (more countries) keeps the control column short. `value` keeps the order of
  `options`, whatever the order of clicks.
-->
<script>
	let { label = '', value = $bindable([]), options = [], maxRows = 6, class: className = '' } = $props();

	// Rows are h-8 (2rem).
	const maxHeight = $derived(`calc(${maxRows} * 2rem)`);

	function toggle(optionValue, checked) {
		value = options
			.map((option) => option.value)
			.filter((each) => (each === optionValue ? checked : value.includes(each)));
	}
</script>

<fieldset class={['min-w-0', className]}>
	<legend class="field-label mb-1">{label}</legend>
	<ul class="overflow-y-auto" style:max-height={maxHeight}>
		{#each options as option (option.value)}
			<li>
				<label
					class="flex h-8 cursor-pointer items-center gap-2.5 text-[0.9375rem] text-foreground"
				>
					<input
						type="checkbox"
						class="size-4 shrink-0 cursor-pointer accent-foreground"
						checked={value.includes(option.value)}
						onchange={(event) => toggle(option.value, event.currentTarget.checked)}
					/>
					<span class="truncate">{option.label}</span>
				</label>
			</li>
		{/each}
	</ul>
</fieldset>
