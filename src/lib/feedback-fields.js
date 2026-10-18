/**
 * Feedback form fields shared by the form (src/lib/feedback.js) and the Pages
 * Function that validates and stores submissions (functions/api/feedback.js).
 * Keep this module free of SvelteKit imports: the Function bundles it directly.
 */
export const FEEDBACK_CATEGORIES = [
	{ value: 'bug', label: 'Bug report' },
	{ value: 'data', label: 'Question about the data' },
	{ value: 'suggestion', label: 'Suggestion' },
	{ value: 'other', label: 'Other comment' }
];

export const FEEDBACK_MESSAGE_MAX_LENGTH = 5000;
export const FEEDBACK_EMAIL_MAX_LENGTH = 254;
export const FEEDBACK_PAGE_MAX_LENGTH = 500;
