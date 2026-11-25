<!--
  ZoneNode — the name of a zone (Drivers, Outcomes, ...) or of a box inside
  one (Food and nutrition security, ...) on the planner board. Clicking it
  opens the zone's definition, so every concept on the diagram explains
  itself where it is drawn.
-->
<script>
	let { data, selected } = $props();
</script>

<div
	class={['zone-label', data.sub && 'sub', selected && 'selected']}
	style:--zone="var(--zone-{data.zone})"
	title="What is this?"
>
	{data.label}
</div>

<style>
	.zone-label {
		padding: 2px 4px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		white-space: nowrap;
		color: color-mix(in oklab, var(--zone) 80%, var(--foreground));
		cursor: pointer;
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-decoration-color: color-mix(in oklab, var(--zone) 45%, transparent);
		text-underline-offset: 4px;
	}

	.zone-label.sub {
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
		color: color-mix(in oklab, var(--zone) 70%, var(--foreground));
	}

	.zone-label:hover,
	.zone-label.selected {
		text-decoration-style: solid;
		text-decoration-color: currentColor;
	}
</style>
