-- Ensures one usage_tracking row per (user_id, period_month), matching
-- ON CONFLICT (user_id, period_month) in RPCs (e.g. 019_family_pool_rpc).
-- The production schema export did not list this unique index; the live
-- database and app depend on it. Idempotent via index-existence check.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'usage_tracking'
      AND indexdef ILIKE '%unique%'
      AND indexdef ILIKE '%user_id%'
      AND indexdef ILIKE '%period_month%'
  ) THEN
    CREATE UNIQUE INDEX usage_tracking_user_id_period_month_key
      ON public.usage_tracking (user_id, period_month);
  END IF;
END $$;
