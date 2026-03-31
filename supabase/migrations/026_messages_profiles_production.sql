-- Matches Supabase production: messages.role is unchecked free text,
-- and profiles.is_admin is optional with default false (no NOT NULL).

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_role_check;

ALTER TABLE public.profiles
  ALTER COLUMN is_admin DROP NOT NULL;
