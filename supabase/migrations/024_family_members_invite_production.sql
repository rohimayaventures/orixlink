-- Aligns public.family_members with Supabase production: invited_email
-- is NOT NULL, invite_code has a generated default and is UNIQUE
-- (one code per row). Drops the non-unique index from the earlier
-- family migration in favor of the production unique constraint.
-- If duplicate invite_code values exist, resolve them before applying.

UPDATE public.family_members
SET invited_email = coalesce(invited_email, '')
WHERE invited_email IS NULL;

ALTER TABLE public.family_members
  ALTER COLUMN invited_email SET NOT NULL;

ALTER TABLE public.family_members
  ALTER COLUMN invite_code DROP NOT NULL;

ALTER TABLE public.family_members
  ALTER COLUMN invite_code
    SET DEFAULT substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);

DROP INDEX IF EXISTS public.family_members_invite_code_idx;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'family_members'
      AND c.conname = 'family_members_invite_code_key'
  ) THEN
    ALTER TABLE public.family_members
      ADD CONSTRAINT family_members_invite_code_key UNIQUE (invite_code);
  END IF;
END $$;
