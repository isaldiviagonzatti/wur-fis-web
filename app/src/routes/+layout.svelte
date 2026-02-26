<script>
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { page } from '$app/stores';
	import { Tooltip } from 'bits-ui';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Gitlab from '@lucide/svelte/icons/gitlab';
	import Map from '@lucide/svelte/icons/map';
	import Layers from '@lucide/svelte/icons/layers';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	let { children } = $props();

	let dark = $state(true);
	let collapsed = $state(false);

	$effect(() => {
		document.documentElement.classList.toggle('dark', dark);
	});

	const navItems = [
		{ href: '/', label: 'About', icon: CircleDot },
		{ href: '/yield-forecast', label: 'Yield Forecast', icon: Map },
		{ href: '/foodshed', label: 'Foodshed Scenarios', icon: Layers },
		{ href: '/methodology', label: 'Methodology', icon: BookOpen }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#snippet tooltipContent(label)}
	<Tooltip.Content
		sideOffset={8}
		side="right"
		class="bg-popover text-popover-foreground rounded-md border px-2.5 py-1 text-xs font-medium shadow-md"
	>
		{label}
	</Tooltip.Content>
{/snippet}

<Tooltip.Provider delayDuration={300}>
<div class="flex h-screen overflow-hidden bg-background text-foreground">
	<!-- Left sidebar -->
	<aside
		class="flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 {collapsed
			? 'w-14'
			: 'w-52'}"
	>
		<!-- Logo / title -->
		<div style="height: 3rem; display: flex; align-items: center; padding: 0 1rem; border-bottom: 1px solid var(--border);">
			{#if !collapsed}
				<span class="text-sm font-semibold leading-tight">Foodshed Information Service</span>
			{:else}
				<span class="text-sm font-semibold leading-tight">FIS</span>
			{/if}
		</div>

		<!-- Nav links -->
		<nav class="flex flex-col gap-1 p-2 flex-1">
			{#each navItems as item}
				{@const active =
					item.href === '/'
						? $page.url.pathname === '/'
						: $page.url.pathname.startsWith(item.href)}
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						{#snippet child({ props })}
							<a
								href={item.href}
								{...props}
								class="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground {active
									? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
									: 'text-sidebar-foreground'}"
							>
								<item.icon size={16} class="shrink-0" />
								{#if !collapsed}
									<span class="truncate">{item.label}</span>
								{/if}
							</a>
						{/snippet}
					</Tooltip.Trigger>
					{#if collapsed}
						{@render tooltipContent(item.label)}
					{/if}
				</Tooltip.Root>
			{/each}
		</nav>

		<!-- Bottom controls -->
		<div class="flex flex-col gap-1 border-t border-border p-2">
			<!-- Dark mode toggle -->
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					{#snippet child({ props })}
						<button
							{...props}
							onclick={() => (dark = !dark)}
							class="cursor-pointer flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							{#if dark}
								<Sun size={16} class="shrink-0" />
							{:else}
								<Moon size={16} class="shrink-0" />
							{/if}
							{#if !collapsed}
								<span>{dark ? 'Light mode' : 'Dark mode'}</span>
							{/if}
						</button>
					{/snippet}
				</Tooltip.Trigger>
				{#if collapsed}
					{@render tooltipContent(dark ? 'Light mode' : 'Dark mode')}
				{/if}
			</Tooltip.Root>
			<!-- Collapse toggle -->
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					{#snippet child({ props })}
						<button
							{...props}
							onclick={() => (collapsed = !collapsed)}
							class="cursor-pointer flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							<ChevronLeft size={16} class="shrink-0 transition-transform {collapsed ? 'rotate-180' : ''}" />
							{#if !collapsed}
								<span>Collapse</span>
							{/if}
						</button>
					{/snippet}
				</Tooltip.Trigger>
				{#if collapsed}
					{@render tooltipContent('Expand sidebar')}
				{/if}
			</Tooltip.Root>
		</div>
	</aside>

	<!-- Main area -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Page content -->
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>

		<!-- Footer -->
		<footer class="shrink-0 border-t border-border bg-muted/40 px-6 py-2">
			<div class="flex items-center justify-between gap-4">
				<!-- Logos -->
				<div class="flex items-center gap-6">
					<a href="https://www.wur.nl" target="_blank" rel="noopener">
						<img src="/wur-logo.svg" alt="Wageningen University & Research" class="h-7 w-auto" />
					</a>
					<a href="https://www.safe4allafrica.eu/" target="_blank" rel="noopener">
						<img src="/safe4all-logo-vertical.svg" alt="SAFE4ALL" class="h-7 w-auto" />
					</a>
				</div>

				<!-- Contact + GitHub -->
				<div class="flex items-center gap-4">
					<p class="text-xs text-muted-foreground">
						Contact: <a href="mailto:fis@wur.nl" class="underline underline-offset-2">fis@wur.nl</a>
					</p>
					<a
						href="https://github.com/your-org/fis-web"
						target="_blank"
						rel="noopener"
						title="GitLab repository"
						class="text-muted-foreground hover:text-foreground transition-colors"
					>
						<Gitlab size={16} />
					</a>
				</div>
			</div>
		</footer>
	</div>
</div>
</Tooltip.Provider>
