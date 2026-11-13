<!--
  Foodshed Planner — a board on which planners lay out which parts of the food
  system they want to analyse and with which methods, indicators and data,
  drawing on the foodshed review. The plan autosaves in the browser and can be
  saved as a file, or exported as PNG and CSV.
-->
<script>
	import { onMount } from 'svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import PageIntro from '$lib/components/PageIntro.svelte';
	import DetailPanel from '$lib/components/planner/DetailPanel.svelte';
	import LibraryPanel from '$lib/components/planner/LibraryPanel.svelte';
	import PlannerBoard from '$lib/components/planner/PlannerBoard.svelte';
	import PlannerToolbar from '$lib/components/planner/PlannerToolbar.svelte';
	import { CARD_SIZE, NOTE_SIZE } from '$lib/planner/board-layout.js';
	import { NOTE_REF } from '$lib/planner/card-kinds.js';
	import { PAGES, SITE_NAME } from '$lib/navigation.js';
	import { loadPlannerContent } from '$lib/planner/planner-data.js';
	import {
		canStorePlans,
		cardNode,
		emptyPlan,
		freeDockPosition,
		fromPlan,
		isLinked,
		linkEdge,
		loadStoredPlan,
		noteNode,
		scopeOf,
		storePlan,
		toPlan
	} from '$lib/planner/plan-state.js';
	import {
		downloadPlanCsv,
		downloadPlanFile,
		readPlanFile
	} from '$lib/planner/plan-export.js';

	let content = $state.raw(null);
	let loadError = $state('');
	let message = $state('');
	let title = $state('');
	let nodes = $state.raw([]);
	let edges = $state.raw([]);
	let selected = $state(null);
	let stored = $state(true);
	let board = $state();
	let libraryOpen = $state(true);
	let detailOpen = $state(true);

	onMount(async () => {
		stored = canStorePlans();
		try {
			content = await loadPlannerContent();
		} catch (error) {
			loadError = error.message;
			return;
		}
		let plan = emptyPlan(content);
		const saved = loadStoredPlan();
		if (saved) {
			try {
				plan = fromPlan(saved, content);
			} catch {
				message = 'The plan saved in this browser could not be restored.';
			}
		}
		({ title, nodes, edges } = plan);
	});

	// Autosave to the browser once the board has been still for a moment, so
	// dragging a card does not write to storage on every frame.
	$effect(() => {
		if (!content) return;
		const plan = toPlan({ title, nodes, edges });
		const timer = setTimeout(() => storePlan(plan), 400);
		return () => clearTimeout(timer);
	});

	const scope = $derived(scopeOf(nodes));
	const placedRefs = $derived(
		new Set(nodes.filter((node) => node.type === 'card').map((node) => node.data.ref))
	);
	const cardCount = $derived(nodes.filter((node) => node.type !== 'element').length);

	const view = $derived.by(() => {
		if (!content || !selected) return null;
		if (selected.type === 'ref') {
			const card = content.cardsById.get(selected.id);
			return card ? { type: 'card', card, node: null } : null;
		}
		const node = nodes.find((n) => n.id === selected.id);
		if (!node) return null;
		if (node.type === 'element') {
			return { type: 'element', element: content.elementsById.get(node.id), node };
		}
		if (node.type === 'card') {
			return { type: 'card', card: content.cardsById.get(node.data.ref), node };
		}
		return { type: 'note', node };
	});

	function selectNode(id) {
		selected = id ? { type: 'node', id } : null;
		if (id) detailOpen = true;
		nodes = nodes.map((node) =>
			node.selected === (node.id === id) ? node : { ...node, selected: node.id === id }
		);
	}

	function preview(ref) {
		selected = { type: 'ref', id: ref };
		detailOpen = true;
	}

	function updateNode(id, update) {
		nodes = nodes.map((node) => (node.id === id ? update(node) : node));
	}

	function link(sourceId, elementId) {
		if (!isLinked(edges, sourceId, elementId)) edges = [...edges, linkEdge(sourceId, elementId)];
	}

	function place(node, elementId, { select = false } = {}) {
		nodes = [...nodes, node];
		if (elementId) link(node.id, elementId);
		if (select) selectNode(node.id);
	}

	// Moves a card or note dragged onto an element off the element, to the
	// element's next free docking spot, and links the two.
	function dock(nodeId, elementId) {
		const position = freeDockPosition(nodes, elementId, nodeId);
		link(nodeId, elementId);
		updateNode(nodeId, (node) => ({ ...node, position }));
	}

	function addCard(ref, elementId) {
		place(cardNode(content.cardsById.get(ref), freeDockPosition(nodes, elementId)), elementId);
	}

	function addCardAtCentre(ref) {
		place(cardNode(content.cardsById.get(ref), board.freeSpot(CARD_SIZE)), null, {
			select: true
		});
	}

	function addNote() {
		place(noteNode(board.freeSpot(NOTE_SIZE)), null, { select: true });
	}

	function dropCard(ref, position, elementId) {
		const at = elementId ? freeDockPosition(nodes, elementId) : position;
		const node = ref === NOTE_REF ? noteNode(at) : cardNode(content.cardsById.get(ref), at);
		place(node, elementId, { select: true });
	}

	function toggleScope(id) {
		updateNode(id, (node) => ({ ...node, data: { ...node.data, inScope: !node.data.inScope } }));
	}

	function removeNode(id) {
		nodes = nodes.filter((node) => node.id !== id);
		edges = edges.filter((edge) => edge.source !== id && edge.target !== id);
		selected = null;
	}

	function unlink(sourceId, elementId) {
		edges = edges.filter((edge) => !(edge.source === sourceId && edge.target === elementId));
	}

	function setCardNote(id, note) {
		updateNode(id, (node) => ({ ...node, data: { ...node.data, note } }));
	}

	function newPlan() {
		({ title, nodes, edges } = emptyPlan(content));
		selected = null;
		message = '';
		board.fitBoard();
	}

	async function openPlan(file) {
		try {
			({ title, nodes, edges } = fromPlan(await readPlanFile(file), content));
			selected = null;
			message = '';
			board.fitBoard();
		} catch (error) {
			message = error.message;
		}
	}

	async function exportPng() {
		message = '';
		try {
			await board.downloadPng();
		} catch {
			message = 'The image could not be created in this browser.';
		}
	}
</script>

<svelte:head>
	<title>Foodshed Planner · {SITE_NAME}</title>
</svelte:head>

<div class="planner flex h-[calc(100dvh-var(--header-height))] min-h-[560px] flex-col px-page pb-4">
	<PageIntro page={PAGES.planner} compact class="pt-3 pb-2">
		{#if message}
			<span class="text-xs text-destructive">{message}</span>
		{/if}
	</PageIntro>

	{#if loadError}
		<p class="py-6 text-sm text-destructive">Could not load the planner. {loadError}</p>
	{:else if !content}
		<p class="py-6 text-sm text-muted-foreground">Loading the planner…</p>
	{:else}
		<SvelteFlowProvider>
			<PlannerToolbar
				bind:title
				bind:libraryOpen
				bind:detailOpen
				status={stored ? 'Saved in this browser' : 'Not saved: this browser blocks storage'}
				onnew={newPlan}
				onopen={openPlan}
				onsave={() => downloadPlanFile(toPlan({ title, nodes, edges }))}
				oncsv={() => downloadPlanCsv(content, { title, nodes, edges })}
				onpng={exportPng}
			/>
			<div class="flex min-h-0 flex-1 gap-4">
				<LibraryPanel
					{content}
					{placedRefs}
					selectedRef={selected?.type === 'ref' ? selected.id : null}
					hidden={!libraryOpen}
					onpreview={preview}
					onaddnote={addNote}
				/>
				<!-- Only the board is framed, like the map on the tool pages. -->
				<div class="min-w-0 flex-1 overflow-hidden rounded-md border border-border">
					<PlannerBoard
						bind:this={board}
						bind:nodes
						bind:edges
						{title}
						onselect={selectNode}
						ondropcard={dropCard}
						ondock={dock}
					/>
				</div>
				<DetailPanel
					{content}
					{view}
					{scope}
					{edges}
					{placedRefs}
					{cardCount}
					hidden={!detailOpen}
					onselect={selectNode}
					onpreview={preview}
					onadd={addCard}
					onaddfree={addCardAtCentre}
					ontogglescope={toggleScope}
					onremove={removeNode}
					onunlink={unlink}
					onnote={setCardNote}
				/>
			</div>
		</SvelteFlowProvider>
	{/if}
</div>
