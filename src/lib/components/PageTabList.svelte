<!--
  PageTabList — the row of tabs under a page intro (for example Explorer |
  User Guide | Methodology), centred on the page. Place it inside a <Tabs>;
  `tabs` is a list of { value, label }.
-->
<script>
	import { TabsList, TabsTrigger } from '$lib/components/ui/tabs';

	let { tabs } = $props();
</script>

<div class="flex h-12 shrink-0 items-center justify-center px-page">
	<TabsList class="site-title">
		{#each tabs as tab (tab.value)}
			<TabsTrigger value={tab.value}>{tab.label}</TabsTrigger>
		{/each}
	</TabsList>
</div>
