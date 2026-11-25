<!--
  PlanOverview — the toolshed's view when nothing is selected: the answers to
  the opening questions, the parts of the food system in the plan, and the
  methods, indicators and data recommended for the plan as a whole. Sections
  flow into columns as the toolshed widens.
-->
<script>
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { Button } from '$lib/components/ui/button';
	import ElementChip from './ElementChip.svelte';
	import RecommendationList from './RecommendationList.svelte';
	import TermList from './TermList.svelte';
	import { CARD_KINDS } from '$lib/planner/planner-data.js';

	let {
		content,
		profile,
		scope,
		recommended,
		placedRefs,
		onedit,
		onselect,
		onpreview,
		onadd,
		ontogglescope
	} = $props();

	const scoped = $derived(scope.map((id) => content.elementsById.get(id)).filter(Boolean));
	const labels = (ids, lookup) => ids.map((id) => lookup.get(id)?.label).filter(Boolean);
	const answers = $derived([
		['Your role', content.actorsById.get(profile.actor)?.label],
		['Objective', profile.objective.trim()],
		['Decisions', labels(profile.topics, content.topicsById).join(', ')],
		['Outcomes to improve', labels(profile.outcomes, content.elementsById).join(', ')],
		[
			'Resilience',
			profile.capacities.map((id) => content.elementsById.get(id)?.verb).filter(Boolean).join(', ')
		]
	]);
	const answered = $derived(answers.filter(([, value]) => value));
</script>

{#snippet section(title, body)}
	<section class="mb-6 break-inside-avoid">
		{#if title}<h3 class="field-label mb-2">{title}</h3>{/if}
		{@render body()}
	</section>
{/snippet}

<div class="@container">
	<header class="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
		<h2 class="text-lg leading-tight font-semibold text-foreground">Your plan</h2>
		<Button variant="outline" size="sm" class="cursor-pointer" onclick={onedit}>
			<ListChecks />{answered.length ? 'Change your answers' : 'Answer the questions'}
		</Button>
	</header>

	<div class="columns-1 gap-8 @2xl:columns-2 @5xl:columns-3">
		{#if answered.length}
			{#snippet yourAnswers()}
				<dl class="space-y-1.5 text-[13px] leading-snug">
					{#each answered as [label, value] (label)}
						<div>
							<dt class="text-xs text-muted-foreground">{label}</dt>
							<dd class="text-foreground">{value}</dd>
						</div>
					{/each}
				</dl>
			{/snippet}
			{@render section('Your answers', yourAnswers)}
		{/if}

		{#snippet inPlan()}
			{#if scoped.length}
				<div class="flex flex-wrap gap-1.5">
					{#each scoped as element (element.id)}
						<ElementChip
							{element}
							{onselect}
							onremove={() => ontogglescope(element.id)}
							removeLabel="Take {element.label} out of the plan"
						/>
					{/each}
				</div>
			{:else}
				<p class="text-[13px] text-muted-foreground">Nothing yet.</p>
			{/if}
		{/snippet}
		{@render section('In your plan', inPlan)}

		{#each CARD_KINDS.filter(({ value }) => recommended[value].length) as kind (kind.value)}
			{#snippet list()}
				<RecommendationList items={recommended[kind.value]} {placedRefs} {onpreview} {onadd} />
			{/snippet}
			{@render section(`Recommended ${kind.label.toLowerCase()}`, list)}
		{/each}

		{#snippet terms()}
			<TermList concepts={content.concepts} />
		{/snippet}
		{@render section('Key terms', terms)}
	</div>
</div>
