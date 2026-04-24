-- Allows code-only family invite rows where invited_email is not known yet.
-- This resolves the runtime mismatch where generate-code creates pending
-- invite-code rows before a recipient email is attached at join time.

ALTER TABLE public.family_members
  ALTER COLUMN invited_email DROP NOT NULL;
