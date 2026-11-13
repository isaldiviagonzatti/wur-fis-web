<!--
  Yield Forecast tool — opens with its title, when the forecast was last
  updated, and its description, then a tab shell delegating to per-tab
  components: Forecast | User Guide | Methodology.
-->
<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import PageIntro from '$lib/components/PageIntro.svelte';
	import { Tabs, TabsContent } from '$lib/components/ui/tabs';
	import PageTabList from '$lib/components/PageTabList.svelte';
	import { PAGES } from '$lib/navigation.js';
	import { DEFAULT_FORECAST_COUNTRIES, formatRunId, loadCatalog } from '$lib/yield-forecast.js';
	import ForecastTab from './ForecastTab.svelte';
	import MethodologyTab from './MethodologyTab.svelte';
	import UserGuideTab from './UserGuideTab.svelte';

	let activeTab = $state('forecast');
	let crop = $state('');
	let countries = $state(DEFAULT_FORECAST_COUNTRIES);
	let adminLevel = $state('grid');
	let skillOverlay = $state(false);
	let run = $state('');
	let latestRun = $state(null);

	// The same cached request the forecast tab makes; it reports a failed load.
	if (browser) {
		loadCatalog()
			.then((catalog) => (latestRun = catalog.latest_run))
			.catch(() => {});
	}

	// The forecast starts on the 1st of its month, when that month's seasonal
	// forecast is issued and the observed weather ends. It is the date of the
	// data, so republishing a month never moves it.
	const lastUpdated = $derived(latestRun ? `Last updated 1 ${formatRunId(latestRun)}` : '');

	const LINKED_TABS = ['guide', 'methodology'];

	// The open tab lives in the URL (?tab=guide, ?tab=methodology), so a link or a
	// reload opens the same tab; the forecast tab needs no parameter.
	onMount(() => {
		const tab = new URL(window.location.href).searchParams.get('tab');
		if (LINKED_TABS.includes(tab)) activeTab = tab;
	});

	function selectTab(tab) {
		activeTab = tab;
		const url = new URL(window.location.href);
		if (LINKED_TABS.includes(tab)) url.searchParams.set('tab', tab);
		else url.searchParams.delete('tab');
		replaceState(url, {});
	}
</script>

<div class="flex flex-col h-full">
	<PageIntro page={PAGES.yieldForecast} note={lastUpdated} class="px-page pt-6 pb-1" />
	<Tabs bind:value={() => activeTab, selectTab} class="flex flex-col flex-1 overflow-x-clip">
		<PageTabList
			tabs={[
				{ value: 'forecast', label: 'Forecast' },
				{ value: 'guide', label: 'User Guide' },
				{ value: 'methodology', label: 'Methodology' }
			]}
		/>

		<!-- Clip, not hidden or auto: those make a scroll container that never scrolls,
		     which would keep the map from staying in view (MapToolLayout). -->
		<TabsContent value="forecast" class="m-0 flex-1 overflow-x-clip p-0">
			<ForecastTab bind:crop bind:countries bind:adminLevel bind:skillOverlay bind:run />
		</TabsContent>

		<TabsContent value="guide" class="m-0 flex-1 overflow-auto px-page py-4">
			<UserGuideTab />
		</TabsContent>

		<TabsContent value="methodology" class="m-0 flex-1 overflow-auto px-page py-4">
			<MethodologyTab />
		</TabsContent>
	</Tabs>
</div>
