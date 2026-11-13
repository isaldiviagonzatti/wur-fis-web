<!--
  App shell: the brand header on top, then the page, which scrolls with the
  footer below it. Holds the feedback dialog, opened by the floating button in
  the bottom-right corner and by the footer, and the tooltip provider that
  InfoTip needs.
-->
<script>
	import favicon from '$lib/assets/favicon.svg';
	import '@fontsource-variable/inter';
	// Fetched only by pages that set italic text (the home page's slogan).
	import '@fontsource-variable/inter/wght-italic.css';
	import '../app.css';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { Tooltip } from 'bits-ui';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';
	import FeedbackDialog from '$lib/components/FeedbackDialog.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { isFeedbackAvailable } from '$lib/feedback.js';
	import { theme } from '$lib/theme.svelte.js';

	let { children } = $props();

	let feedbackOpen = $state(false);
	const openFeedback = isFeedbackAvailable() ? () => (feedbackOpen = true) : null;

	afterNavigate(({ type }) => {
		// count.js only counts the initial page load; client-side navigations are counted here.
		if (type !== 'enter') window.goatcounter?.count?.();
	});

	onMount(() => {
		document.documentElement.classList.toggle('dark', theme.dark);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Tooltip.Provider delayDuration={300}>
	<div class="app-shell flex flex-col overflow-hidden bg-background text-foreground">
		<SiteHeader />
		<main class="flex-1 overflow-auto">
			<div class="flex min-h-full flex-col">
				<div class="flex-1">
					{@render children()}
				</div>
				<SiteFooter onfeedback={openFeedback} />
			</div>
		</main>
	</div>
	{#if openFeedback}<FeedbackButton onclick={openFeedback} />{/if}
	<FeedbackDialog bind:open={feedbackOpen} />
</Tooltip.Provider>
