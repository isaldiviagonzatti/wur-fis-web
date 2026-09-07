<!--
  Place search. Type a town or city, pick a result, and the caller decides what
  to do with the coordinates.

  Requests are debounced and the previous one is aborted, so a fast typist costs
  a handful of geocoding calls rather than one per keystroke — the free quota is
  the only thing standing between us and a bill.
-->
<script>
	import Search from '@lucide/svelte/icons/search';
	import { isGeocodingAvailable, searchPlaces } from '$lib/geocode.js';

	let { onSelect, placeholder = 'Find a place' } = $props();

	const DEBOUNCE_MS = 350;
	const MIN_QUERY_LENGTH = 3;

	let query = $state('');
	let results = $state([]);
	let open = $state(false);
	let busy = $state(false);
	let error = $state('');
	let timer;
	let controller;

	const available = isGeocodingAvailable();

	function reset() {
		results = [];
		open = false;
		error = '';
	}

	function runSearch(text) {
		controller?.abort();
		controller = new AbortController();
		busy = true;
		searchPlaces(text, controller.signal)
			.then((found) => {
				results = found;
				open = true;
				error = found.length ? '' : 'No matching place';
			})
			.catch((cause) => {
				if (cause.name === 'AbortError') return;
				error = cause.message;
				results = [];
				open = true;
			})
			.finally(() => {
				busy = false;
			});
	}

	function handleInput() {
		clearTimeout(timer);
		if (query.trim().length < MIN_QUERY_LENGTH) {
			controller?.abort();
			reset();
			return;
		}
		timer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
	}

	function choose(result) {
		query = result.name;
		reset();
		onSelect?.(result);
	}
</script>

{#if available}
	<div class="relative">
		<div class="flex items-center gap-1.5">
			<Search size={12} class="text-muted-foreground" />
			<input
				type="search"
				bind:value={query}
				oninput={handleInput}
				onfocus={() => results.length && (open = true)}
				onblur={() => setTimeout(() => (open = false), 150)}
				{placeholder}
				aria-label="Find a place"
				class="h-7 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
			/>
		</div>

		{#if open && (results.length || error)}
			<ul
				class="absolute left-0 top-8 z-50 max-h-56 w-full min-w-56 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
				style="background-color: var(--popover);"
			>
				{#if error}
					<li class="px-2 py-1.5 text-[11px] text-muted-foreground">{error}</li>
				{:else}
					{#each results as result (result.id)}
						<li>
							<button
								type="button"
								onclick={() => choose(result)}
								class="w-full cursor-pointer px-2 py-1.5 text-left text-xs hover:bg-accent"
							>
								<span class="block font-medium text-foreground">{result.name}</span>
								{#if result.context}
									<span class="block text-[10px] text-muted-foreground">{result.context}</span>
								{/if}
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		{/if}

		{#if busy}
			<span class="absolute right-1 top-1.5 text-[10px] text-muted-foreground">…</span>
		{/if}
	</div>
{/if}
