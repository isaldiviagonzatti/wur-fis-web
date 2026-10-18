<!--
  Crop statistics — tab shell delegating to per-tab components.
  Secondary tabs: Explorer | User Guide | Methodology.
-->
<script>
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { COUNTRY_OPTIONS } from '$lib/domain-options.js';
	import ExplorerTab from './ExplorerTab.svelte';
	import MethodologyTab from './MethodologyTab.svelte';
	import UserGuideTab from './UserGuideTab.svelte';

	let activeTab = $state('explorer');
	let countries = $state(COUNTRY_OPTIONS.map(({ value }) => value));
	let crop = $state('maize');
	let variable = $state('yield');
	let level = $state('admin1');
	let chosenYear = $state(null);

	const LINKED_TABS = ['guide', 'methodology'];

	// The open tab lives in the URL (?tab=guide, ?tab=methodology), so a link or a
	// reload opens the same tab; the explorer needs no parameter.
	onMount(() => {
		const tab = new URL(window.location.href).searchParams.get('tab');
		if (LINKED_TABS.includes(tab)) activeTab = tab;
	});

	function selectTab(tab) {
		activeTab = tab;
		const query = LINKED_TABS.includes(tab) ? `?tab=${tab}` : '';
		replaceState(resolve(`/data-explorer/crop-statistics${query}`), {});
	}
</script>

<div class="flex flex-col h-full">
	<Tabs bind:value={() => activeTab, selectTab} class="flex flex-col flex-1 overflow-hidden">
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem;">
			<TabsList>
				<TabsTrigger value="explorer">Explorer</TabsTrigger>
				<TabsTrigger value="guide">User Guide</TabsTrigger>
				<TabsTrigger value="methodology">Methodology</TabsTrigger>
			</TabsList>
		</div>

		<TabsContent value="explorer" class="m-0 flex-1 overflow-auto p-0">
			<ExplorerTab bind:countries bind:crop bind:variable bind:level bind:chosenYear />
		</TabsContent>

		<TabsContent value="guide" class="flex-1 overflow-auto p-4 m-0">
			<UserGuideTab />
		</TabsContent>

		<TabsContent value="methodology" class="flex-1 overflow-auto p-4 m-0">
			<MethodologyTab />
		</TabsContent>
	</Tabs>
</div>
