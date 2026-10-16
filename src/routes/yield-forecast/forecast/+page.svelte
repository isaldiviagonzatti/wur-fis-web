<!--
  Yield Forecast tool — tab shell delegating to per-tab components.
  Secondary tabs: Forecast | User Guide | Methodology. The overview is the parent route.
-->
<script>
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { COUNTRY_OPTIONS } from '$lib/domain-options.js';
	import ForecastTab from '../ForecastTab.svelte';
	import MethodologyTab from '../MethodologyTab.svelte';
	import UserGuideTab from '../UserGuideTab.svelte';

	let activeTab = $state('forecast');
	let crop = $state('');
	let countries = $state(COUNTRY_OPTIONS.map(({ value }) => value));
	let adminLevel = $state('grid');
	let skillOverlay = $state(false);
	let run = $state('');

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
	<Tabs bind:value={() => activeTab, selectTab} class="flex flex-col flex-1 overflow-hidden">
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem;">
			<TabsList>
				<TabsTrigger value="forecast">Forecast</TabsTrigger>
				<TabsTrigger value="guide">User Guide</TabsTrigger>
				<TabsTrigger value="methodology">Methodology</TabsTrigger>
			</TabsList>
		</div>

		<TabsContent value="forecast" class="m-0 flex-1 overflow-auto p-0">
			<ForecastTab bind:crop bind:countries bind:adminLevel bind:skillOverlay bind:run />
		</TabsContent>

		<TabsContent value="guide" class="flex-1 overflow-auto p-4 m-0">
			<UserGuideTab />
		</TabsContent>

		<TabsContent value="methodology" class="flex-1 overflow-auto p-4 m-0">
			<MethodologyTab />
		</TabsContent>
	</Tabs>
</div>
