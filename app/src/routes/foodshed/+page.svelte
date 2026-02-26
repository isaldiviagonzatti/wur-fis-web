<!--
  Foodshed Scenarios page — placeholder with secondary tabs.
  Secondary tabs: GIS Data | User Guide
-->
<script>
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
</script>

<div class="flex flex-col h-full">
	<Tabs value="gis" class="flex flex-col flex-1 overflow-hidden">
		<div class="border-b border-border px-4 pt-3">
			<TabsList class="h-9">
				<TabsTrigger value="gis">GIS Data</TabsTrigger>
				<TabsTrigger value="guide">User Guide</TabsTrigger>
			</TabsList>
		</div>

		<TabsContent value="gis" class="flex-1 overflow-auto p-4 m-0">
			<div class="flex items-center gap-2 mb-4">
				<Badge variant="outline">Coming soon</Badge>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Foodshed GIS Data</CardTitle>
					<CardDescription>Spatial foodshed boundaries and scenario outputs</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">
						Interactive maps showing foodshed delineations, supply catchments, and
						scenario-based projections of food system configurations under climate change.
						This section is currently under development.
					</p>
					<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value="guide" class="flex-1 overflow-auto p-4 m-0">
			<Card>
				<CardHeader>
					<CardTitle>User Guide</CardTitle>
					<CardDescription>How to interpret the foodshed scenario data</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">
						Background on the foodshed concept, methodological approach, scenario assumptions,
						and guidance on interpreting the spatial outputs.
					</p>
					<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
