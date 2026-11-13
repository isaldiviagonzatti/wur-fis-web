<!--
  PageIntro — the title and short description a page opens with, so each page
  explains itself without a section overview page. Pass a `page` entry from
  navigation.js, or a `title` and `description` (or children for rich text).
  `compact` fits it in one line above full-height tools. A `slogan` title (the
  home page's) is a sentence: it keeps its case and is set centred, in italics,
  in balanced lines, where a page name takes the site's title style. A `note`
  (for example when the data was last updated) sits right under the title.
-->
<script>
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils.js';

	let {
		page = null,
		title = '',
		description = '',
		compact = false,
		slogan = false,
		note = '',
		class: className = '',
		children
	} = $props();

	const shownTitle = $derived(title || page?.title);
	const badge = $derived(page?.comingSoon ? 'Coming soon' : page?.badge);
	const shownDescription = $derived(
		description || (compact ? page?.subtitle : page?.description) || ''
	);
</script>

{#if compact}
	<div class={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
		<h1 class="site-title text-lg font-semibold tracking-tight text-foreground">{shownTitle}</h1>
		{#if badge}<Badge variant="outline" class="self-center text-muted-foreground">{badge}</Badge>{/if}
		{#if shownDescription}
			<p class="text-sm text-muted-foreground">{shownDescription}</p>
		{/if}
		{@render children?.()}
	</div>
{:else}
	<header class={cn('space-y-2', className)}>
		<div class={['flex flex-wrap items-center gap-x-3 gap-y-1', slogan && 'justify-center']}>
			<h1
				class={[
					'text-2xl font-semibold tracking-tight text-foreground sm:text-3xl',
					slogan ? 'text-center text-balance italic' : 'site-title'
				]}
			>
				{shownTitle}
			</h1>
			{#if badge}<Badge variant="outline" class="text-muted-foreground">{badge}</Badge>{/if}
		</div>
		{#if note}
			<p class="text-sm text-muted-foreground">{note}</p>
		{/if}
		{#if shownDescription}
			<p class="max-w-3xl text-base leading-relaxed text-muted-foreground">{shownDescription}</p>
		{/if}
		{@render children?.()}
	</header>
{/if}
