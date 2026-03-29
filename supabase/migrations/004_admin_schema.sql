-- Admin dashboard: expanded tiers, subscription billing fields, credits metadata, usage_tracking.updated_at

alter table public.subscriptions drop constraint if exists subscriptions_tier_check;
alter table public.subscriptions
  add constraint subscriptions_tier_check
  check (tier in ('free', 'pro', 'family', 'clinical', 'lifetime'));

alter table public.subscriptions
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.usage_tracking
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.usage_tracking_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists usage_tracking_touch_updated_at on public.usage_tracking;
create trigger usage_tracking_touch_updated_at
  before update on public.usage_tracking
  for each row execute function public.usage_tracking_touch_updated_at();

alter table public.credits
  add column if not exists credits_purchased int not null default 0,
  add column if not exists pack_name text,
  add column if not exists purchased_at timestamptz not null default now(),
  add column if not exists frozen boolean not null default false;

update public.credits set purchased_at = coalesce(purchased_at, created_at);
