<!--
  DetailPanel — right-hand panel of the planner. With nothing selected it
  shows the plan overview and suggestions for the elements in scope; with an
  element, card or note selected it shows its definition, the evidence from
  the review, and what can be done with it.
-->
<script>
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import PaperList from './PaperList.svelte';
	import SourceLine from './SourceLine.svelte';
	import SuggestionList from './SuggestionList.svelte';
	import { KIND_ICONS } from '$lib/planner/card-kinds.js';
	import {
		CARD_KINDS,
		KIND_LABELS,
		elementsForCard,
		papersFor,
		relatedCards
	} from '$lib/planner/planner-data.js';

	let {
		content,
		view,
		scope,
		edges,
		placedRefs,
		cardCount,
		hidden = false,
		onselect,
		onpreview,
		onadd,
		onaddfree,
		ontogglescope,
		onremove,
		onunlink,
		onnote
	} = $props();

	const linkedElements = $derived(
		view?.node
			? edges
					.filter((edge) => edge.source === view.node.id)
					.map((edge) => content.elementsById.get(edge.target))
					.filter(Boolean)
			: []
	);
</script>

{#snippet heading(text)}
	<h3 class="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{text}</h3>
{/snippet}

{#snippet elementChip(element, onremoveChip)}
	<span
		class="inline-flex items-center gap-1.5 rounded-full border border-border py-0.5 pr-1 pl-2 text-xs"
	>
		<span class="size-2 rounded-full" style:background="var(--zone-{element.zone})"></span>
		<button class="cursor-pointer hover:underline" onclick={() => onselect(element.id)}>
			{element.label}
		</button>
		{#if onremoveChip}
			<button
				class="grid size-4 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
				aria-label="Unlink from {element.label}"
				onclick={onremoveChip}
			>
				<X size={11} />
			</button>
		{:else}
			<span class="w-1"></span>
		{/if}
	</span>
{/snippet}

{#snippet overview()}
	{@const scoped = scope.map((id) => content.elementsById.get(id)).filter(Boolean)}
	<section class="space-y-2">
		<h2 class="text-base font-semibold text-foreground">Your plan</h2>
		<p class="text-sm text-muted-foreground">
			{scoped.length
				? `${scoped.length} element${scoped.length === 1 ? '' : 's'} of the food system in scope, ${cardCount} card${cardCount === 1 ? '' : 's'} and notes on the board.`
				: 'Nothing in scope yet.'}
		</p>
		{#if scoped.length}
			<div class="flex flex-wrap gap-1.5">
				{#each scoped as element (element.id)}
					{@render elementChip(element)}
				{/each}
			</div>
		{/if}
	</section>

	{#if scoped.length}
		<section>
			{@render heading('Suggested for your plan')}
			<SuggestionList
				{content}
				elementIds={scope}
				{placedRefs}
				{onadd}
				{onpreview}
				perKind={5}
			/>
		</section>
	{:else}
		<section class="space-y-2 text-sm leading-relaxed text-muted-foreground">
			{@render heading('How it works')}
			<ol class="list-decimal space-y-1.5 pl-4">
				<li>Click an element of the food system to read what it is, and include it in your plan.</li>
				<li>
					Add methods, indicators and data: drag them from the library, or take the suggestions
					drawn from the literature.
				</li>
				<li>Write notes, then save the plan or export it as an image or a table.</li>
			</ol>
			<p>Your board is saved in this browser as you work.</p>
		</section>
	{/if}

	<section class="space-y-3">
		{@render heading('Key concepts')}
		{#each content.concepts as concept (concept.id)}
			<div class="space-y-1">
				<h4 class="text-sm font-medium text-foreground">{concept.label}</h4>
				<p class="text-[13px] leading-relaxed text-muted-foreground">{concept.definition}</p>
				<SourceLine source={concept.source} doi={concept.doi} />
			</div>
		{/each}
	</section>

	<p class="text-xs leading-relaxed text-muted-foreground">
		{content.review.note} Evidence comes from {content.review.papers} reviewed studies.
	</p>
{/snippet}

{#snippet elementView(element, node)}
	{@const zone = content.zonesById.get(element.zone)}
	<section class="space-y-3">
		<div class="space-y-1">
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<span class="size-2 rounded-full" style:background="var(--zone-{element.zone})"></span>
				{zone?.label}{element.group ? ` · ${element.group}` : ''}
			</p>
			<h2 class="text-lg leading-tight font-semibold text-foreground">{element.label}</h2>
		</div>
		<Button
			variant={node.data.inScope ? 'outline' : 'default'}
			size="sm"
			class="w-full cursor-pointer"
			onclick={() => ontogglescope(element.id)}
		>
			{node.data.inScope ? 'Remove from my plan' : 'Include in my plan'}
		</Button>
		<p class="text-sm leading-relaxed text-foreground">{element.definition}</p>
		<SourceLine source={element.source} doi={element.doi} />
	</section>

	{#if element.question}
		<section>
			{@render heading('Planning question')}
			<p class="text-sm leading-relaxed text-foreground">{element.question}</p>
		</section>
	{/if}

	{#if element.parts?.length}
		<section class="space-y-2">
			{@render heading(element.parts_source ? 'Elements' : 'More')}
			<dl class="space-y-2">
				{#each element.parts as part (part.label)}
					<div>
						<dt class="text-sm font-medium text-foreground">{part.label}</dt>
						<dd class="text-[13px] leading-relaxed text-muted-foreground">{part.text}</dd>
					</div>
				{/each}
			</dl>
			{#if element.parts_source}<SourceLine source={element.parts_source} />{/if}
		</section>
	{/if}

	{#if element.evaluates}
		<section class="space-y-2">
			{@render heading('How a foodshed analysis can inform it')}
			<p class="text-[13px] leading-relaxed text-foreground">{element.evaluates}</p>
			<p class="text-[13px] leading-relaxed text-muted-foreground">
				<span class="font-medium text-foreground">Examples.</span>
				{element.examples}
			</p>
			<p class="text-[13px] leading-relaxed text-muted-foreground">
				<span class="font-medium text-foreground">Not enough on its own.</span>
				{element.not_sufficient}
			</p>
			<SourceLine source="This review" />
		</section>
	{/if}

	<section>
		{@render heading('Suggested from the literature')}
		<SuggestionList {content} elementIds={[element.id]} {placedRefs} {onadd} {onpreview} />
	</section>

	<section>
		{@render heading(`Papers in the review (${element.papers.length})`)}
		<PaperList papers={papersFor(content, element.papers)} />
	</section>
{/snippet}

{#snippet cardView(card, node)}
	{@const Icon = KIND_ICONS[card.kind]}
	{@const informs = elementsForCard(content, card.id)}
	{@const related = relatedCards(content, card.id)}
	<section class="space-y-3">
		<div class="space-y-1">
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Icon size={12} />
				{KIND_LABELS[card.kind]} · {card.group}
			</p>
			<h2 class="text-lg leading-tight font-semibold text-foreground">{card.label}</h2>
		</div>
		{#if !node}
			<Button size="sm" class="w-full cursor-pointer" onclick={() => onaddfree(card.id)}>
				<Plus />
				{placedRefs.has(card.id) ? 'Add another to the board' : 'Add to the board'}
			</Button>
		{/if}
		<p class="text-sm leading-relaxed text-foreground">{card.description}</p>
		<SourceLine source={card.source} />
	</section>

	{#if node}
		<section class="space-y-2">
			{@render heading('Linked to')}
			{#if linkedElements.length}
				<div class="flex flex-wrap gap-1.5">
					{#each linkedElements as element (element.id)}
						{@render elementChip(element, () => onunlink(node.id, element.id))}
					{/each}
				</div>
			{:else}
				<p class="text-xs text-muted-foreground">
					Not linked yet. Drag the card onto an element of the food system.
				</p>
			{/if}
		</section>
		<section>
			<label class="block">
				<span class="mb-2 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
					Your note
				</span>
				<textarea
					rows="3"
					value={node.data.note}
					oninput={(event) => onnote(node.id, event.currentTarget.value)}
					placeholder="Why this card, which data you have, open questions"
					class="w-full rounded-md border border-border bg-background px-2.5 py-2 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground focus:border-foreground/40"
				></textarea>
			</label>
		</section>
	{/if}

	{#if card.sources.length}
		<section>
			{@render heading('Example sources')}
			<ul class="space-y-1">
				{#each card.sources as source (source.name)}
					<li class="text-[13px]">
						{#if source.url}
							<a
								href={source.url}
								target="_blank"
								rel="noopener"
								class="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
							>
								{source.name}
								<ExternalLink size={11} class="text-muted-foreground" />
							</a>
						{:else}
							<span class="text-foreground">{source.name}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if card.named.length}
		<section>
			{@render heading('As named in the literature')}
			<div class="flex flex-wrap gap-1">
				{#each card.named as name (name)}
					<span class="rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">{name}</span>
				{/each}
			</div>
		</section>
	{/if}

	{#if informs.length}
		<section>
			{@render heading('Most often used for')}
			<div class="flex flex-wrap gap-1.5">
				{#each informs as { element } (element.id)}
					{@render elementChip(element)}
				{/each}
			</div>
		</section>
	{/if}

	{#each CARD_KINDS.filter(({ value }) => related[value]?.length) as kind (kind.value)}
		<section>
			{@render heading(`Often used with these ${kind.label.toLowerCase()}`)}
			<ul class="space-y-0.5">
				{#each related[kind.value] as item (item.card.id)}
					<li>
						<button
							class="cursor-pointer text-left text-[13px] text-foreground underline-offset-2 hover:underline"
							onclick={() => onpreview(item.card.id)}
						>
							{item.card.label}
						</button>
						<span class="text-[11px] text-muted-foreground tabular-nums">{item.shared}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<section>
		{@render heading(`Papers in the review (${card.papers.length})`)}
		<PaperList papers={papersFor(content, card.papers)} />
	</section>

	{#if node}
		<Button variant="outline" size="sm" class="w-full cursor-pointer" onclick={() => onremove(node.id)}>
			<Trash2 />
			Remove from the board
		</Button>
	{/if}
{/snippet}

{#snippet noteView(node)}
	<section class="space-y-3">
		<h2 class="text-lg font-semibold text-foreground">Note</h2>
		<p class="text-sm text-muted-foreground">
			Edit the note on the board. Drag it onto an element of the food system to link it.
		</p>
	</section>
	<section class="space-y-2">
		{@render heading('Linked to')}
		{#if linkedElements.length}
			<div class="flex flex-wrap gap-1.5">
				{#each linkedElements as element (element.id)}
					{@render elementChip(element, () => onunlink(node.id, element.id))}
				{/each}
			</div>
		{:else}
			<p class="text-xs text-muted-foreground">Not linked yet.</p>
		{/if}
	</section>
	<Button variant="outline" size="sm" class="w-full cursor-pointer" onclick={() => onremove(node.id)}>
		<Trash2 />
		Remove from the board
	</Button>
{/snippet}

<aside {hidden} class="flex min-h-0 w-80 shrink-0 flex-col">
	{#if view}
		<div class="flex justify-end pt-1">
			<button
				class="cursor-pointer rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
				onclick={() => onselect(null)}
			>
				Back to plan
			</button>
		</div>
	{/if}
	<div class="min-h-0 flex-1 space-y-6 overflow-y-auto pt-1 pr-1 pb-6 pl-2">
		{#if !view}
			{@render overview()}
		{:else if view.type === 'element'}
			{@render elementView(view.element, view.node)}
		{:else if view.type === 'card'}
			{@render cardView(view.card, view.node)}
		{:else}
			{@render noteView(view.node)}
		{/if}
	</div>
</aside>
