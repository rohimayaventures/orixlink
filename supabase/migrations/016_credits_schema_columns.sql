-- Adds frozen_at and expires_at to credits if not present.
-- Production already has these columns. This migration
-- ensures fresh deployments from repo migrations match
-- the live schema.

ALTER TABLE public.credits
ADD COLUMN IF NOT EXISTS frozen_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Remove frozen boolean if it exists from earlier migrations
-- (superseded by frozen_at timestamp)
ALTER TABLE public.credits
DROP COLUMN IF EXISTS frozen;
