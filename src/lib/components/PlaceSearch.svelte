<!--
  Place search. Type a town or city, pick a result, and the caller decides what
  to do with the coordinates.

  Requests are debounced and the previous one is aborted, so a fast typist costs
  a handful of geocoding calls rather than one per keystroke — the free quota is
  the only thing standing between us and a bill.
-->
<script>
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import { isGeocodingAvailable, searchPlaces } from '$lib/geocode.js';

	let { onSelect, placeholder = 'Find a place', query = $bindable('') } = $props();

	const DEBOUNCE_MS = 350;
	const MIN_QUERY_LENGTH = 3;

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

	function clearQuery() {
		clearTimeout(timer);
		controller?.abort();
		query = '';
		reset();
	}

	function choose(result) {
		query = result.name;
		reset();
		onSelect?.(result);
	}
</script>

{#if available}
	<div class="relative">
		<div class="relative flex items-center gap-1.5">
			<Search size={14} class="shrink-0 text-muted-foreground" />
			<!-- type="text": the browser's own search clear button ignores the theme. -->
			<input
				type="text"
				role="searchbox"
				bind:value={query}
				oninput={handleInput}
				onfocus={() => results.length && (open = true)}
				onblur={() => setTimeout(() => (open = false), 150)}
				{placeholder}
				aria-label="Find a place"
				class="h-8 w-full rounded-md border border-border bg-background pr-7 pl-2 text-sm outline-none focus:border-primary"
			/>
			{#if query && !busy}
				<button
					type="button"
					onclick={clearQuery}
					aria-label="Clear search"
					class="absolute right-1.5 cursor-pointer rounded-sm p-0.5 text-foreground/70 hover:text-foreground"
				>
					<X size={14} />
				</button>
			{/if}
		</div>

		{#if open && (results.length || error)}
			<ul
				class="absolute left-0 top-full z-50 mt-1 max-h-56 w-full min-w-56 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
				style="background-color: var(--popover);"
			>
				{#if error}
					<li class="px-2 py-1.5 text-xs text-muted-foreground">{error}</li>
				{:else}
					{#each results as result (result.id)}
						<li>
							<button
								type="button"
								onclick={() => choose(result)}
								class="w-full cursor-pointer px-2 py-1.5 text-left text-sm hover:bg-accent"
							>
								<span class="block font-medium text-foreground">{result.name}</span>
								{#if result.context}
									<span class="block text-xs text-muted-foreground">{result.context}</span>
								{/if}
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		{/if}

		{#if busy}
			<span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">…</span>
		{/if}
	</div>
{/if}
