<!--
  ForwardPage — stands at a retired URL and sends the visitor on to the page
  that replaced it, keeping any query and fragment (shared forecast links carry
  ?run= and ?tab=). The link is there for anyone without JavaScript.
-->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { to, title } = $props();

	onMount(() => {
		goto(`${to}${window.location.search}${window.location.hash}`, { replaceState: true });
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<p class="px-6 py-10 text-sm text-muted-foreground">
	This page has moved to <a href={to} class="text-foreground underline underline-offset-2">{title}</a>.
</p>
