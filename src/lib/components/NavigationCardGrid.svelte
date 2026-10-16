<!--
  NavigationCardGrid — reusable linked card grid for route landing pages.
  An item marked `comingSoon` shows a badge and no link, so an unfinished
  section cannot be opened.
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

	let { items = [] } = $props();
</script>

<div class="grid gap-5 sm:grid-cols-2">
	{#each items as item (item.href)}
		<Card>
			<CardHeader>
				<CardTitle>
					{#if item.comingSoon}
						<span class="flex flex-wrap items-center gap-2">
							{item.title}
							<Badge variant="outline">Coming soon</Badge>
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
