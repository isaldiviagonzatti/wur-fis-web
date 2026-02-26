<!--
  Yield Forecast page — map + controls + density chart panel.
  Secondary tabs: Current Forecast | Hindcasts | User Guide
-->
<script>
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import Gauge from '@lucide/svelte/icons/gauge';

	let crop = $state('maize');
	let country = $state('ghana');
	let adminLevel = $state('admin1');
	let skillOverlay = $state(false);
</script>

<div class="flex flex-col h-full">
	<!-- Secondary tabs -->
	<Tabs value="forecast" class="flex flex-col flex-1 overflow-hidden">
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem; border-bottom: 1px solid var(--border);">
			<TabsList>
				<TabsTrigger value="forecast">Current Forecast</TabsTrigger>
				<TabsTrigger value="hindcasts">Hindcasts</TabsTrigger>
				<TabsTrigger value="guide">User Guide</TabsTrigger>
			</TabsList>
		</div>

		<!-- Current Forecast tab -->
		<TabsContent value="forecast" class="flex flex-col flex-1 overflow-hidden m-0 p-0">
			<!-- Controls bar -->
			<div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-1.5">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-muted-foreground font-medium">Crop</span>
					<Select bind:value={crop}>
						<SelectTrigger size="sm" class="w-28" style="font-size: 0.75rem; cursor: pointer;">
							{crop.charAt(0).toUpperCase() + crop.slice(1)}
						</SelectTrigger>
						<SelectContent style="width: var(--bits-select-anchor-width);">
							<SelectItem value="maize" label="Maize" />
							<SelectItem value="sorghum" label="Sorghum" />
						</SelectContent>
					</Select>
				</div>

				<div class="flex items-center gap-1.5">
					<span class="text-xs text-muted-foreground font-medium">Country</span>
					<Select bind:value={country}>
						<SelectTrigger size="sm" class="w-28" style="font-size: 0.75rem; cursor: pointer;">
							{country.charAt(0).toUpperCase() + country.slice(1)}
						</SelectTrigger>
						<SelectContent style="width: var(--bits-select-anchor-width);">
							<SelectItem value="ghana" label="Ghana" />
							<SelectItem value="kenya" label="Kenya" />
							<SelectItem value="zimbabwe" label="Zimbabwe" />
						</SelectContent>
					</Select>
				</div>

				<Separator orientation="vertical" class="h-4" />

				<div class="flex items-center gap-1">
					<span class="text-xs text-muted-foreground font-medium mr-1">Admin</span>
					{#each ['country', 'admin1', 'admin2'] as level}
						<button
							onclick={() => (adminLevel = level)}
							class="cursor-pointer px-2 py-0.5 rounded text-xs border transition-colors {adminLevel === level
								? 'bg-primary text-primary-foreground border-primary'
								: 'border-border text-muted-foreground hover:bg-accent'}"
						>
							{level === 'country' ? 'Country' : level === 'admin1' ? 'Admin 1' : 'Admin 2'}
						</button>
					{/each}
				</div>

				<Separator orientation="vertical" class="h-4" />

				<button
					onclick={() => (skillOverlay = !skillOverlay)}
					class="cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-colors {skillOverlay
						? 'bg-primary text-primary-foreground border-primary'
						: 'border-border text-muted-foreground hover:bg-accent'}"
				>
					<Gauge size={12} />
					Skill overlay
				</button>
			</div>

			<!-- Map area (65% height) + chart panel below -->
			<div class="flex flex-col flex-1 overflow-hidden">
				<!-- Map placeholder -->
				<div class="relative bg-muted/20 border-b border-border" style="flex: 0 0 65%;">
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="text-center text-muted-foreground">
							<p class="text-sm font-medium">Map — MapLibre GL JS</p>
							<p class="text-xs mt-1">
								Showing <strong>{crop}</strong> · <strong>{country}</strong> · <strong>{adminLevel}</strong>
								{#if skillOverlay}<span class="text-amber-600 dark:text-amber-400"> · skill overlay active</span>{/if}
							</p>
							<p class="text-xs text-muted-foreground/60 mt-3">Click a region to load the chart below</p>
						</div>
					</div>
				</div>

				<!-- Chart panel (remaining height) -->
				<div class="flex-1 overflow-auto px-4 py-3">
					<p class="text-xs font-medium text-muted-foreground mb-2">Selected region — density plot</p>
					<div class="flex items-center justify-center h-32 rounded-md border border-dashed border-border bg-muted/10">
						<p class="text-xs text-muted-foreground">
							Select a region on the map to show the yield distribution
						</p>
					</div>
				</div>
			</div>
		</TabsContent>

		<!-- Hindcasts tab -->
		<TabsContent value="hindcasts" class="flex-1 overflow-auto p-4 m-0">
			<Card>
				<CardHeader>
					<CardTitle>Hindcast Skill</CardTitle>
					<CardDescription>Historical performance of the seasonal yield forecast</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">
						Hindcast skill metrics (RPSS, correlation, reliability) for each crop, country,
						and lead time. Visualisations and spatial skill maps will be shown here.
					</p>
					<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
				</CardContent>
			</Card>
		</TabsContent>

		<!-- User Guide tab -->
		<TabsContent value="guide" class="flex-1 overflow-auto p-4 m-0">
			<Card>
				<CardHeader>
					<CardTitle>User Guide</CardTitle>
					<CardDescription>How to use the Yield Forecast tool</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">
						Step-by-step guidance on selecting crops and regions, interpreting the density
						plot (historical vs. forecast distribution), and understanding the skill overlay.
						Full documentation will appear here.
					</p>
					<p class="text-xs text-muted-foreground/60 mt-4">— Placeholder —</p>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
