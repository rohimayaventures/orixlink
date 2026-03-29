-- Production already has this table.
-- IF NOT EXISTS makes this safe to run
-- on a fresh database without failing
-- on production.

-- No RLS applied intentionally -- this table
--   is written by service role only.
-- Fingerprint and IP retained 30 days per
--   privacy policy (app/legal/page.tsx).

CREATE TABLE IF NOT EXISTS public.anonymous_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint text NOT NULL,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anon_fingerprint
  ON public.anonymous_assessments(fingerprint);
CREATE INDEX IF NOT EXISTS idx_anon_created_at
  ON public.anonymous_assessments(created_at);
