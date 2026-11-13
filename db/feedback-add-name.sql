/*
Adds the `name` column to a feedback table created before the form had a Name
field. Run it once on the live database before pushing the code that writes
the column, or every submission fails:
pnpm dlx wrangler d1 execute fis-feedback --remote --file db/feedback-add-name.sql
A table created from the current db/feedback-schema.sql already has the column.
*/
ALTER TABLE feedback ADD COLUMN name TEXT;
