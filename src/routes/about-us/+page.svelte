<!--
  About Us page — team and contact information for the site.
-->
<script>
	import { Separator } from '$lib/components/ui/separator';
	import PageIntro from '$lib/components/PageIntro.svelte';
	import PartnerLogos from '$lib/components/PartnerLogos.svelte';
	import { SITE_NAME } from '$lib/navigation.js';
</script>

<div class="mx-auto max-w-3xl px-6 py-10">
	<PageIntro title="About Us" class="mb-8">
		<p class="max-w-3xl text-base leading-relaxed text-muted-foreground">
			<span class="font-medium text-foreground">{SITE_NAME}</span> is developed at
			<a href="https://www.wur.nl" class="underline underline-offset-2 hover:text-foreground transition-colors">Wageningen University &amp; Research</a>
			as part of the EU Horizon Europe
			<a href="https://www.safe4allafrica.eu/" class="underline underline-offset-2 hover:text-foreground transition-colors">SAFE4ALL</a>
			project (grant No. 101137814).
		</p>
	</PageIntro>

	<Separator class="mb-8" />

	<div class="flex flex-col gap-8">
		<!-- Team -->
		<section>
			<h3 class="text-lg font-semibold mb-4">Team</h3>
			<div class="flex flex-col gap-4">
				<div>
					<p class="text-sm font-medium">
						<a href="https://www.wur.nl/en/persons/li-ignacio-saldivia-gonzatti-msc" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-foreground transition-colors">Ignacio Saldivia Gonzatti</a>
					</p>
					<p class="text-sm text-muted-foreground">Wageningen University &amp; Research</p>
				</div>
				<div>
					<p class="text-sm font-medium">
						<a href="https://www.wur.nl/en/persons/dr-s-spyros-paparrizos" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-foreground transition-colors">Spyros Paparrizos</a>
					</p>
					<p class="text-sm text-muted-foreground">Wageningen University &amp; Research</p>
				</div>
				<div>
					<p class="text-sm font-medium">
						<a href="https://www.wur.nl/nl/personen/profdr-h-hester-biemans" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-foreground transition-colors">Hester Biemans</a>
					</p>
					<p class="text-sm text-muted-foreground">Wageningen University &amp; Research</p>
				</div>
			</div>
		</section>

		<Separator />

		<!-- Project -->
		<section>
			<h3 class="text-lg font-semibold mb-4">Project</h3>
			<p class="text-sm text-muted-foreground leading-relaxed">
				SAFE4ALL (Safeguarding African Foodsheds and Ecosystems for all Actors across Local,
				regional and international Levels to manage migration) is a Horizon Europe project
				funded under grant agreement No. 101137814. It addresses food security, climate change,
				and migration in Sub-Saharan Africa through user-centred climate services co-developed
				with communities, municipalities, and national partners in Ghana, Kenya, and Zimbabwe.
			</p>
		</section>

		<Separator />

		<!-- Partners -->
		<section>
			<h3 class="text-lg font-semibold mb-4">Partners and funding</h3>
			<PartnerLogos class="border border-border" />
		</section>

		<Separator />

		<!-- Contact -->
		<section>
			<h3 class="text-lg font-semibold mb-4">Contact</h3>
			<p class="text-sm text-muted-foreground">
				For questions about the dashboard, data, or methodology, reach out at
				<a href="mailto:ignacio.saldiviagonzatti@wur.nl" class="underline underline-offset-2 hover:text-foreground transition-colors">
					ignacio.saldiviagonzatti@wur.nl
				</a>.
			</p>
		</section>
	</div>
</div>
