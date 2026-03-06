<!--
  Context page — static reference data underpinning the FIS forecasts.
  Tabs: Agriculture | Environment | Climate
-->
<script>
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import CropAgricultureTab from './CropAgricultureTab.svelte';
	import EnvironmentTab from './EnvironmentTab.svelte';
	import ClimateTab from './ClimateTab.svelte';

	let activeTab = $state('crop');
</script>

<div class="flex flex-col h-full">
	<Tabs bind:value={activeTab} class="flex flex-col flex-1 overflow-hidden">
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem;">
			<TabsList>
				<TabsTrigger value="crop">Agriculture</TabsTrigger>
				<TabsTrigger value="environment">Environment</TabsTrigger>
				<TabsTrigger value="climate">Climate</TabsTrigger>
			</TabsList>
		</div>

		<TabsContent value="crop" class="m-0 flex-1 overflow-auto p-0">
			<CropAgricultureTab active={activeTab === 'crop'} />
		</TabsContent>

		<TabsContent value="environment" class="m-0 flex-1 overflow-auto p-0">
			<EnvironmentTab active={activeTab === 'environment'} />
		</TabsContent>

		<TabsContent value="climate" class="m-0 flex-1 overflow-auto p-0">
			<ClimateTab active={activeTab === 'climate'} />
		</TabsContent>
	</Tabs>
</div>
