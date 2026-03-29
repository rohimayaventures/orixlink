-- Production already has this table.
-- IF NOT EXISTS makes this safe to run
-- on a fresh database without failing
-- on production.

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_events
  ENABLE ROW LEVEL SECURITY;
