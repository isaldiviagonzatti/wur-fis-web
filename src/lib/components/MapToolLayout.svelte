<!--
  MapToolLayout — the columns of a map tool: optional controls, the map, and the
  details of what was clicked on it.

  On wide screens (xl) the details sit to the right of the map, so the place and
  its charts are seen side by side. Narrower screens stack them below the map.
  The details column is there before anything is clicked, so a click never
  resizes the map. It is a size container: panels inside lay themselves out by
  its width (`@4xl:` etc.), not the screen's, since the same panel is narrow
  beside the map and wide below it.

  `mapHeight` (a CSS length, or null) is how tall the map should be beside the
  details on xl, so a page can end its map where part of its place card ends.
  The map frame reads it through TOOL_MAP_FRAME_HEIGHT (map-config.js).

  `matchHeights` instead stretches the map area and the details to one height on
  xl, the taller one's, for details no taller than a screen (crop calendars).
  Nothing is then sticky; the page's map area and details fill their cells.
-->
<script>
	let {
		controls,
		mapArea,
		details,
		mapHeight = null,
		matchHeights = false,
		class: className = ''
	} = $props();

	// Beside the details, controls and map stay in view while the charts, often
	// taller than the map, scroll past them.
	const STICKY = $derived(matchHeights ? '' : 'xl:sticky xl:top-3 xl:self-start');
</script>

<div
	class={[
		'grid gap-3',
		controls
			? 'lg:grid-cols-[var(--tool-panel-width)_minmax(0,1fr)] xl:grid-cols-[var(--tool-panel-width)_minmax(0,1fr)_minmax(0,1fr)]'
			: 'xl:grid-cols-2',
		className
	]}
>
	{#if controls}
		<div class={STICKY}>{@render controls()}</div>
	{/if}
	<div class={STICKY} style:--map-match-height={mapHeight}>{@render mapArea()}</div>
	<div class={['@container min-w-0', controls && 'lg:col-span-2 xl:col-span-1']}>
		{@render details()}
	</div>
</div>
