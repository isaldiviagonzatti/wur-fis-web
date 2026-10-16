<!--
  Yield Forecast overview — what the forecast is before the map, and the two
  ways in: the forecast itself, or the guide first. The sidebar's Yield Forecast
  link leads back here.
-->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import { COUNTRY_OPTIONS } from '$lib/domain-options.js';

	const FORECAST_PATH = '/yield-forecast/forecast';
	const countries = new Intl.ListFormat('en', { type: 'conjunction' }).format(
		COUNTRY_OPTIONS.map(({ label }) => label)
	);

	// Links shared before the forecast moved to its own page carry ?run=; they
	// meant the forecast, not this overview.
	onMount(() => {
		if (new URL(window.location.href).searchParams.has('run')) {
			goto(`${FORECAST_PATH}${window.location.search}`, { replaceState: true });
		}
	});
</script>

<div class="mx-auto max-w-3xl space-y-8 px-4 py-8">
	<div class="space-y-3">
		<h1 class="text-2xl font-semibold tracking-tight text-foreground">Seasonal yield forecast</h1>
		<p class="text-base leading-relaxed text-muted-foreground">
			Will this season's harvest be better or worse than usual? This tool forecasts crop yields for
			the growing season under way in {countries}, updated monthly.
		</p>
	</div>

	<section class="space-y-3 text-base leading-relaxed text-muted-foreground">
		<h2 class="text-lg font-semibold text-foreground">What you will see</h2>
		<p>
			A map shows where the yield of a crop is expected to be below, near or above normal for each
			place. Click any place to see how the season has gone so far according to observed weather,
			and the range of possible yields at harvest.
		</p>
	</section>

	<div class="flex flex-wrap justify-center gap-3">
		<a
			href={FORECAST_PATH}
			class="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
		>
			<TrendingUp size={16} />
			Open the forecast
		</a>
		<a
			href={`${FORECAST_PATH}?tab=guide`}
			class="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
		>
			<BookOpen size={16} />
			Read the user guide
		</a>
		<a
			href={`${FORECAST_PATH}?tab=methodology`}
			class="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
		>
			<FlaskConical size={16} />
			Methodology
		</a>
	</div>
</div>
