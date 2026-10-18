/*
D1 table behind the site feedback form (functions/api/feedback.js).
Apply by pasting into the D1 Console in the Cloudflare dashboard, or with:
pnpm dlx wrangler d1 execute fis-feedback --remote --file db/feedback-schema.sql
Block comments, not `--`: the Console joins pasted lines into one, so a `--`
comment would swallow the statement.
`status` and `notes` are for triage by hand (e.g. new -> seen -> done).
*/
CREATE TABLE IF NOT EXISTS feedback (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
	category TEXT NOT NULL,
	message TEXT NOT NULL,
	email TEXT,
	page TEXT,
	country TEXT,
	user_agent TEXT,
	status TEXT NOT NULL DEFAULT 'new',
	notes TEXT
);
