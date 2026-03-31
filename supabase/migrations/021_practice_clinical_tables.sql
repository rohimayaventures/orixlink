-- Documents Supabase production tables practice_accounts,
-- practice_seats, and practice_sessions.
-- These objects existed in production but had no prior migration in
-- this repo. Idempotent: tables use IF NOT EXISTS; FKs and UNIQUE
-- are added only when missing.

CREATE TABLE IF NOT EXISTS public.practice_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  practice_name text NOT NULL,
  access_code text NOT NULL,
  notification_email text,
  notification_phone text,
  notification_threshold text DEFAULT 'tier3'::text,
  digest_time text DEFAULT '08:00'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT practice_accounts_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'practice_accounts'
      AND c.conname = 'practice_accounts_access_code_key'
  ) THEN
    ALTER TABLE public.practice_accounts
      ADD CONSTRAINT practice_accounts_access_code_key UNIQUE (access_code);
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
      AND t.relname = 'practice_accounts'
      AND c.conname = 'practice_accounts_owner_user_id_fkey'
  ) THEN
    ALTER TABLE public.practice_accounts
      ADD CONSTRAINT practice_accounts_owner_user_id_fkey
        FOREIGN KEY (owner_user_id) REFERENCES auth.users (id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.practice_seats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practice_id uuid,
  user_id uuid,
  role text DEFAULT 'provider'::text,
  stripe_seat_subscription_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT practice_seats_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'practice_seats'
      AND c.conname = 'practice_seats_practice_id_fkey'
  ) THEN
    ALTER TABLE public.practice_seats
      ADD CONSTRAINT practice_seats_practice_id_fkey
        FOREIGN KEY (practice_id) REFERENCES public.practice_accounts (id);
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
      AND t.relname = 'practice_seats'
      AND c.conname = 'practice_seats_user_id_fkey'
  ) THEN
    ALTER TABLE public.practice_seats
      ADD CONSTRAINT practice_seats_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users (id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practice_id uuid,
  session_id uuid,
  patient_identifier text,
  patient_consented boolean DEFAULT false,
  consented_at timestamp with time zone,
  needs_followup boolean DEFAULT false,
  urgency_level text,
  chief_complaint text,
  notified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT practice_sessions_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'practice_sessions'
      AND c.conname = 'practice_sessions_practice_id_fkey'
  ) THEN
    ALTER TABLE public.practice_sessions
      ADD CONSTRAINT practice_sessions_practice_id_fkey
        FOREIGN KEY (practice_id) REFERENCES public.practice_accounts (id);
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
      AND t.relname = 'practice_sessions'
      AND c.conname = 'practice_sessions_session_id_fkey'
  ) THEN
    ALTER TABLE public.practice_sessions
      ADD CONSTRAINT practice_sessions_session_id_fkey
        FOREIGN KEY (session_id) REFERENCES public.sessions (id);
  END IF;
END $$;
