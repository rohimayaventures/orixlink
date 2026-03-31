-- Scheduled deletion of anonymous_assessments rows
-- older than 30 days. Fulfills the retention policy
-- disclosed in the legal page.
-- Run manually in Supabase SQL editor after deploying.

-- Enable pg_cron if not already enabled (requires
-- Supabase dashboard: Database > Extensions > pg_cron)

SELECT cron.schedule(
  'delete-old-anonymous-assessments',
  '0 3 * * *',
  $$
  DELETE FROM public.anonymous_assessments
  WHERE created_at < now() - interval '30 days';
  $$
);
