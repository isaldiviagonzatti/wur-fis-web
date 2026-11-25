<!--
  DetailView — the toolshed's view of what is selected: a zone of the
  diagram, an element, a card (on the board, or previewed from the library)
  or a note. It gives the definition and its source, what goes with it, and
  example studies to consult. Sections flow into columns as the toolshed
  widens.
-->
<script>
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import CardItems from './CardItems.svelte';
	import ElementChip from './ElementChip.svelte';
	import PaperList from './PaperList.svelte';
	import RecommendationList from './RecommendationList.svelte';
	import SourceLine from './SourceLine.svelte';
	import { KIND_ICONS } from '$lib/planner/card-kinds.js';
	import { elementsForCard, recommendCards, relatedCards } from '$lib/planner/evidence.js';
	import { CARD_KINDS, KIND_LABELS, elementsIn, papersFor } from '$lib/planner/planner-data.js';

	let {
		content,
		view,
		scope,
		edges,
		placedRefs,
		onselect,
		onpreview,
		onaddcard,
		ontogglescope,
		onremove,
		onunlink,
		onnote
	} = $props();

	const linkedElements = $derived(
		view.node
			? edges
					.filter((edge) => edge.source === view.node.id)
					.map((edge) => content.elementsById.get(edge.target))
					.filter(Boolean)
			: []
	);
</script>

{#snippet heading(text)}
	<h3 class="field-label mb-2">{text}</h3>
{/snippet}

{#snippet section(title, body)}
	<section class="mb-6 break-inside-avoid">
		{#if title}{@render heading(title)}{/if}
		{@render body()}
	</section>
{/snippet}

{#snippet kicker(colour, text, Icon = null)}
	<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
		{#if Icon}<Icon size={12} />{:else}<span class="size-2 rounded-full" style:background={colour}
			></span>{/if}
		{text}
	</p>
{/snippet}

{#snippet linked(node, empty)}
	{#if linkedElements.length}
		<div class="flex flex-wrap gap-1.5">
			{#each linkedElements as element (element.id)}
				<ElementChip
					{element}
					{onselect}
					onremove={() => onunlink(node.id, element.id)}
					removeLabel="Unlink from {element.label}"
				/>
			{/each}
		</div>
	{:else}
		<p class="text-xs text-muted-foreground">{empty}</p>
	{/if}
{/snippet}

{#snippet zoneView(zone)}
	{@const members = elementsIn(content, zone.zone ? { subzone: zone.id } : { zone: zone.id })}
	{@const parent = zone.zone ? content.zonesById.get(zone.zone) : null}
	<header class="mb-4 space-y-1">
		{@render kicker(`var(--zone-${zone.zone ?? zone.id})`, parent ? parent.label : 'Zone of the food system')}
		<h2 class="text-lg leading-tight font-semibold text-foreground">{zone.label}</h2>
	</header>
	<div class="columns-1 gap-8 @2xl:columns-2 @5xl:columns-3">
		{#snippet definition()}
			<p class="mb-1 text-sm leading-relaxed text-foreground">{zone.definition}</p>
			<SourceLine source={zone.source} doi={zone.doi} />
		{/snippet}
		{@render section('', definition)}
		{#if zone.parts?.length}
			{#snippet parts()}
				<dl class="space-y-2">
					{#each zone.parts as part (part.label)}
						<div>
							<dt class="text-sm font-medium text-foreground">{part.label}</dt>
							<dd class="text-[13px] leading-relaxed text-muted-foreground">{part.text}</dd>
						</div>
					{/each}
				</dl>
				{#if zone.parts_source}<div class="mt-1"><SourceLine source={zone.parts_source} /></div>{/if}
			{/snippet}
			{@render section('More on this', parts)}
		{/if}
		{#if members.length}
			{#snippet elements()}
				<ul class="space-y-1">
					{#each members as element (element.id)}
						<li class="flex items-center gap-2">
							<ElementChip {element} {onselect} />
							<span class="text-xs text-muted-foreground">
								{scope.includes(element.id) ? 'In your plan' : ''}
							</span>
						</li>
					{/each}
				</ul>
			{/snippet}
			{@render section('On the board', elements)}
		{/if}
	</div>
{/snippet}

{#snippet elementView(element, node)}
	{@const zone = content.zonesById.get(element.zone)}
	{@const subzone = content.subzonesById.get(element.subzone)}
	{@const recommended = recommendCards(content, [element], 4)}
	<header class="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
		<div class="space-y-1">
			{@render kicker(
				`var(--zone-${element.zone})`,
				[zone?.label, subzone?.label].filter(Boolean).join(' · ')
			)}
			<h2 class="text-lg leading-tight font-semibold text-foreground">{element.label}</h2>
		</div>
		<Button
			variant={node.data.inScope ? 'outline' : 'default'}
			size="sm"
			class="cursor-pointer"
			onclick={() => ontogglescope(element.id)}
		>
			{node.data.inScope ? 'Take out of my plan' : 'Include in my plan'}
		</Button>
	</header>
	<div class="columns-1 gap-8 @2xl:columns-2 @5xl:columns-3">
		{#snippet definition()}
			<p class="mb-1 text-sm leading-relaxed text-foreground">{element.definition}</p>
			<SourceLine source={element.source} doi={element.source ? element.doi : ''} />
		{/snippet}
		{@render section('', definition)}

		{#if element.items?.length}
			{#snippet items()}
				<ul class="mb-1 list-disc space-y-0.5 pl-4 text-[13px] text-foreground">
					{#each element.items as item (item)}<li>{item}</li>{/each}
				</ul>
				<SourceLine source={element.items_source} doi={element.doi} />
			{/snippet}
			{@render section('Drivers', items)}
		{/if}

		{#if element.parts?.length}
			{#snippet parts()}
				<dl class="space-y-2">
					{#each element.parts as part (part.label)}
						<div>
							<dt class="text-sm font-medium text-foreground">{part.label}</dt>
							<dd class="text-[13px] leading-relaxed text-muted-foreground">{part.text}</dd>
						</div>
					{/each}
				</dl>
				{#if element.parts_source}<div class="mt-1"><SourceLine source={element.parts_source} /></div>{/if}
			{/snippet}
			{@render section('More on this', parts)}
		{/if}

		{#if element.evaluates}
			{#snippet capacity()}
				<div class="space-y-2 text-[13px] leading-relaxed">
					<p class="text-foreground">{element.evaluates}</p>
					<p class="text-muted-foreground">
						<span class="font-medium text-foreground">Examples.</span>
						{element.examples}
					</p>
					<p class="text-muted-foreground">
						<span class="font-medium text-foreground">Not enough on its own.</span>
						{element.not_sufficient}
					</p>
					<SourceLine source={content.review.citation} />
				</div>
			{/snippet}
			{@render section('What a foodshed analysis can show', capacity)}
		{/if}

		{#each CARD_KINDS.filter(({ value }) => recommended[value].length) as kind (kind.value)}
			{#snippet list()}
				<RecommendationList
					items={recommended[kind.value]}
					{placedRefs}
					{onpreview}
					onadd={(item) => onaddcard(item.entry.id, element.id)}
				/>
			{/snippet}
			{@render section(`${kind.label} used for it`, list)}
		{/each}

		{#snippet papers()}
			<PaperList papers={papersFor(content, element.papers)} />
		{/snippet}
		{@render section('Example studies', papers)}
	</div>
{/snippet}

{#snippet cardView(card, node)}
	{@const informs = elementsForCard(content, card.id)}
	{@const related = relatedCards(content, card.id)}
	<header class="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
		<div class="space-y-1">
			{@render kicker(null, KIND_LABELS[card.kind], KIND_ICONS[card.kind])}
			<h2 class="text-lg leading-tight font-semibold text-foreground">{card.label}</h2>
		</div>
		{#if node}
			<Button variant="outline" size="sm" class="cursor-pointer" onclick={() => onremove(node.id)}>
				<Trash2 />Remove from the board
			</Button>
		{:else}
			<Button size="sm" class="cursor-pointer" onclick={() => onaddcard(card.id, null)}>
				<Plus />{placedRefs.has(card.id) ? 'Add another to the board' : 'Add to the board'}
			</Button>
		{/if}
	</header>
	<div class="columns-1 gap-8 @2xl:columns-2 @5xl:columns-3">
		{#snippet description()}
			<p class="mb-1 text-sm leading-relaxed text-foreground">{card.description}</p>
			<SourceLine source={card.source} />
		{/snippet}
		{@render section('', description)}

		{#if node}
			{#snippet linkedTo()}
				{@render linked(node, 'Not linked yet.')}
			{/snippet}
			{@render section('Linked to', linkedTo)}
			{#snippet note()}
				<textarea
					rows="3"
					value={node.data.note}
					oninput={(event) => onnote(node.id, event.currentTarget.value)}
					aria-label="Your note on {card.label}"
					placeholder="Why this card, which data you have, open questions"
					class="w-full rounded-md border border-border bg-background px-2.5 py-2 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground focus:border-foreground/40"
				></textarea>
			{/snippet}
			{@render section('Your note', note)}
		{/if}

		{#snippet items()}
			<CardItems {content} {card} />
		{/snippet}
		{@render section(card.kind === 'data' ? 'Datasets' : 'Variants', items)}

		{#if informs.length}
			{#snippet usedFor()}
				<div class="flex flex-wrap gap-1.5">
					{#each informs as { entry } (entry.id)}
						<ElementChip element={entry} {onselect} />
					{/each}
				</div>
			{/snippet}
			{@render section('Most often used for', usedFor)}
		{/if}

		{#each CARD_KINDS.filter(({ value }) => related[value]?.length) as kind (kind.value)}
			{#snippet usedWith()}
				<ul class="space-y-0.5">
					{#each related[kind.value] as item (item.entry.id)}
						<li class="text-[13px]">
							<button
								class="cursor-pointer text-left text-foreground underline-offset-2 hover:underline"
								onclick={() => onpreview(item.entry.id)}
							>
								{item.entry.label}
							</button>
						</li>
					{/each}
				</ul>
			{/snippet}
			{@render section(`Used with these ${kind.label.toLowerCase()}`, usedWith)}
		{/each}

		{#snippet papers()}
			<PaperList
				papers={papersFor(content, card.papers)}
				highlight={new Set(card.items.map((item) => item.name))}
			/>
		{/snippet}
		{@render section('Example studies', papers)}
	</div>
{/snippet}

{#snippet noteView(node)}
	<header class="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
		<div class="space-y-1">
			{@render kicker(null, 'Your own', KIND_ICONS.note)}
			<h2 class="text-lg leading-tight font-semibold text-foreground">Note</h2>
		</div>
		<Button variant="outline" size="sm" class="cursor-pointer" onclick={() => onremove(node.id)}>
			<Trash2 />Remove from the board
		</Button>
	</header>
	<div class="columns-1 gap-8 @2xl:columns-2">
		{#snippet linkedTo()}
			{@render linked(node, 'Not linked yet.')}
		{/snippet}
		{@render section('Linked to', linkedTo)}
	</div>
{/snippet}

<div class="@container">
	{#if view.type === 'zone'}
		{@render zoneView(view.zone)}
	{:else if view.type === 'element'}
		{@render elementView(view.element, view.node)}
	{:else if view.type === 'card'}
		{@render cardView(view.card, view.node)}
	{:else}
		{@render noteView(view.node)}
	{/if}
</div>
