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
	import Map from '$lib/components/Map.svelte';

	let map = $state(null);

	let crop = $state('');
	let country = $state('');
	let adminLevel = $state('admin1');
	let skillOverlay = $state(false);
	let previousCountry = '';

	const cropLabels = {
		maize: 'Maize',
		sorghum: 'Sorghum'
	};

	const countryLabels = {
		ghana: 'Ghana',
		kenya: 'Kenya',
		zimbabwe: 'Zimbabwe'
	};

	const countryViews = {
		ghana: { center: [-1.02, 7.95], zoom: 5 },
		kenya: { center: [37.91, 0.15], zoom: 5 },
		zimbabwe: { center: [29.15, -19.02], zoom: 5 }
	};

	$effect(() => {
		if (!map || !country) {
			return;
		}

		if (country === previousCountry) {
			return;
		}

		previousCountry = country;
		const targetView = countryViews[country];
		if (!targetView) {
			return;
		}

		const fly = () => {
			map.flyTo({
				center: targetView.center,
				zoom: targetView.zoom,
				duration: 900,
				essential: true
			});
		};

		if (!map.isStyleLoaded()) {
			map.once('load', fly);
			return;
		}

		fly();
	});
</script>

<div class="flex flex-col h-full">
	<!-- Secondary tabs -->
	<Tabs value="forecast" class="flex flex-col flex-1 overflow-hidden">
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem;">
			<TabsList>
				<TabsTrigger value="forecast">Current Forecast</TabsTrigger>
				<TabsTrigger value="hindcasts">Hindcasts</TabsTrigger>
				<TabsTrigger value="guide">User Guide</TabsTrigger>
			</TabsList>
		</div>

		<!-- Current Forecast tab -->
		<TabsContent value="forecast" class="m-0 flex-1 overflow-auto p-0">
			<!-- Controls bar -->
			<div class="shrink-0 px-4 py-1.5 overflow-x-auto overflow-y-hidden">
				<div class="flex min-w-max items-center gap-2">
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground font-medium">Crop</span>
						<Select type="single" bind:value={crop}>
							<SelectTrigger size="sm" class="w-28">
								{cropLabels[crop] ?? 'Select crop'}
							</SelectTrigger>
							<SelectContent style="width: var(--bits-select-anchor-width);">
								<SelectItem value="maize" label="Maize" />
								<SelectItem value="sorghum" label="Sorghum" />
							</SelectContent>
						</Select>
					</div>

					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground font-medium">Country</span>
						<Select type="single" bind:value={country}>
							<SelectTrigger size="sm" class="w-32">
								{countryLabels[country] ?? 'Select country'}
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
						{#each ['country', 'admin1', 'admin2'] as level (level)}
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
			</div>

			<div class="space-y-3 px-4 py-3">
				<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
					<Map bind:map />
				</div>

				<div>
					<p class="mb-2 text-xs font-medium text-muted-foreground">Selected region — density plot</p>
					<div class="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/10">
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
