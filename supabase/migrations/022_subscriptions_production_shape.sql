-- Aligns public.subscriptions with Supabase production:
-- surrogate primary key (id), UNIQUE(user_id), current_period_start,
-- and no assessments_cap column on this table (caps live in
-- usage_tracking in production).
-- Prior repo migrations used user_id as the primary key and added
-- assessments_cap here; production schema uses id as PK instead.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

UPDATE public.subscriptions
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN id SET NOT NULL;

DO $$
DECLARE
  pk_def text;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
  INTO pk_def
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'subscriptions'
    AND c.contype = 'p'
  LIMIT 1;

  IF pk_def IS NULL THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
  ELSIF position('(user_id)' in pk_def) > 0
    AND position('(id)' in pk_def) = 0 THEN
    ALTER TABLE public.subscriptions
      DROP CONSTRAINT subscriptions_pkey;
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'subscriptions'
      AND c.conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END $$;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start timestamp with time zone;

ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS assessments_cap;

ALTER TABLE public.subscriptions
  ALTER COLUMN user_id DROP NOT NULL;
