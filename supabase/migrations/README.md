# OrixLink AI -- Database Migrations

## Migration order

Run migrations in numerical order. Each migration
has dependency comments at the top of the file.

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

## Production database

The production database at Supabase project
`wgsczpvubfdgwqtmlzon` has all migrations applied.
Do not re-run migrations against production.
New deployments should run migrations in order
against a fresh database only.
