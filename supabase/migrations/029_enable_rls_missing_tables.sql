-- 029_enable_rls_missing_tables.sql
-- Fixes Supabase advisor rls_disabled_in_public: enable RLS on tables that
-- were created without ALTER TABLE ... ENABLE ROW LEVEL SECURITY, and add
-- policies so authenticated clients are not accidentally locked out where
-- they should have access. Service role and security definer routines bypass RLS.

-- ---------------------------------------------------------------------------
-- anonymous_assessments
-- Missing RLS: migration 012 created the table and documented service-role-only
-- writes; no ENABLE ROW LEVEL SECURITY was applied. Anonymous rate-limit rows
-- must not be readable or writable with the anon/authenticated keys.
-- ---------------------------------------------------------------------------
ALTER TABLE public.anonymous_assessments ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only service_role (API/cron) may access.
-- pg_cron jobs run with elevated privileges and bypass RLS.

-- ---------------------------------------------------------------------------
-- practice_accounts
-- Missing RLS: migration 021 documented production tables but did not enable RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.practice_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practice_accounts'
      AND policyname = 'practice_accounts_owner_all'
  ) THEN
    CREATE POLICY "practice_accounts_owner_all"
      ON public.practice_accounts
      FOR ALL
      TO authenticated
      USING (
        owner_user_id IS NOT NULL
        AND auth.uid() = owner_user_id
      )
      WITH CHECK (
        owner_user_id IS NOT NULL
        AND auth.uid() = owner_user_id
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- practice_seats
-- Missing RLS: migration 021 did not enable RLS.
-- Owners manage seats; seated users can read their own row.
-- ---------------------------------------------------------------------------
ALTER TABLE public.practice_seats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practice_seats'
      AND policyname = 'practice_seats_select_own_or_owner'
  ) THEN
    CREATE POLICY "practice_seats_select_own_or_owner"
      ON public.practice_seats
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1
          FROM public.practice_accounts pa
          WHERE pa.id = practice_seats.practice_id
            AND pa.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practice_seats'
      AND policyname = 'practice_seats_owner_insert'
  ) THEN
    CREATE POLICY "practice_seats_owner_insert"
      ON public.practice_seats
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.practice_accounts pa
          WHERE pa.id = practice_id
            AND pa.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practice_seats'
      AND policyname = 'practice_seats_owner_update'
  ) THEN
    CREATE POLICY "practice_seats_owner_update"
      ON public.practice_seats
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.practice_accounts pa
          WHERE pa.id = practice_seats.practice_id
            AND pa.owner_user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.practice_accounts pa
          WHERE pa.id = practice_id
            AND pa.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practice_seats'
      AND policyname = 'practice_seats_owner_delete'
  ) THEN
    CREATE POLICY "practice_seats_owner_delete"
      ON public.practice_seats
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.practice_accounts pa
          WHERE pa.id = practice_seats.practice_id
            AND pa.owner_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- practice_sessions
-- Missing RLS: migration 021 did not enable RLS.
-- Practice owner or any seated provider linked to the practice may access rows.
-- ---------------------------------------------------------------------------
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practice_sessions'
      AND policyname = 'practice_sessions_member_all'
  ) THEN
    CREATE POLICY "practice_sessions_member_all"
      ON public.practice_sessions
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.practice_accounts pa
          WHERE pa.id = practice_sessions.practice_id
            AND pa.owner_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.practice_seats ps
          WHERE ps.practice_id = practice_sessions.practice_id
            AND ps.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.practice_accounts pa
          WHERE pa.id = practice_id
            AND pa.owner_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.practice_seats ps
          WHERE ps.practice_id = practice_id
            AND ps.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- webhook_events
-- RLS was enabled in migration 011 with no policies (Stripe webhook uses
-- service role only). Some advisors flag “RLS on, zero policies.” Explicit
-- deny policies document intent and satisfy tooling; service_role still bypasses RLS.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'webhook_events'
      AND policyname = 'webhook_events_no_anon'
  ) THEN
    CREATE POLICY "webhook_events_no_anon"
      ON public.webhook_events
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'webhook_events'
      AND policyname = 'webhook_events_no_authenticated'
  ) THEN
    CREATE POLICY "webhook_events_no_authenticated"
      ON public.webhook_events
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;
