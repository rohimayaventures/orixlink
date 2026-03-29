-- Production already has this table.
-- IF NOT EXISTS makes this safe to run
-- on a fresh database without failing
-- on production.

-- Dependent profiles (Pro / Family): who is being assessed

create table if not exists public.dependents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  age_range text,
  relevant_conditions text,
  created_at timestamptz not null default now()
);

create index if not exists dependents_owner_idx
  on public.dependents (owner_user_id);

alter table public.sessions
  add column if not exists dependent_id uuid references public.dependents (id) on delete set null;

create index if not exists sessions_dependent_idx
  on public.sessions (dependent_id);

alter table public.dependents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'dependents'
      and policyname = 'dependents_owner_select'
  ) then
    create policy "dependents_owner_select"
      on public.dependents for select to authenticated
      using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'dependents'
      and policyname = 'dependents_owner_insert'
  ) then
    create policy "dependents_owner_insert"
      on public.dependents for insert to authenticated
      with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'dependents'
      and policyname = 'dependents_owner_update'
  ) then
    create policy "dependents_owner_update"
      on public.dependents for update to authenticated
      using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'dependents'
      and policyname = 'dependents_owner_delete'
  ) then
    create policy "dependents_owner_delete"
      on public.dependents for delete to authenticated
      using (auth.uid() = owner_user_id);
  end if;
end $$;
