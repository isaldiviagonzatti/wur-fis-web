<!--
  MethodologyTab — the scientific method behind the forecasts shown on this
  site, written for readers who do not know the code. Describes the service as
  it runs; the published article is listed at the end.
-->
<script>
	const PAPER_URL = 'https://doi.org/10.1088/1748-9326/aea797';

	// The crops with a forecast in at least one month, by country.
	const cropsByCountry = [
		['Ghana', 'Maize, rice, sorghum, millet, groundnuts, soybean, beans, other pulses, yams and taro'],
		[
			'Kenya',
			'Maize, beans and sorghum (each in two seasons), pigeon peas, other pulses, millet, wheat and potatoes'
		],
		[
			'Zimbabwe',
			'Maize, sorghum, millet, groundnuts, cotton, soybean, sunflower, beans, other pulses, wheat and sweet potatoes'
		]
	];

	const dataSources = [
		['Seasonal weather forecasts', 'ECMWF SEAS5'],
		['Observed weather', 'ERA5-Land reanalysis'],
		['Sowing and harvest dates', 'FAO crop calendars by agro-ecological zone, validated by local experts'],
		['Crop areas', 'SPAM 2017'],
		['Soil', 'USDA-NRCS soil texture; ISIMIP3a topsoil pH'],
		['Nitrogen deposition', 'ISIMIP3b'],
		['Atmospheric CO2', 'NOAA/EPA observational records'],
		['Lakes', 'Global Lakes and Wetlands Database'],
		['Administrative boundaries', 'GADM v4.1']
	];
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<section class="space-y-3 text-sm text-muted-foreground">
		<p>
			Each month, a crop model is run with the latest seasonal weather forecasts to estimate how
			this season's yields will compare with a normal year, and with observed weather to show how
			the season has gone so far. This page describes how the forecasts on this site are made. It
			is updated as the service develops.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">How a forecast is made</h2>
		<p>
			Up to the start of the forecast, the crop model is driven by observed weather from ERA5-Land.
			From then on it is driven by the ECMWF SEAS5 seasonal forecast, which looks seven months
			ahead. SEAS5 is first corrected for its systematic errors and brought to the model's grid of
			about 11 km, so that its weather matches what is typically observed in each place.
		</p>
		<p>
			SEAS5 provides 51 equally likely versions of the coming months, and the crop model is run
			with each. The 51 resulting yields at harvest form the forecast, and how widely they spread
			shows how certain it is.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">The crop model</h2>
		<p>
			LPJmL simulates crop growth day by day from weather, soil and atmospheric CO2, for rainfed
			crops. Nutrients are assumed not to limit growth, so differences between years reflect the
			weather. Each crop matures once it has received a set amount of warmth, derived from recent
			temperatures over its usual growing period.
		</p>
		<p>
			The model is not calibrated to reported yields. Yields are therefore shown relative to the
			model's own normal, never in tonnes per hectare.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Crops and growing seasons</h2>
		<p>
			The crops covered make up at least 1% of a country's harvested area, and are shown where at
			least 10 hectares are grown. Sowing and harvest dates come from FAO crop calendars by
			agro-ecological zone, checked with farmers and extension officers in each country. Crops grown
			twice a year are modelled as two seasons where subnational statistics report both; elsewhere
			only the main season is modelled.
		</p>
		<dl class="space-y-1.5">
			{#each cropsByCountry as [country, crops] (country)}
				<div class="grid gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
					<dt class="font-medium text-foreground">{country}</dt>
					<dd>{crops}</dd>
				</div>
			{/each}
		</dl>
		<p>
			On the map, wheat appears as temperate cereals, potatoes as temperate roots, and other pulses
			such as cowpeas and Bambara beans as pulses. Not every crop has a forecast every month, since
			that depends on its growing season and on how skilful the forecast is at that time of year.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">What "normal" means</h2>
		<p>
			Normal is what the same model simulates with observed weather over 1994-2023. Where yields
			show a long-term trend, for example from rising CO2, past years are adjusted to today's level
			so that they are compared fairly with this season.
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">How skill is measured</h2>
		<p>
			The forecast was re-run for every month of 1994-2023 as if issued at the time, and compared
			with the yields simulated with observed weather. This shows how well it predicts the model's
			yields, not reported yields.
		</p>
		<p>
			Skill is measured with the fair continuous ranked probability skill score (CRPSS). It tells
			how much closer the forecast came than simply expecting a repeat of the previous five seasons.
			Only places where the forecast did better are shown. Skill is generally weak around sowing and
			grows as the season advances (Saldivia Gonzatti et al., 2026).
		</p>
	</section>

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Limitations</h2>
		<p>
			Only rainfed production is simulated, and only annual crops are covered. Perennial and
			multi-year crops such as sugarcane and cassava are not, and some important crops such as
			cocoa, tea and tobacco cannot be represented by the model. Sowing dates are fixed for each
			agro-ecological zone and do not follow how farmers adapt to the season. Where crops grow
			relies on a single crop map (SPAM 2017).
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

	<section class="space-y-3 text-sm text-muted-foreground">
		<h2 class="text-base font-semibold text-foreground">Reference</h2>
		<p>The forecasting approach and its skill over 1994-2023 are published in:</p>
		<p>
			Saldivia Gonzatti, I., Siderius, C., Paparrizos, S. and Biemans, H. (2026). Process-based
			seasonal crop yield forecasting for early warning in sub-Saharan Africa. <em
				>Environmental Research Letters</em
			>, 21(18), 184030.
			<a
				href={PAPER_URL}
				target="_blank"
				rel="noopener"
				class="font-medium text-foreground underline underline-offset-2 hover:no-underline"
				>doi:10.1088/1748-9326/aea797</a
			>
		</p>
	</section>
</div>
