<!--
  Retired URL: the forecast moved to /yield-forecast when the overview page
  was dropped. Shared links keep their ?run= and ?tab=.
-->
<script>
	import ForwardPage from '$lib/components/ForwardPage.svelte';
	import { PAGES } from '$lib/navigation.js';
</script>

<ForwardPage to={PAGES.yieldForecast.href} title={PAGES.yieldForecast.title} />
