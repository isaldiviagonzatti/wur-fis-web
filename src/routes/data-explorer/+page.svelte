<!--
  Retired URL: the Data Explorer overview was dropped; each data page now
  introduces itself. Old links go on to the first of them.
-->
<script>
	import ForwardPage from '$lib/components/ForwardPage.svelte';
	import { PAGES } from '$lib/navigation.js';
</script>

<ForwardPage to={PAGES.cropStatistics.href} title={PAGES.cropStatistics.title} />
