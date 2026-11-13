<!--
  SiteHeader — the brand bar at the top of every page: the service name, the
  main sections (those with several pages open a short dropdown) and the theme
  toggle. On narrow screens the sections fold into a menu. Feedback floats in
  the bottom-right corner instead (FeedbackButton).
-->
<script>
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { NavigationMenu } from 'bits-ui';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Menu from '@lucide/svelte/icons/menu';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import X from '@lucide/svelte/icons/x';
	import { SITE_NAME, SITE_NAME_LINES, SITE_NAV } from '$lib/navigation.js';
	import { theme } from '$lib/theme.svelte.js';

	let menuOpen = $state(false);

	afterNavigate(() => {
		menuOpen = false;
	});

	// Hover and focus lift the text from Mist to Ice; no box behind it.
	const sectionLinkClass =
		'inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2.5 text-sm font-medium text-brand-muted transition-colors hover:text-brand-foreground focus-visible:text-brand-foreground data-[state=open]:text-brand-foreground';
	const activeClass =
		'text-brand-foreground underline decoration-brand-accent decoration-2 underline-offset-[7px]';
	const barButtonClass =
		'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-foreground focus-visible:text-brand-foreground';

	function isActive(href) {
		const path = page.url.pathname;
		return path === href || path.startsWith(`${href}/`);
	}

	function toggleDarkMode() {
		theme.dark = !theme.dark;
		document.documentElement.classList.toggle('dark', theme.dark);
	}
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && (menuOpen = false)} />

{#snippet soon()}
	<span class="text-[11px] font-normal text-muted-foreground normal-case">Soon</span>
{/snippet}

<header
	class="site-title relative z-40 shrink-0 border-b-[3px] border-brand-accent bg-brand text-brand-foreground"
	style="height: var(--header-height);"
>
	<!-- Three columns, the outer two of equal width, so the sections sit in the
	     middle of the bar whatever the widths of the wordmark and the buttons. -->
	<div class="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-page">
		<div class="flex items-center gap-2 justify-self-start">
			<button
				class="{barButtonClass} md:hidden"
				aria-label={menuOpen ? 'Close the menu' : 'Open the menu'}
				aria-expanded={menuOpen}
				aria-controls="site-menu"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{#if menuOpen}<X size={18} />{:else}<Menu size={18} />{/if}
			</button>

			<a
				href="/"
				aria-label="{SITE_NAME}, home"
				class="flex shrink-0 flex-col text-[15px] leading-[1.15] font-semibold tracking-tight text-brand-foreground"
			>
				{#each SITE_NAME_LINES as line (line)}<span>{line}</span>{/each}
			</a>
		</div>

		<NavigationMenu.Root class="hidden md:block">
			<NavigationMenu.List class="flex items-center gap-0.5">
				{#each SITE_NAV as section (section.href)}
					{@const active = isActive(section.href)}
					<!-- Dropdowns open on click only, so passing the pointer over the bar
					     on the way to a map never drops a panel over it. -->
					<NavigationMenu.Item value={section.href} openOnHover={false} class="relative">
						{#if section.items}
							<NavigationMenu.Trigger class="group {sectionLinkClass} {active ? activeClass : ''}">
								{section.title}
								<ChevronDown
									size={14}
									class="transition-transform duration-200 group-data-[state=open]:rotate-180"
									aria-hidden="true"
								/>
							</NavigationMenu.Trigger>
							<!-- The gap from the 2rem trigger, centred in the bar, down to the
							     bar's bottom edge, so the list opens just under the bar at any height. -->
							<NavigationMenu.Content
								class="absolute top-full left-0 pt-[calc(var(--header-height)/2_-_0.875rem)]"
							>
								<ul
									class="min-w-52 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
								>
									{#each section.items as item (item.href)}
										<li>
											<NavigationMenu.Link
												href={item.href}
												active={page.url.pathname === item.href}
												class="flex items-center justify-between gap-4 rounded-sm px-2.5 py-1.5 text-sm text-foreground hover:bg-muted focus:bg-muted data-[active]:font-medium"
											>
												{item.menuTitle ?? item.title}
												{#if item.comingSoon}{@render soon()}{/if}
											</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						{:else}
							<NavigationMenu.Link
								href={section.href}
								{active}
								class="{sectionLinkClass} {active ? activeClass : ''}"
							>
								{section.title}
							</NavigationMenu.Link>
						{/if}
					</NavigationMenu.Item>
				{/each}
			</NavigationMenu.List>
		</NavigationMenu.Root>

		<div class="col-start-3 flex items-center gap-1 justify-self-end">
			<button
				class={barButtonClass}
				aria-label={theme.dark ? 'Switch to light mode' : 'Switch to dark mode'}
				title={theme.dark ? 'Light mode' : 'Dark mode'}
				onclick={toggleDarkMode}
			>
				{#if theme.dark}<Sun size={16} />{:else}<Moon size={16} />{/if}
			</button>
		</div>
	</div>

	{#if menuOpen}
		<nav
			id="site-menu"
			aria-label="Site"
			class="absolute inset-x-0 top-full border-b border-border bg-popover px-3 py-2 text-popover-foreground shadow-md md:hidden"
		>
			<ul>
				{#each SITE_NAV as section (section.href)}
					<li>
						{#if section.items}
							<span class="block px-2 pt-2 pb-1 text-sm font-medium">{section.title}</span>
							<ul class="mb-1 ml-2 border-l border-border pl-2">
								{#each section.items as item (item.href)}
									<li>
										<a
											href={item.href}
											class="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
										>
											{item.menuTitle ?? item.title}
											{#if item.comingSoon}{@render soon()}{/if}
										</a>
									</li>
								{/each}
							</ul>
						{:else}
							<a
								href={section.href}
								class="block rounded-sm px-2 py-2 text-sm font-medium hover:bg-muted"
								aria-current={isActive(section.href) ? 'page' : undefined}
							>
								{section.title}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</header>
