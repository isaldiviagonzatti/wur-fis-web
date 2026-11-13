<!--
  Retired URL: /foodshed was the Foodshed Atlas page before the section got
  its own pages, so old links go on to the Atlas.
-->
<script>
	import ForwardPage from '$lib/components/ForwardPage.svelte';
	import { PAGES } from '$lib/navigation.js';
</script>

<ForwardPage to={PAGES.atlas.href} title={PAGES.atlas.title} />
