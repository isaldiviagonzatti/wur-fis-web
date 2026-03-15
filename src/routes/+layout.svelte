<script>
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { Tooltip } from 'bits-ui';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Gitlab from '@lucide/svelte/icons/gitlab';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import SquaresIntersect from '@lucide/svelte/icons/squares-intersect';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Layers from '@lucide/svelte/icons/layers';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	let { children } = $props();

	let dark = $state(false);
	let collapsed = $state(true);
	let collapseTimer;
	const AUTO_COLLAPSE_DELAY_MS = 400;

	function applyDarkMode(value) {
		document.documentElement.classList.toggle('dark', value);
	}

	function toggleDarkMode() {
		dark = !dark;
		applyDarkMode(dark);
	}

	afterNavigate(({ to }) => {
		const path = to?.url.pathname;
		if (!path || path === '/') return;
		clearTimeout(collapseTimer);
		collapseTimer = setTimeout(() => {
			collapsed = true;
		}, AUTO_COLLAPSE_DELAY_MS);
	});

	onMount(() => {
		applyDarkMode(dark);
		return () => clearTimeout(collapseTimer);
	});

	const navItems = [
		{ href: '/yield-forecast', label: 'Yield Forecast', icon: TrendingUp },
		{ href: '/foodshed', label: 'Foodshed Scenarios', icon: SquaresIntersect },
		{ href: '/data-explorer', label: 'Data Explorer', icon: Layers },
		{ href: '/methodology', label: 'Methodology', icon: BookOpen }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
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
<div class="app-shell flex overflow-hidden bg-background text-foreground">
	<!-- Left sidebar -->
	<aside
		class="flex flex-col text-foreground transition-all duration-200 {collapsed
			? 'w-14'
			: 'w-50'}"
	>
		<!-- Logo / title -->
			<div style="height: 3rem; display: flex; align-items: center; justify-content: {collapsed ? 'center' : 'flex-start'}; padding: 0 1rem; overflow: hidden;">
				{#if collapsed}
					<a href="/" class="text-sm font-semibold leading-tight transition-colors {page.url.pathname === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}" style="opacity: 1; transition: opacity 150ms ease;">FIS</a>
				{:else}
					<a href="/" class="text-sm font-semibold leading-tight transition-colors {page.url.pathname === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}" style="opacity: 0; animation: fadeIn 180ms ease 150ms forwards;">Foodshed Information Service</a>
				{/if}
			</div>

		<!-- Nav links -->
		<nav class="flex flex-col gap-0.5 p-2 flex-1">
			{#each navItems as item (item.href)}
				{@const active = page.url.pathname.startsWith(item.href)}
				<Tooltip.Root>
					<Tooltip.Trigger asChild>
						{#snippet child({ props })}
								<a
									href={item.href}
									title={item.label}
									{...props}
									class="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors {collapsed
										? 'justify-center'
									: ''} {active
									? 'text-foreground font-medium'
									: 'text-muted-foreground hover:text-foreground'}"
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
		<div class="safe-bottom flex flex-col gap-0.5 p-2">
			<!-- Dark mode toggle -->
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					{#snippet child({ props })}
								<button
									{...props}
									onclick={toggleDarkMode}
									class="cursor-pointer flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors text-muted-foreground hover:text-foreground {collapsed
										? 'justify-center'
										: ''}"
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
								class="cursor-pointer flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors text-muted-foreground hover:text-foreground {collapsed
									? 'justify-center'
									: ''}"
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
			<div class="flex min-h-full flex-col">
				<div class="flex-1">
					{@render children()}
				</div>

				<!-- Footer -->
				<footer class="safe-bottom mt-4 px-3 py-2 sm:px-6">
					<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
						<!-- Logos -->
						<div class="flex items-center gap-3 sm:gap-6">
							<a href="https://www.wur.nl" target="_blank" rel="noopener" class="shrink-0">
								<img
									src="/wur-logo.svg"
									alt="Wageningen University & Research"
									class="h-6 w-auto shrink-0 sm:h-7"
								/>
							</a>
							<a href="https://www.safe4allafrica.eu/" target="_blank" rel="noopener" class="shrink-0">
								<img
									src="/safe4all-logo-vertical.svg"
									alt="SAFE4ALL"
									class="h-7 w-auto shrink-0 sm:h-8"
								/>
							</a>
						</div>

						<!-- Contact + GitLab -->
						<div class="flex min-w-0 items-center gap-3 sm:gap-4">
							<p class="min-w-0 text-[10px] leading-tight text-muted-foreground sm:text-xs">
								Contact:
								<a
									href="mailto:ignacio.saldiviagonzatti@wur.nl"
									class="break-all underline underline-offset-2"
								>
									ignacio.saldiviagonzatti@wur.nl
								</a>
							</p>
							<a
								href="https://git.wur.nl/phd-isaldiviagonzatti/fis-web"
								target="_blank"
								rel="noopener"
								title="GitLab repository"
								class="text-muted-foreground hover:text-foreground transition-colors"
							>
								<Gitlab class="h-4 w-4 sm:h-5 sm:w-5" />
							</a>
						</div>
					</div>
				</footer>
			</div>
		</main>
	</div>
</div>
</Tooltip.Provider>
