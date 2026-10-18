/**
 * Cloudflare Pages Function: POST /api/feedback.
 *
 * Validates a feedback form submission, checks its Turnstile token and stores
 * it in the D1 `feedback` table (db/feedback-schema.sql).
 *
 * Pages project settings it needs:
 *   - D1 database binding `DB`
 *   - encrypted variable `TURNSTILE_SECRET_KEY`
 */
import {
	FEEDBACK_CATEGORIES,
	FEEDBACK_EMAIL_MAX_LENGTH,
	FEEDBACK_MESSAGE_MAX_LENGTH,
	FEEDBACK_PAGE_MAX_LENGTH
} from '../../src/lib/feedback-fields.js';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const USER_AGENT_MAX_LENGTH = 500;
const CATEGORY_VALUES = FEEDBACK_CATEGORIES.map((category) => category.value);

function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

async function verifyTurnstile(secret, token, remoteip) {
	const response = await fetch(SITEVERIFY_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ secret, response: token, remoteip })
	});
	return response.json();
}

function readEntry(body) {
	const category = String(body.category ?? '');
	const message = String(body.message ?? '').trim();
	const email = String(body.email ?? '').trim();
	const page = String(body.page ?? '').slice(0, FEEDBACK_PAGE_MAX_LENGTH);

	if (!CATEGORY_VALUES.includes(category)) return { error: 'Unknown feedback type.' };
	if (!message) return { error: 'Please write a message.' };
	if (message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
		return { error: `Messages are limited to ${FEEDBACK_MESSAGE_MAX_LENGTH} characters.` };
	}
	if (email.length > FEEDBACK_EMAIL_MAX_LENGTH || (email && !email.includes('@'))) {
		return { error: 'Please check the email address.' };
	}
	return { entry: { category, message, email: email || null, page: page || null } };
}

export async function onRequestPost({ request, env }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return jsonResponse({ error: 'Invalid request.' }, 400);
	}

	const { entry, error } = readEntry(body ?? {});
	if (error) return jsonResponse({ error }, 400);

	const verification = await verifyTurnstile(
		env.TURNSTILE_SECRET_KEY,
		String(body.token ?? ''),
		request.headers.get('CF-Connecting-IP')
	);
	if (!verification.success) {
		return jsonResponse({ error: 'The spam check failed. Please try again.' }, 403);
	}

	await env.DB.prepare(
		`INSERT INTO feedback (category, message, email, page, country, user_agent)
		 VALUES (?, ?, ?, ?, ?, ?)`
	)
		.bind(
			entry.category,
			entry.message,
			entry.email,
			entry.page,
			request.cf?.country ?? null,
			request.headers.get('User-Agent')?.slice(0, USER_AGENT_MAX_LENGTH) ?? null
		)
		.run();

	return jsonResponse({ ok: true });
}
