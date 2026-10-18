<!--
  MethodologyTab — where the crop yield history comes from and how the
  comparison between model and statistics is made, for readers who do not know
  the code. The crop list is read from the published catalog, so it always
  matches the data.
-->
<script>
	import { browser } from '$app/environment';
	import { COUNTRY_LABELS } from '$lib/domain-options.js';
	import {
		CAUTION_AGREEMENT_YEARS,
		MIN_AGREEMENT_YEARS,
		MIN_COUNTRY_COVERAGE,
		loadCatalog
	} from '$lib/crop-yields.js';
	import { formatCropLabel } from '$lib/yield-forecast.js';

	const catalogRequest = browser ? loadCatalog() : null;

	/** Annual crops only: seasons repeat the crop they belong to. */
	function cropList(entry) {
		return entry.crops
			.filter(({ id }) => !/_[12]$/.test(id))
			.map(({ label }) => formatCropLabel(label))
			.join(', ');
	}

	const dataSources = [
		['Subnational statistics', 'HarvestStat Africa v1.0 (regions, provinces and counties)'],
		['National statistics', 'FAOSTAT crop production'],
		['Observed weather', 'ERA5-Land reanalysis'],
		['Crop areas', 'SPAM 2017'],
		['Sowing and harvest dates', 'FAO crop calendars by agro-ecological zone'],
		['Administrative boundaries', 'GADM v4.1']
	];
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<section class="space-y-3 text-sm text-muted-foreground">
		<p>
			This page sets reported crop statistics since 1994 next to the LPJmL crop model, run with
			observed weather. It shows what the statistics say about
			each year, and how well the model captures which years were good or bad. This page describes
			where the data come from and how the comparison is made.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Reported statistics</h2>
		<p>
			Regional figures come from HarvestStat Africa, which compiles official subnational crop
			statistics. National figures come from FAOSTAT. Both report harvested area and production;
			yield is production divided by area. Statistics for several crops are summed into the model's
			crop groups, for example cowpeas and other dry pulses into pulses; the panel lists what a
			group contains.
		</p>
		<p>
			In Kenya, maize, beans and sorghum are reported for the long and short rains separately. These
			appear as first and second season, and the whole-year figure adds them up, but only in years
			in which every season was reported.
		</p>
		<p>
			National totals from HarvestStat add up the regions reporting that year. They are shown only
			for years in which those regions hold at least {Math.round(100 * MIN_COUNTRY_COVERAGE)}% of the
			crop's harvested area in the SPAM 2017 crop map, so a year reported by a few regions is not
			read as a national figure. Weighting regions by the crop's area rather than by their land area
			matters. For example, in Kenya the five largest counties cover almost half of the country but grow under 1%
			of its maize.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Cleaning the statistics</h2>
		<p>
			Values flagged as outliers by HarvestStat are removed first. Each remaining yield series, one
			per crop, area and season, is then checked for years far above the series' usual level that
			also stand well above the years before or after, and for isolated spikes that are not seen
			for the same crop anywhere else in the country.
			Finally, yields beyond what a crop plausibly reaches are left out.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">The crop model</h2>
		<p>
			LPJmL simulates crop growth day by day from weather, soil and atmospheric CO2, for rainfed
			crops, on a grid of about 11 km. Here it is driven by observed weather from ERA5-Land. The crop
			map is fixed at SPAM 2017 in every year, so changes over time come from weather, CO2 and
			nitrogen deposition only.
		</p>
		<p>
			The model is not calibrated to reported yields, so its yields are never shown in tonnes per
			hectare. For an area, the model's production is summed over the area's crop land and divided
			by its crop area. Areas where the model grows less than 500 hectares of a crop have no model
			values.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Crops</h2>
		<p>Every crop the model grows in a country is included:</p>
		{#await catalogRequest then catalog}
			{#if catalog}
				<dl class="space-y-1.5">
					{#each Object.entries(catalog.countries) as [country, entry] (country)}
						<div class="grid gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
							<dt class="font-medium text-foreground">{COUNTRY_LABELS[country] ?? country}</dt>
							<dd>{cropList(entry)}</dd>
						</div>
					{/each}
				</dl>
			{/if}
		{:catch}
			<p>The crop list could not be loaded.</p>
		{/await}
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">From yields to anomalies</h2>
		<p>
			Reported yields rise and fall for reasons the model does not represent, such as new varieties,
			more fertiliser or changes in where a crop is grown. These act slowly, so each series has its
			long-term trend removed first: a straight line or a gentle curve (a second-order polynomial),
			whichever fits significantly better, or simply the average when neither does. What remains is
			divided by its own standard deviation, so it is measured in typical year-to-year swings.
		</p>
		<p>
			The model can have a trend too, even with its crop map and management fixed: rising CO2 makes
			crops grow more, nitrogen deposition changes, and the climate itself has warmed and shifted
			over the period. In the statistics, these slow changes are mixed with new varieties and
			fertiliser and cannot be told apart. Model and statistics are therefore treated the same way,
			each against its own trend, so the comparison rests on which years were good or bad.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Agreement</h2>
		<p>
			Agreement is the Pearson correlation between the model's and the statistics' anomalies over the
			years both have. It is computed only with at least {MIN_AGREEMENT_YEARS} shared years, and is
			marked to read with caution below {CAUTION_AGREEMENT_YEARS}. For a grid cell, which has no
			statistics of its own, the cell is compared with the region it lies in.
		</p>
		<p>
			As a check that the results do not hinge on how trends are removed, the comparison was repeated
			on year-to-year changes in yield, which need no trend at all. Both give a similar picture.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Limitations</h2>
		<p>
			Only rainfed production is simulated, while the statistics include irrigated fields, which
			matters most for rice and sugarcane. Cassava and sugarcane are harvested over more than one
			year in practice but simulated as seasonal crops. The model's crop map does not change over time.
			Reported statistics differ in quality between countries and years, and regions report some
			years and not others, so a short record can show strong agreement or disagreement by chance.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Data sources</h2>
		<dl class="space-y-1.5">
			{#each dataSources as [name, source] (name)}
				<div class="grid gap-x-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
					<dt class="font-medium text-foreground">{name}</dt>
					<dd>{source}</dd>
				</div>
			{/each}
		</dl>
	</section>
</div>
