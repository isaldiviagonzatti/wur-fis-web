<!--
  Yield Forecast page — tab shell delegating to per-tab components.
  Secondary tabs: Current Forecast | Hindcasts | User Guide
-->
<script>
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import ForecastTab from './ForecastTab.svelte';
	import HindcastsTab from './HindcastsTab.svelte';
	import UserGuideTab from './UserGuideTab.svelte';

	let crop = $state('');
	let country = $state('');
	let adminLevel = $state('country');
	let skillOverlay = $state(false);
</script>

<div class="flex flex-col h-full">
	<Tabs value="forecast" class="flex flex-col flex-1 overflow-hidden">
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem;">
			<TabsList>
				<TabsTrigger value="forecast">Current Forecast</TabsTrigger>
				<TabsTrigger value="hindcasts">Hindcasts</TabsTrigger>
				<TabsTrigger value="guide">User Guide</TabsTrigger>
			</TabsList>
		</div>

		<TabsContent value="forecast" class="m-0 flex-1 overflow-auto p-0">
			<ForecastTab bind:crop bind:country bind:adminLevel bind:skillOverlay />
		</TabsContent>

		<TabsContent value="hindcasts" class="flex-1 overflow-auto p-4 m-0">
			<HindcastsTab />
		</TabsContent>

		<TabsContent value="guide" class="flex-1 overflow-auto p-4 m-0">
			<UserGuideTab />
		</TabsContent>
	</Tabs>
</div>
