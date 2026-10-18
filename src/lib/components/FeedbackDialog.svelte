<script>
	import { page } from '$app/state';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import LabeledSelect from '$lib/components/LabeledSelect.svelte';
	import { theme } from '$lib/theme.svelte.js';
	import {
		FEEDBACK_CATEGORIES,
		FEEDBACK_EMAIL_MAX_LENGTH,
		FEEDBACK_MESSAGE_MAX_LENGTH,
		submitFeedback,
		turnstileWidget
	} from '$lib/feedback.js';

	let { open = $bindable(false) } = $props();

	let category = $state(FEEDBACK_CATEGORIES[0].value);
	let message = $state('');
	let email = $state('');
	let token = $state('');
	let sending = $state(false);
	let sent = $state(false);
	let errorMessage = $state('');
	// Turnstile tokens are single-use: bumping this re-renders the widget for a retry.
	let widgetKey = $state(0);

	const canSend = $derived(Boolean(message.trim()) && Boolean(token) && !sending);

	async function handleSubmit(event) {
		event.preventDefault();
		if (!canSend) return;
		sending = true;
		errorMessage = '';
		try {
			await submitFeedback({
				category,
				message,
				email,
				page: page.url.pathname + page.url.search,
				token
			});
			sent = true;
			message = '';
			email = '';
		} catch (error) {
			errorMessage = error.message;
			widgetKey += 1;
		} finally {
			sending = false;
		}
	}

	function handleOpenChangeComplete(isOpen) {
		if (!isOpen) {
			sent = false;
			errorMessage = '';
		}
	}
</script>

<Dialog.Root bind:open onOpenChangeComplete={handleOpenChangeComplete}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Send feedback</Dialog.Title>
			<Dialog.Description>
				Report a bug, ask about the data or suggest an improvement. The page you are on is
				saved with your message.
			</Dialog.Description>
		</Dialog.Header>

		{#if sent}
			<p class="text-sm">Thank you. Your feedback has been saved.</p>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (open = false)} style="cursor: pointer;">
					Close
				</Button>
			</Dialog.Footer>
		{:else}
			<form class="grid gap-4" onsubmit={handleSubmit}>
				<div class="grid gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Type</span>
					<LabeledSelect
						bind:value={category}
						options={FEEDBACK_CATEGORIES}
						showLabel={false}
						widthClass="w-full"
						triggerStyle="cursor: pointer;"
					/>
				</div>

				<div class="grid gap-1.5">
					<label for="feedback-message" class="text-xs font-medium text-muted-foreground">
						Message
					</label>
					<Textarea
						id="feedback-message"
						bind:value={message}
						maxlength={FEEDBACK_MESSAGE_MAX_LENGTH}
						required
						rows={5}
						class="max-h-64"
						placeholder="What happened, or what would you like to see?"
					/>
				</div>

				<div class="grid gap-1.5">
					<label for="feedback-email" class="text-xs font-medium text-muted-foreground">
						Email (optional, only if you would like a reply)
					</label>
					<Input
						id="feedback-email"
						type="email"
						bind:value={email}
						maxlength={FEEDBACK_EMAIL_MAX_LENGTH}
						autocomplete="email"
					/>
				</div>

				{#key widgetKey}
					<div
						{@attach turnstileWidget({
							dark: theme.dark,
							onToken: (value) => (token = value),
							onError: (text) => (errorMessage = text)
						})}
					></div>
				{/key}

				{#if errorMessage}
					<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
				{:else if !token}
					<p class="text-xs text-muted-foreground">Running a quick spam check...</p>
				{/if}

				<Dialog.Footer>
					<Button
						variant="outline"
						onclick={() => (open = false)}
						style="cursor: pointer;"
					>
						Cancel
					</Button>
					<Button type="submit" disabled={!canSend} style="cursor: pointer;">
						{sending ? 'Sending...' : 'Send'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
