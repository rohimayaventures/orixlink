-- Subscriptions, usage, credits for OrixLink auth + billing

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'active',
  is_lifetime boolean not null default false,
  assessments_cap int not null default 5,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "Service insert subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create table public.usage_tracking (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year_month text not null,
  assessments_used int not null default 0,
  assessments_cap int not null default 5,
  unique(user_id, year_month)
);

create index idx_usage_tracking_user_month on public.usage_tracking(user_id, year_month);

alter table public.usage_tracking enable row level security;

create policy "Users read own usage"
  on public.usage_tracking for select
  using (auth.uid() = user_id);

create policy "Users insert own usage"
  on public.usage_tracking for insert
  with check (auth.uid() = user_id);

create policy "Users update own usage"
  on public.usage_tracking for update
  using (auth.uid() = user_id);

create table public.credits (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credits_remaining int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_credits_user on public.credits(user_id);

alter table public.credits enable row level security;

create policy "Users read own credits"
  on public.credits for select
  using (auth.uid() = user_id);

create policy "Users insert own credits"
  on public.credits for insert
  with check (auth.uid() = user_id);

create policy "Users update own credits"
  on public.credits for update
  using (auth.uid() = user_id);
