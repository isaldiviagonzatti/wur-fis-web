<!--
  NavigationCardGrid — reusable linked card grid for route landing pages.
-->
<script>
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
					<a href={item.href} class="underline underline-offset-4 hover:text-muted-foreground">
						{item.title}
					</a>
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
