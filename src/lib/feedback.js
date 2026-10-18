/**
 * Site feedback form: Turnstile spam check and submission to the
 * `/api/feedback` Pages Function, which stores entries in the D1 `feedback`
 * table (schema in db/feedback-schema.sql).
 *
 * The form is hidden unless PUBLIC_TURNSTILE_SITE_KEY is set, so a deployment
 * without the Cloudflare side configured never shows a form that cannot send.
 */
import { env } from '$env/dynamic/public';

export {
	FEEDBACK_CATEGORIES,
	FEEDBACK_MESSAGE_MAX_LENGTH,
	FEEDBACK_EMAIL_MAX_LENGTH
} from './feedback-fields.js';

const FEEDBACK_ENDPOINT = '/api/feedback';
const TURNSTILE_ONLOAD = 'onTurnstileLoad';
const TURNSTILE_SCRIPT_URL = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${TURNSTILE_ONLOAD}`;

let turnstileLoading;

export const isFeedbackAvailable = () => Boolean(env.PUBLIC_TURNSTILE_SITE_KEY);

function loadTurnstile() {
	turnstileLoading ??= new Promise((resolve, reject) => {
		window[TURNSTILE_ONLOAD] = () => resolve(window.turnstile);
		const script = document.createElement('script');
		script.src = TURNSTILE_SCRIPT_URL;
		script.async = true;
		script.onerror = () => {
			turnstileLoading = undefined;
			script.remove();
			reject(new Error('The spam check could not be loaded.'));
		};
		document.head.appendChild(script);
	});
	return turnstileLoading;
}

/**
 * Svelte attachment that renders a Turnstile widget into its node.
 * `onToken` receives the token, or '' once it expires, fails or is removed.
 * The widget only shows itself when Cloudflare wants an interactive check.
 */
export function turnstileWidget({ dark, onToken, onError }) {
	return (node) => {
		let widgetId;
		let removed = false;
		loadTurnstile().then(
			(turnstile) => {
				if (removed) return;
				widgetId = turnstile.render(node, {
					sitekey: env.PUBLIC_TURNSTILE_SITE_KEY,
					theme: dark ? 'dark' : 'light',
					size: 'flexible',
					appearance: 'interaction-only',
					callback: onToken,
					'expired-callback': () => onToken(''),
					'error-callback': () => {
						onToken('');
						onError?.('The spam check failed. Please reload the page and try again.');
					}
				});
			},
			(error) => onError?.(error.message)
		);
		return () => {
			removed = true;
			if (widgetId !== undefined) window.turnstile.remove(widgetId);
			onToken('');
		};
	};
}

export async function submitFeedback(entry) {
	let response;
	try {
		response = await fetch(FEEDBACK_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(entry)
		});
	} catch {
		throw new Error('Feedback could not be sent. Check your connection and try again.');
	}
	const result = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(result.error ?? 'Feedback could not be sent. Please try again later.');
	}
}
