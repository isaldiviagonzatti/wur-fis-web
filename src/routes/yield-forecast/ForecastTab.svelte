<!--
  ForecastTab — map, controls bar, and density chart panel.
-->
<script>
	import Gauge from '@lucide/svelte/icons/gauge';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import Map from '$lib/components/Map.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import {
		COUNTRY_OPTIONS,
		COUNTRY_VIEWS,
		OBSERVED_BOUNDARY_OPTIONS,
		OBSERVED_CROP_OPTIONS
	} from '$lib/data-config.js';

	let {
		crop = $bindable(),
		country = $bindable(),
		adminLevel = $bindable(),
		skillOverlay = $bindable()
	} = $props();

	let map = $state(null);
	let previousCountry = '';

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
		if (!map || !country || country === previousCountry) return;
		const mapInstance = map;

		const targetView = COUNTRY_VIEWS[country];
		if (!targetView) return;

		previousCountry = country;

		const fly = () => {
			mapInstance.flyTo({
				center: targetView.center,
				zoom: targetView.zoom,
				duration: 900,
				essential: true
			});
		};

		if (!mapInstance.isStyleLoaded()) {
			mapInstance.once('load', fly);
			return;
		}

		fly();
	});
</script>

<div class="shrink-0 overflow-x-auto overflow-y-hidden px-4 py-1.5">
	<div class="flex min-w-max items-center gap-2">
		<LabeledSelect
			label="Country"
			bind:value={country}
			options={COUNTRY_OPTIONS}
			placeholder="Zoom to country"
			widthClass="w-32"
		/>

		<Separator orientation="vertical" class="h-4" />

		<LabeledSelect
			label="Crop"
			bind:value={crop}
			options={OBSERVED_CROP_OPTIONS}
			placeholder="Select crop"
			widthClass="w-28"
		/>

		<LabeledSelect
			label="Boundary"
			bind:value={adminLevel}
			options={OBSERVED_BOUNDARY_OPTIONS}
			placeholder="Select boundary"
			widthClass="w-28"
		/>

		<Separator orientation="vertical" class="h-4" />

		<button
			onclick={() => (skillOverlay = !skillOverlay)}
			class={[
				'cursor-pointer flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors',
				skillOverlay
					? 'border-primary bg-primary text-primary-foreground'
					: 'border-border text-muted-foreground hover:bg-accent'
			]}
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
		<Map bind:map adminLevel={adminLevel} />
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
