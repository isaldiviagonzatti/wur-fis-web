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
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem; border-bottom: 1px solid var(--border);">
			<TabsList>
				<TabsTrigger value="gis">Foodshed Maps</TabsTrigger>
				<TabsTrigger value="guide">User Guide</TabsTrigger>
			</TabsList>
		</div>

		<TabsContent value="gis" class="flex-1 overflow-auto p-4 m-0">
			<div class="flex items-center gap-2 mb-4">
				<Badge variant="outline">Coming soon</Badge>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Foodshed Maps</CardTitle>
					<CardDescription>Present-day and long-term scenario foodsheds</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">
						Interactive maps of present-day foodsheds for Ghana, Kenya, and Zimbabwe showing
						how domestic crop production, trade flows, and food demand combine to determine
						food availability. Long-term foodshed scenarios under SSP2-4.5 and SSP3-7.0
						(2040-2050 and 2080-2100 horizons) are under development.
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
						Background on the foodshed concept (geographic area from which a population derives its food supply), the capacity-based self-sufficiency framework used here, scenario assumptions (SSP2/SSP3), and guidance on reading the food availability indicators.
					</p>
					<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
