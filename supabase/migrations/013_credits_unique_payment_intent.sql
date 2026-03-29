-- Prevents duplicate credit rows on Stripe
-- webhook retries. If addCredits succeeds but
-- webhook_events insert fails, Stripe retries
-- and the unique constraint blocks the duplicate.

alter table public.credits
  add column if not exists stripe_payment_intent_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'credits'
      and c.conname = 'credits_stripe_payment_intent_id_key'
  ) then
    alter table public.credits
      add constraint credits_stripe_payment_intent_id_key
      unique (stripe_payment_intent_id);
  end if;
end $$;
