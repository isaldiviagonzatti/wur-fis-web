<!--
  PartnerLogos — partner and funder logos in their original colours, on a
  panel that stays white so they read on any background and in either theme.
  Used in the footer and on the About page.
-->
<script>
	import { cn } from '$lib/utils.js';
	import { EU_EMBLEM, PARTNERS } from '$lib/partners.js';

	let { logoHeight = 34, class: className = '' } = $props();
</script>

<div
	class={cn(
		'flex flex-wrap items-center gap-x-10 gap-y-5 rounded-md bg-white px-6 py-5',
		className
	)}
>
	{#each PARTNERS as partner (partner.name)}
		<a href={partner.href} target="_blank" rel="noopener" class="shrink-0">
			<img
				src={partner.logo}
				alt={partner.name}
				class="w-auto"
				style:height="{logoHeight * partner.scale}px"
			/>
		</a>
	{/each}
	<div class="flex shrink-0 items-center gap-3">
		<img
			src={EU_EMBLEM.logo}
			alt={EU_EMBLEM.name}
			class="w-auto"
			style:height="{logoHeight * EU_EMBLEM.scale}px"
		/>
		<span class="leading-tight text-zinc-700" style:font-size="{Math.round(logoHeight * 0.4)}px">
			{#each EU_EMBLEM.caption as line (line)}
				<span class="block whitespace-nowrap">{line}</span>
			{/each}
		</span>
	</div>
</div>
