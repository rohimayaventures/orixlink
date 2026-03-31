-- Matches Supabase production: dependents.owner_user_id and
-- credits.user_id are nullable (FKs still reference auth.users when set).
-- Prior migrations used NOT NULL on these columns.

ALTER TABLE public.dependents
  ALTER COLUMN owner_user_id DROP NOT NULL;

ALTER TABLE public.credits
  ALTER COLUMN user_id DROP NOT NULL;
