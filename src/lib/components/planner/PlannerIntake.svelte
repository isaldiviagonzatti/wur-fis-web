<!--
  PlannerIntake — the planner's opening questions, all optional: the
  planner's role (one of the food system's activities, or another actor from a
  drop-down), the objective of the plan, the outcomes to improve, and the
  resilience capacities to build. Options show their names only; the
  definitions and their sources are behind info icons. Answers are kept in a
  draft until the board is opened (or updated), so leaving with "Back to the
  board" changes nothing.
-->
<script>
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import IntakeChoice from './IntakeChoice.svelte';
	import ResilienceFigure from './ResilienceFigure.svelte';
	import TermList from './TermList.svelte';
	import { ELEMENT_LAYOUT } from '$lib/planner/board-layout.js';
	import { capacityElements, outcomeGroups } from '$lib/planner/profile.js';

	let { content, profile, editing = false, onfinish, oncancel, onstep } = $props();

	const STEPS = [
		{ id: 'role', label: 'Your role' },
		{ id: 'objective', label: 'Objective' },
		{ id: 'outcomes', label: 'Outcomes' },
		{ id: 'resilience', label: 'Resilience' }
	];

	// The intake is mounted afresh each time it opens, so the draft starts from
	// the profile as it is then.
	const initial = () => $state.snapshot(profile);
	let draft = $state(initial());
	let step = $state(0);

	// Actors of the food system are named by their activity; the others share
	// one tile with a drop-down.
	const activityActors = $derived(content.actors.filter((actor) => actor.activities.length));
	const otherActors = $derived(content.actors.filter((actor) => !actor.activities.length));
	const otherChosen = $derived(otherActors.some((actor) => actor.id === draft.actor));
	const resilience = $derived(content.zonesById.get('resilience'));
	const outcomesZone = $derived(content.zonesById.get('outcomes'));
	const capacities = $derived(capacityElements(content));
	const groups = $derived(outcomeGroups(content));

	function activityLabel(actor) {
		return content.elementsById.get(actor.activities[0])?.label ?? actor.label;
	}

	// A definition several groups share (the two sustainability boxes quote
	// HLPE on sustainability) defines what they belong to, not the group.
	function ownDefinition(subzone) {
		const shared = groups.filter((group) => group.subzone.definition === subzone.definition);
		return shared.length === 1 ? subzone : null;
	}

	function toggle(list, id) {
		draft[list] = draft[list].includes(id)
			? draft[list].filter((other) => other !== id)
			: [...draft[list], id];
	}

	function toggleAll(ids) {
		const all = ids.every((id) => draft.outcomes.includes(id));
		draft.outcomes = all
			? draft.outcomes.filter((id) => !ids.includes(id))
			: [...new Set([...draft.outcomes, ...ids])];
	}

	function go(index) {
		step = index;
		onstep();
	}

	function finish() {
		onfinish($state.snapshot(draft));
	}
</script>

{#snippet question(title, defined = null)}
	<div class="mb-5 flex items-center gap-1.5">
		<h2 class="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
		{#if defined}
			<InfoTip
				text={defined.definition}
				source={defined.source}
				label="What is {defined.label.toLowerCase()}?"
				class="rounded p-1 text-foreground"
			/>
		{/if}
	</div>
{/snippet}

<div class="mx-auto w-full max-w-5xl pt-2 pb-10">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<ol class="flex flex-wrap gap-x-5 gap-y-1">
			{#each STEPS as entry, index (entry.id)}
				<li>
					<button
						class={[
							'cursor-pointer border-b-2 py-1 text-sm',
							index === step
								? 'border-foreground font-medium text-foreground'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						]}
						aria-current={index === step ? 'step' : undefined}
						onclick={() => go(index)}
					>
						<span class="tabular-nums">{index + 1}</span>
						<span class="site-title">{entry.label}</span>
					</button>
				</li>
			{/each}
		</ol>
		{#if editing}
			<Button variant="ghost" size="sm" class="cursor-pointer" onclick={oncancel}>
				Back to the board
			</Button>
		{:else}
			<Button variant="ghost" size="sm" class="cursor-pointer" onclick={finish}>
				Skip the questions
			</Button>
		{/if}
	</div>

	{#if step === 0}
		{@render question('Which part of the food system do you work in?')}
		<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
			{#each activityActors as actor (actor.id)}
				<IntakeChoice
					label={activityLabel(actor)}
					definition={actor.description}
					source={actor.source}
					multiple={false}
					selected={draft.actor === actor.id}
					onclick={() => (draft.actor = draft.actor === actor.id ? null : actor.id)}
				/>
			{/each}
			<IntakeChoice label="Other" multiple={false} selected={otherChosen}>
				<Select
					type="single"
					bind:value={() => (otherChosen ? draft.actor : ''), (id) => (draft.actor = id || null)}
				>
					<SelectTrigger
						size="sm"
						class="w-full bg-background"
						style="cursor: pointer;"
						aria-label="Other role"
					>
						<span class="truncate">
							{otherChosen ? content.actorsById.get(draft.actor).label : 'Government, NGO, research…'}
						</span>
					</SelectTrigger>
					<SelectContent style="width: var(--bits-select-anchor-width);">
						{#each otherActors as actor (actor.id)}
							<SelectItem value={actor.id} label={actor.label} />
						{/each}
					</SelectContent>
				</Select>
			</IntakeChoice>
		</div>
	{:else if step === 1}
		{@render question('What should the plan achieve?')}
		<textarea
			bind:value={draft.objective}
			rows="3"
			maxlength="400"
			aria-label="Objective of the plan"
			placeholder="For example: make the city's supply of fresh vegetables less dependent on one region"
			class="w-full max-w-3xl rounded-md bg-surface-tint px-3 py-2.5 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
		></textarea>

		<h3 class="mt-8 mb-3 text-base font-semibold text-foreground">Which decisions does it concern?</h3>
		<div class="flex max-w-4xl flex-wrap gap-2">
			{#each content.topics as topic (topic.id)}
				{@const selected = draft.topics.includes(topic.id)}
				<button
					type="button"
					aria-pressed={selected}
					title={topic.description}
					onclick={() => toggle('topics', topic.id)}
					class={[
						'cursor-pointer rounded-full px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
						selected
							? 'bg-foreground text-background'
							: 'bg-surface-tint text-foreground hover:bg-surface-tint-strong'
					]}
				>
					{topic.label}
				</button>
			{/each}
		</div>
	{:else if step === 2}
		{@render question('Which outcomes do you want to improve?', outcomesZone)}
		<div class="space-y-6">
			{#each groups as { subzone, elements } (subzone.id)}
				{@const ids = elements.map((element) => element.id)}
				{@const defined = ownDefinition(subzone)}
				<section class="space-y-2">
					<div class="flex flex-wrap items-center gap-x-3">
						<h3 class="flex items-center gap-1 text-sm font-semibold text-foreground">
							{subzone.label}
							{#if defined}
								<InfoTip
									text={defined.definition}
									source={defined.source}
									label="What is {defined.label.toLowerCase()}?"
									class="rounded p-1 text-foreground"
								/>
							{/if}
						</h3>
						{#if elements.length > 1}
							<button
								class="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
								onclick={() => toggleAll(ids)}
							>
								{ids.every((id) => draft.outcomes.includes(id)) ? 'Clear all' : 'Select all'}
							</button>
						{/if}
					</div>
					<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
						{#each elements as element (element.id)}
							<IntakeChoice
								label={element.label}
								definition={element.definition}
								source={element.source}
								selected={draft.outcomes.includes(element.id)}
								onclick={() => toggle('outcomes', element.id)}
							/>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{:else}
		{@render question('Should the plan make the food system more resilient?', resilience)}
		<div class="mb-6 max-w-3xl">
			<ResilienceFigure
				width="100%"
				height="auto"
				active={draft.capacities}
				title="Food security over time after a shock: without resilience capacities it drops and recovers slowly; absorbing the shock means a smaller loss, adapting a faster recovery, transforming a reconfigured system."
			/>
		</div>
		<div class="grid gap-2 sm:grid-cols-3">
			{#each capacities as element (element.id)}
				<IntakeChoice
					label={element.verb}
					sublabel={element.label}
					definition={element.definition}
					source={element.source}
					accent={ELEMENT_LAYOUT[element.id].accent}
					selected={draft.capacities.includes(element.id)}
					onclick={() => toggle('capacities', element.id)}
				/>
			{/each}
		</div>
	{/if}

	<div class="mt-8 flex flex-wrap items-center gap-2">
		{#if step > 0}
			<Button variant="ghost" class="cursor-pointer" onclick={() => go(step - 1)}>
				<ArrowLeft />Back
			</Button>
		{/if}
		{#if step < STEPS.length - 1}
			<Button class="cursor-pointer" onclick={() => go(step + 1)}>
				Next<ArrowRight />
			</Button>
		{:else}
			<Button class="cursor-pointer" onclick={finish}>
				{editing ? 'Update the board' : 'Open the board'}<ArrowRight />
			</Button>
		{/if}
	</div>

	<details class="mt-10 max-w-3xl">
		<summary class="field-label cursor-pointer">Key terms</summary>
		<div class="mt-2">
			<TermList concepts={content.concepts} />
		</div>
	</details>
</div>
