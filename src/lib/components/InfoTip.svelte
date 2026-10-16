<!--
  InfoTip — a short explanation on hover or keyboard focus, and on tap for
  touch screens, which have no hover.

  With children, the term itself is the trigger and the icon follows it; without,
  the icon stands alone next to a control that cannot contain a button.
-->
<script>
	import { Tooltip } from 'bits-ui';
	import Info from '@lucide/svelte/icons/info';

	let { text, side = 'top', label = 'More information', class: className = '', children } = $props();

	let open = $state(false);
	let touched = false;
</script>

<Tooltip.Root bind:open disableCloseOnTriggerClick>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<button
				type="button"
				{...props}
				onpointerdowncapture={(event) => (touched = event.pointerType === 'touch')}
				onclick={() => {
					if (touched) open = !open;
				}}
				aria-label={children ? undefined : label}
				class={['inline-flex cursor-help items-center gap-1 text-left', className]}
			>
				{@render children?.()}
				<Info size={13} class="shrink-0 opacity-60" aria-hidden="true" />
			</button>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content
			sideOffset={6}
			{side}
			collisionPadding={12}
			class="bg-popover text-popover-foreground z-[9999] max-w-72 rounded-md border px-3 py-2 text-[13px] leading-snug font-normal shadow-md"
		>
			{text}
		</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>
