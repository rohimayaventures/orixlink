-- Prevents duplicate credit rows on Stripe
-- webhook retries. If addCredits succeeds but
-- webhook_events insert fails, Stripe retries
-- and the unique constraint blocks the duplicate.
ALTER TABLE credits
ADD CONSTRAINT credits_stripe_payment_intent_id_key
UNIQUE (stripe_payment_intent_id);

-- Note: only run this migration on a fresh
-- database. Production already has the
-- constraint applied via SQL editor.
