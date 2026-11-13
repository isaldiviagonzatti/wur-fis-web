<!--
  FeedbackButton — a small box fixed to the bottom-right corner of every page
  that opens the feedback form. Only its icon shows; the word slides out beside
  it on hover or keyboard focus. The box is anchored on the right, so it grows
  to the left and the icon stays put. The accent outline keeps it visible over
  the footer, which is the same slate.
-->
<script>
	import MessageSquare from '@lucide/svelte/icons/message-square';

	let { onclick } = $props();
</script>

<button
	type="button"
	{onclick}
	aria-label="Send feedback"
	class="group fixed right-4 bottom-4 z-40 flex h-10 cursor-pointer items-center rounded-md bg-brand px-3 text-sm font-medium text-brand-foreground shadow-lg ring-1 ring-brand-accent transition-shadow hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
>
	<span
		class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:mr-2 group-hover:max-w-24 group-hover:opacity-100 group-focus-visible:mr-2 group-focus-visible:max-w-24 group-focus-visible:opacity-100"
	>
		Feedback
	</span>
	<MessageSquare size={16} aria-hidden="true" />
</button>
