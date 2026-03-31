# OrixLink AI -- Database Migrations

## Migration order

Run migrations in numerical order. Each migration
has dependency comments at the top of the file.

## Idempotency (fresh DB + production)

All migrations are written to be **safe to re-run**:

- `CREATE TABLE IF NOT EXISTS` for tables that already exist in production
- `CREATE INDEX IF NOT EXISTS` where indexes are created
- `ADD COLUMN IF NOT EXISTS` for additive column changes
- Row-level security policies are created inside `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_policies ...)`
  blocks so duplicate policy names do not error
- RPCs (`attempt_assessment`, `rollback_assessment`, `consume_one_credit`, etc.) use
  `CREATE OR REPLACE FUNCTION`
- Unique constraints and similar objects use `DO $$` checks against `pg_constraint` when needed

Files that bootstrap core tables (001, 002, etc.) include a short banner comment noting that
production already has those objects and that `IF NOT EXISTS` avoids failures on apply.

## Key dependencies

- 006 (assessment RPCs) requires 002, 004, and 007
- 007 (period_month rename) requires 002
- 009 (reminders) requires pg_cron and pg_net
  extensions enabled manually first
- 011 (webhook_events) is safe to run independently
- 012 (anonymous rate limiting) is safe to run
  independently

## Extensions required

Run in Supabase SQL editor before migrations:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## pg_cron job

After running 009, create the hourly reminder
cron job manually in Supabase SQL editor:

```sql
SELECT cron.schedule(
  'send-orixlink-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://triage.rohimaya.ai/api/reminders/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace `YOUR_CRON_SECRET` with the value
of your `CRON_SECRET` environment variable.

After running 017, schedule the anonymous
data retention cleanup job manually in
Supabase SQL editor (same manual pattern):

```sql
SELECT cron.schedule(
  'delete-old-anonymous-assessments',
  '0 3 * * *',
  $$
  DELETE FROM public.anonymous_assessments
  WHERE created_at < now() - interval '30 days';
  $$
);
```

Migration 018 must be run manually in Supabase
SQL editor. It creates a trigger on `auth.users`
which requires running as `postgres` role, not
via Supabase migrations API.

Migration 019 must be run manually in
Supabase SQL editor. It replaces the
`attempt_assessment` function with a
family-pool-aware version. Run with
`postgres` role. Safe to re-run
(`CREATE OR REPLACE`).

## Production database

The production database at Supabase project
`wgsczpvubfdgwqtmlzon` reflects the live schema.
Migrations are aligned for **idempotent** application
on fresh databases and for **no-op or safe additive**
behavior when re-applied where objects already exist.

New environments should run migrations in order
from an empty database, or rely on Supabase migration
history so each file runs once.
