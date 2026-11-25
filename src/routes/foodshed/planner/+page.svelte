<!--
  Foodshed Planner — opening questions (all optional), then a board on which
  planners lay out which parts of the food system they want to analyse, and
  with which methods, indicators and data, drawing on the foodshed review.
  The toolshed under the board holds the library and the details of what is
  selected. The answers put parts of the food system in the plan and steer
  what is recommended. The plan autosaves in the browser and can be
  saved as a file, or exported as PNG and CSV.
-->
<script>
	import { onMount } from 'svelte';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import PageIntro from '$lib/components/PageIntro.svelte';
	import DetailView from '$lib/components/planner/DetailView.svelte';
	import LibraryList from '$lib/components/planner/LibraryList.svelte';
	import PlanOverview from '$lib/components/planner/PlanOverview.svelte';
	import PlannerBoard from '$lib/components/planner/PlannerBoard.svelte';
	import PlannerIntake from '$lib/components/planner/PlannerIntake.svelte';
	import PlannerToolbar from '$lib/components/planner/PlannerToolbar.svelte';
	import Toolshed from '$lib/components/planner/Toolshed.svelte';
	import '$lib/styles/planner.css';
	import { CARD_SIZE, NOTE_SIZE } from '$lib/planner/board-layout.js';
	import { CARD_DRAG_TYPE, KIND_ICONS, NOTE_REF } from '$lib/planner/card-kinds.js';
	import { PAGES, SITE_NAME } from '$lib/navigation.js';
	import { recommendCards, suggestElements } from '$lib/planner/evidence.js';
	import { setPlanner } from '$lib/planner/planner-context.js';
	import { loadPlannerContent } from '$lib/planner/planner-data.js';
	import { emptyProfile, planTargets, rescope } from '$lib/planner/profile.js';
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
		toPlan,
		withScope
	} from '$lib/planner/plan-state.js';
	import { downloadPlanCsv, downloadPlanFile, readPlanFile } from '$lib/planner/plan-export.js';

	const NoteIcon = KIND_ICONS.note;

	let content = $state.raw(null);
	let loadError = $state('');
	let message = $state('');
	let mode = $state('intake');
	let editing = $state(false);
	let title = $state('');
	let profile = $state.raw(emptyProfile());
	let nodes = $state.raw([]);
	let edges = $state.raw([]);
	let selected = $state(null);
	let stored = $state(true);
	let board = $state();
	let toolshedView = $state('library');
	let toolshedCollapsed = $state(false);
	let toolshedHeight = $state(280);
	let root;

	onMount(async () => {
		stored = canStorePlans();
		// The board is the main thing on the page: the toolshed starts at under
		// a third of the window, and can be resized or folded from there.
		toolshedHeight = Math.round(Math.min(320, Math.max(220, window.innerHeight * 0.3)));
		try {
			content = await loadPlannerContent();
		} catch (error) {
			loadError = error.message;
			return;
		}
		setPlan(emptyPlan(content));
		const saved = loadStoredPlan();
		if (!saved) return;
		try {
			setPlan(fromPlan(saved, content));
			mode = 'board';
		} catch {
			message = 'The plan saved in this browser could not be restored.';
		}
	});

	// Autosave once the board has been still for a moment, so dragging a card
	// does not write to storage on every frame. Nothing is saved before the
	// questions are first left, so a visit that stops there starts with them
	// again.
	$effect(() => {
		if (!content || mode !== 'board') return;
		const plan = toPlan({ title, profile, nodes, edges });
		const timer = setTimeout(() => storePlan(plan), 400);
		return () => clearTimeout(timer);
	});

	// A string, so that dragging a card (which changes `nodes` on every frame)
	// leaves the scope, and the recommendations computed from it, untouched.
	const scopeKey = $derived(scopeOf(nodes).join('|'));
	const scope = $derived(scopeKey ? scopeKey.split('|') : []);
	const targets = $derived(content ? planTargets(content, profile, scope) : []);
	const recommended = $derived(content ? recommendCards(content, targets) : {});
	const suggestions = $derived(
		content && targets.length ? suggestElements(content, targets, scope) : []
	);
	const suggestedIds = $derived(new Set(suggestions.map((item) => item.entry.id)));
	const placedRefs = $derived(
		new Set(nodes.filter((node) => node.type === 'card').map((node) => node.data.ref))
	);
	const byline = $derived(content?.actorsById.get(profile.actor)?.label ?? '');

	setPlanner({
		get objective() {
			return profile.objective;
		},
		setObjective(text) {
			profile = { ...profile, objective: text };
		},
		get suggested() {
			return suggestedIds;
		}
	});

	const view = $derived.by(() => {
		if (!content || !selected) return null;
		if (selected.type === 'ref') {
			const card = content.cardsById.get(selected.id);
			return card ? { type: 'card', card, node: null } : null;
		}
		const node = nodes.find((n) => n.id === selected.id);
		if (node?.type === 'zone') {
			const id = node.id.slice('zone:'.length);
			return { type: 'zone', zone: content.zonesById.get(id) ?? content.subzonesById.get(id) };
		}
		if (node?.type === 'element') {
			return { type: 'element', element: content.elementsById.get(node.id), node };
		}
		if (node?.type === 'card') {
			return { type: 'card', card: content.cardsById.get(node.data.ref), node };
		}
		if (node?.type === 'note') return { type: 'note', node };
		// The objective, or nothing: the overview of the plan.
		return null;
	});

	function setPlan(plan) {
		({ title, profile, nodes, edges } = plan);
		selected = null;
		message = plan.dropped
			? `${plan.dropped} card${plan.dropped === 1 ? ' is' : 's are'} no longer in the library and ${plan.dropped === 1 ? 'was' : 'were'} left out.`
			: '';
	}

	function showDetail() {
		toolshedView = 'detail';
		toolshedCollapsed = false;
	}

	function markSelected(id) {
		nodes = nodes.map((node) =>
			node.selected === (node.id === id) ? node : { ...node, selected: node.id === id }
		);
	}

	function selectNode(id) {
		selected = id ? { type: 'node', id } : null;
		if (id) showDetail();
		markSelected(id);
	}

	function preview(ref) {
		selected = { type: 'ref', id: ref };
		showDetail();
		markSelected(null);
	}

	function updateNode(id, update) {
		nodes = nodes.map((node) => (node.id === id ? update(node) : node));
	}

	function link(sourceId, elementId) {
		if (!isLinked(edges, sourceId, elementId)) edges = [...edges, linkEdge(sourceId, elementId)];
	}

	function place(node, elementId, select) {
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

	/** A card docked at an element, or, without one, in free space in view, selected. */
	function addCard(ref, elementId) {
		const card = content.cardsById.get(ref);
		if (elementId) place(cardNode(card, freeDockPosition(nodes, elementId)), elementId, false);
		else place(cardNode(card, board.freeSpot(CARD_SIZE)), null, true);
	}

	// A recommended card docks at the element of the plan it shares most studies with.
	function addRecommended(item) {
		const elements = item.why.filter(({ target }) => content.elementsById.get(target.id) === target);
		const best = elements.sort((a, b) => b.shared - a.shared)[0];
		addCard(item.entry.id, best?.target.id ?? null);
	}

	function addNote() {
		place(noteNode(board.freeSpot(NOTE_SIZE)), null, true);
	}

	function dropCard(ref, position, elementId) {
		const at = elementId ? freeDockPosition(nodes, elementId) : position;
		const node = ref === NOTE_REF ? noteNode(at) : cardNode(content.cardsById.get(ref), at);
		place(node, elementId, true);
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

	// The questions run longer than the window, so each step and each switch
	// between questions and board starts at the top of the page.
	function toTop() {
		root.scrollIntoView({ block: 'start' });
	}

	function show(next, { edit = false } = {}) {
		mode = next;
		editing = edit;
		toTop();
	}

	function finishIntake(next) {
		nodes = withScope(nodes, rescope(scopeOf(nodes), profile, next, content));
		profile = next;
		selected = null;
		show('board');
	}

	function newPlan() {
		setPlan(emptyPlan(content));
		show('intake');
	}

	async function openPlan(file) {
		try {
			setPlan(fromPlan(await readPlanFile(file), content));
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

	function dragNote(event) {
		event.dataTransfer.setData(CARD_DRAG_TYPE, NOTE_REF);
		event.dataTransfer.effectAllowed = 'copy';
	}
</script>

<svelte:head>
	<title>Foodshed Planner · {SITE_NAME}</title>
</svelte:head>

<div
	bind:this={root}
	class={[
		'planner flex flex-col px-page',
		mode === 'board'
			? 'h-[calc(100dvh-var(--header-height))] min-h-[640px] pb-3'
			: 'min-h-[calc(100dvh-var(--header-height))]'
	]}
>
	<PageIntro page={PAGES.planner} compact class="pt-3 pb-2">
		{#if message}
			<span class="text-xs text-destructive">{message}</span>
		{/if}
		{#if content && mode === 'board'}
			<PlannerToolbar
				bind:title
				status={stored ? 'Saved in this browser' : 'Not saved: this browser blocks storage'}
				onquestions={() => show('intake', { edit: true })}
				onnew={newPlan}
				onopen={openPlan}
				onsave={() => downloadPlanFile(toPlan({ title, profile, nodes, edges }))}
				oncsv={() => downloadPlanCsv(content, { title, profile, nodes, edges })}
				onpng={exportPng}
			/>
		{/if}
	</PageIntro>

	{#if loadError}
		<p class="py-6 text-sm text-destructive">Could not load the planner. {loadError}</p>
	{:else if !content}
		<p class="py-6 text-sm text-muted-foreground">Loading the planner…</p>
	{:else if mode === 'intake'}
		<PlannerIntake
			{content}
			{profile}
			{editing}
			onfinish={finishIntake}
			oncancel={() => show('board')}
			onstep={toTop}
		/>
	{:else}
		<SvelteFlowProvider>
			<!-- Only the board is framed, like the map on the tool pages. -->
			<div class="min-h-[220px] flex-1 overflow-hidden rounded-md border border-border">
				<PlannerBoard
					bind:this={board}
					bind:nodes
					bind:edges
					{title}
					{byline}
					capacities={profile.capacities}
					onselect={selectNode}
					ondropcard={dropCard}
					ondock={dock}
				/>
			</div>
			<Toolshed
				bind:height={toolshedHeight}
				bind:collapsed={toolshedCollapsed}
				bind:view={toolshedView}
			>
				{#snippet actions()}
					{#if selected}
						<button
							class="flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
							onclick={() => selectNode(null)}
						>
							<ArrowLeft size={13} />Your plan
						</button>
					{/if}
					<button
						draggable="true"
						ondragstart={dragNote}
						onclick={addNote}
						class="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
						title="Add a note, or drag it onto the board"
					>
						<NoteIcon size={13} />Add a note
					</button>
				{/snippet}
				{#snippet library()}
					<LibraryList
						{content}
						{recommended}
						{placedRefs}
						selectedRef={selected?.type === 'ref' ? selected.id : null}
						onpreview={preview}
						onadd={(ref) => addCard(ref, null)}
					/>
				{/snippet}
				{#snippet detail()}
					{#if view}
						<DetailView
							{content}
							{view}
							{scope}
							{edges}
							{placedRefs}
							onselect={selectNode}
							onpreview={preview}
							onaddcard={addCard}
							ontogglescope={toggleScope}
							onremove={removeNode}
							onunlink={unlink}
							onnote={setCardNote}
						/>
					{:else}
						<PlanOverview
							{content}
							{profile}
							{scope}
							{recommended}
							{placedRefs}
							onedit={() => show('intake', { edit: true })}
							onselect={selectNode}
							onpreview={preview}
							onadd={addRecommended}
							ontogglescope={toggleScope}
						/>
					{/if}
				{/snippet}
			</Toolshed>
		</SvelteFlowProvider>
	{/if}
</div>
