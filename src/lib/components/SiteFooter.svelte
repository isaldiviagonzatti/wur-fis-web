<!--
  SiteFooter — who makes the service and who funds it, the partner logos in
  their original colours, and links to the tools, the data and the project
  pages.
-->
<script>
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import PartnerLogos from './PartnerLogos.svelte';
	import { FOOTER_COLUMNS, SITE_NAME } from '$lib/navigation.js';

	let { onfeedback = null } = $props();

	const CONTACT_EMAIL = 'ignacio.saldiviagonzatti@wur.nl';

	const textLinkClass =
		'font-medium text-brand-foreground underline decoration-brand-foreground/30 underline-offset-2 hover:decoration-brand-foreground';
	const columnLinkClass =
		'inline-flex cursor-pointer items-center gap-1 text-brand-foreground hover:underline hover:underline-offset-4';
</script>

<footer class="safe-bottom bg-brand text-brand-muted">
	<div
		class="mx-auto grid max-w-6xl gap-10 px-5 pt-10 pb-8 sm:px-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
	>
		<div class="space-y-7">
			<p class="max-w-xl text-sm leading-relaxed">
				<span class="font-medium text-brand-foreground">{SITE_NAME}</span> is developed at
				<a href="https://www.wur.nl" target="_blank" rel="noopener" class={textLinkClass}
					>Wageningen University &amp; Research</a
				>
				as part of the EU Horizon Europe project
				<a href="https://www.safe4allafrica.eu/" target="_blank" rel="noopener" class={textLinkClass}
					>SAFE4ALL</a
				>
				(grant No. 101137814), which addresses food security, climate change, and migration in
				Sub-Saharan Africa through climate services co-developed with partners in Ghana, Kenya, and
				Zimbabwe. Questions about the data or methods:
				<a href="mailto:{CONTACT_EMAIL}" class={textLinkClass}>{CONTACT_EMAIL}</a>.
			</p>

			<PartnerLogos logoHeight={26} class="w-fit max-w-full gap-x-8 px-5 py-4" />
		</div>

		<nav aria-label="Footer" class="grid grid-cols-2 gap-8 sm:grid-cols-3">
			{#each FOOTER_COLUMNS as column (column.title)}
				<div>
					<h2 class="mb-3 text-xs font-semibold tracking-wider uppercase">{column.title}</h2>
					<ul class="site-title space-y-2 text-sm">
						{#each column.links as link (link.href)}
							<li>
								{#if link.external}
									<a href={link.href} target="_blank" rel="noopener" class={columnLinkClass}>
										{link.title}<ArrowUpRight size={13} aria-hidden="true" />
									</a>
								{:else}
									<a href={link.href} class={columnLinkClass}>{link.title}</a>
								{/if}
							</li>
						{/each}
						{#if column.feedback && onfeedback}
							<li>
								<button class={columnLinkClass} onclick={onfeedback}>Send feedback</button>
							</li>
						{/if}
					</ul>
				</div>
			{/each}
		</nav>
	</div>
</footer>
