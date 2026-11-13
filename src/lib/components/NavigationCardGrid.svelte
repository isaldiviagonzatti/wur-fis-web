<!--
  NavigationCardGrid — reusable linked card grid for route landing pages.
  An item marked `comingSoon` shows a badge and no link, so an unfinished
  section cannot be opened. On wide screens the `feature` item takes a fourth
  column of its own, spanning the two rows of three that the other six fill;
  elsewhere it keeps its place in `items`.
-->
<script>
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	let { items = [], feature = null } = $props();
</script>

<div class={['grid gap-5 sm:grid-cols-2', feature && 'xl:grid-cols-4']}>
	{#each items as item (item.href)}
		<!-- Set off by a shade, not a frame line. -->
		<Card
			class={[
				'rounded-md border-0 bg-surface-tint',
				item === feature && 'xl:col-start-4 xl:row-span-2 xl:row-start-1'
			]}
		>
			<CardHeader>
				<CardTitle class="site-title">
					{#if item.comingSoon}
						<span class="flex flex-wrap items-center gap-2">
							{item.title}
							<Badge variant="outline" class="normal-case">Coming soon</Badge>
						</span>
					{:else}
						<a href={item.href} class="underline underline-offset-4 hover:text-muted-foreground">
							{item.title}
						</a>
					{/if}
				</CardTitle>
				{#if item.subtitle}
					<CardDescription>{item.subtitle}</CardDescription>
				{/if}
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">{item.description}</p>
			</CardContent>
		</Card>
	{/each}
</div>
