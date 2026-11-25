<!--
  ResilienceFigure — a sketch of how the three resilience capacities change
  food security over time after a shock, simplified from the review's figure:
  without them food security falls and recovers slowly; absorbing the shock
  means a smaller loss, adapting a faster recovery, and transforming a
  reconfigured system that a shock hits less.

  An <svg> of its own, so it can stand alone (in the questionnaire) or sit
  inside the board's diagram at `x`, `y`. `active` names the capacities in
  the plan; the others fade, and with none active all are drawn alike.
-->
<script>
	let { x = 0, y = 0, width = 800, height = 220, active = [], title = '' } = $props();

	const uid = $props.id();

	const REF = 110;
	const LOW = 186;
	const TOP = 58;
	// The shock symbol: a coil 50 wide, drawn relative to where the line is.
	const COIL = 'l 5 -9 l 6 18 l 6 -18 l 6 18 l 6 -18 l 6 18 l 6 -18 l 6 18 l 3 -9';

	const reference = `M 60 ${REF} H 170 ${COIL} L 320 ${LOW} L 600 ${REF} H 765`;
	const capacities = [
		{
			id: 'absorptive',
			line: `M 220 ${REF} L 320 140 L 490 ${REF}`,
			arrow: 'M 320 180 V 148',
			label: { x: 336, y: 122, anchor: 'middle', text: 'smaller loss' }
		},
		{
			id: 'adaptive',
			line: `M 320 ${LOW} L 500 ${REF}`,
			arrow: 'M 596 96 H 508',
			label: { x: 552, y: 86, anchor: 'middle', text: 'faster recovery' }
		},
		{
			id: 'transformative',
			line: `M 60 ${TOP} H 170 ${COIL} L 290 78 L 360 ${TOP} H 765`,
			arrow: 'M 730 104 C 752 96, 752 72, 734 64',
			label: { x: 718, y: 90, anchor: 'end', text: 'reconfiguration' }
		}
	];

	const faded = (id) => active.length > 0 && !active.includes(id);
</script>

<svg
	{x}
	{y}
	{width}
	{height}
	viewBox="0 0 800 220"
	class="resilience-figure"
	role={title ? 'img' : undefined}
	aria-label={title || undefined}
	aria-hidden={title ? undefined : 'true'}
>
	<defs>
		{#each [{ id: 'axis' }, ...capacities] as kind (kind.id)}
			<marker
				id="{uid}-{kind.id}"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="7"
				markerHeight="7"
				orient="auto"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" class="head {kind.id}" />
			</marker>
		{/each}
	</defs>

	<path class="axis" d="M 40 200 V 18" marker-end="url(#{uid}-axis)" />
	<path class="axis" d="M 40 200 H 785" marker-end="url(#{uid}-axis)" />
	<text class="axis-label" transform="translate(26 110) rotate(-90)" text-anchor="middle">
		food security
	</text>
	<text class="axis-label" x="785" y="216" text-anchor="end">time</text>

	<path class="line reference" d={reference} />

	{#each capacities as capacity (capacity.id)}
		<g class={['capacity', capacity.id, faded(capacity.id) && 'faded']}>
			<path class="line" d={capacity.line} />
			<path class="effect" d={capacity.arrow} marker-end="url(#{uid}-{capacity.id})" />
			<text x={capacity.label.x} y={capacity.label.y} text-anchor={capacity.label.anchor}>
				{capacity.label.text}
			</text>
		</g>
	{/each}
</svg>

<style>
	.resilience-figure {
		overflow: visible;
		font-family: inherit;
	}

	.axis {
		fill: none;
		stroke: var(--planner-line);
		stroke-width: 1.25;
	}

	.axis-label {
		font-size: 12px;
		fill: var(--muted-foreground);
	}

	.line {
		fill: none;
		stroke-width: 2.5;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.reference {
		stroke: var(--cap-reference);
	}

	.capacity {
		transition: opacity 150ms;
	}

	.absorptive {
		--cap: var(--cap-absorptive);
		--cap-text: var(--cap-absorptive);
	}

	.adaptive {
		--cap: var(--cap-adaptive);
		--cap-text: var(--cap-adaptive);
	}

	.transformative {
		--cap: var(--cap-transformative);
		--cap-text: var(--cap-transformative-text);
	}

	.capacity .line,
	.effect {
		stroke: var(--cap);
	}

	.effect {
		fill: none;
		stroke-width: 1.5;
	}

	.head {
		fill: var(--cap);
	}

	.head.axis {
		fill: var(--planner-line);
	}

	.capacity text {
		fill: var(--cap-text);
		font-size: 12.5px;
		font-style: italic;
	}

	.faded {
		opacity: 0.2;
	}
</style>
