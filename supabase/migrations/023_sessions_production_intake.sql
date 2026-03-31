-- Aligns public.sessions with Supabase production: optional clinical /
-- practice intake fields and permissive role / context / urgency
-- columns (CHECK constraints from the original seed migration removed).
-- language matches production (default English, nullable).

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS practice_code text;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS caregiver_role text;

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_role_check;

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_context_check;

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_urgency_level_check;

ALTER TABLE public.sessions
  ALTER COLUMN language DROP NOT NULL;
