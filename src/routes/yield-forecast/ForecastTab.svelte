<!--
  ForecastTab — map, controls bar, and density chart panel.
-->
<script>
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import Gauge from '@lucide/svelte/icons/gauge';
	import Map from '$lib/components/Map.svelte';

	let { crop = $bindable(), country = $bindable(), adminLevel = $bindable(), skillOverlay = $bindable() } = $props();

	let map = $state(null);
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

	const boundaryLabels = {
		country: 'Country',
		admin1: 'Admin 1',
		admin2: 'Admin 2'
	};

	const countryViews = {
		ghana: { center: [-1.02, 7.95], zoom: 5 },
		kenya: { center: [37.91, 0.15], zoom: 5 },
		zimbabwe: { center: [29.15, -19.02], zoom: 5 }
	};

	const hasActiveSelection = $derived(
		Boolean(country || crop || adminLevel !== 'country' || skillOverlay)
	);

	function clearSelections() {
		country = '';
		crop = '';
		adminLevel = 'country';
		skillOverlay = false;
		previousCountry = '';
	}

	$effect(() => {
		if (!map || !country) return;
		if (country === previousCountry) return;

		previousCountry = country;
		const targetView = countryViews[country];
		if (!targetView) return;

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

<!-- Controls bar -->
<div class="shrink-0 px-4 py-1.5 overflow-x-auto overflow-y-hidden">
	<div class="flex min-w-max items-center gap-2">
		<div class="flex items-center gap-1.5">
			<span class="text-xs text-muted-foreground font-medium">Country</span>
			<Select type="single" bind:value={country}>
				<SelectTrigger size="sm" class="w-32">
					{countryLabels[country] ?? 'Fly to country'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					<SelectItem value="ghana" label="Ghana" />
					<SelectItem value="kenya" label="Kenya" />
					<SelectItem value="zimbabwe" label="Zimbabwe" />
				</SelectContent>
			</Select>
		</div>

		<Separator orientation="vertical" class="h-4" />

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
			<span class="text-xs text-muted-foreground font-medium">Boundary</span>
			<Select type="single" bind:value={adminLevel}>
				<SelectTrigger size="sm" class="w-28">
					{boundaryLabels[adminLevel] ?? 'Select boundary'}
				</SelectTrigger>
				<SelectContent style="width: var(--bits-select-anchor-width);">
					<SelectItem value="country" label="Country" />
					<SelectItem value="admin1" label="Admin 1" />
					<SelectItem value="admin2" label="Admin 2" />
				</SelectContent>
			</Select>
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

		<button
			type="button"
			onclick={clearSelections}
			disabled={!hasActiveSelection}
			class="ml-2 inline-flex cursor-pointer items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
		>
			Clear selection
		</button>
	</div>
</div>

<div class="space-y-3 px-4 py-3">
	<div class="relative h-[55vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-md border border-border">
		<Map bind:map {adminLevel} />
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
