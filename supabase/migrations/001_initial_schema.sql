-- Production already has this table.
-- IF NOT EXISTS makes this safe to run
-- on a fresh database without failing
-- on production.

-- OrixLink AI — Initial Schema
-- Effective: 2026-03-24

-- ═══════════════════════════════════════════════════════════
-- Extensions
-- ═══════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp" with schema extensions;

-- ═══════════════════════════════════════════════════════════
-- Profiles
-- ═══════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on public.profiles for select
      using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles for update
      using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profile created on signup'
  ) then
    create policy "Profile created on signup"
      on public.profiles for insert
      with check (auth.uid() = id);
  end if;
end $$;

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- Sessions
-- ═══════════════════════════════════════════════════════════

create table if not exists public.sessions (
  id            uuid primary key default extensions.uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete set null,
  role          text not null check (role in ('patient', 'family', 'clinician')),
  context       text check (context in (
                  'recent_procedure', 'chronic_condition', 'new_symptoms',
                  'injury', 'pregnancy', 'pediatric', 'mental_health', 'other'
                )),
  language      text not null default 'English',
  urgency_level text check (urgency_level in (
                  'MONITOR_AT_HOME', 'CONTACT_DOCTOR_TODAY',
                  'URGENT_CARE', 'EMERGENCY_DEPARTMENT_NOW'
                )),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_sessions_user    on public.sessions(user_id);
create index if not exists idx_sessions_created on public.sessions(created_at desc);

alter table public.sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'Users can read own sessions'
  ) then
    create policy "Users can read own sessions"
      on public.sessions for select
      using (user_id is null or auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'Users can update own sessions'
  ) then
    create policy "Users can update own sessions"
      on public.sessions for update
      using (user_id is null or auth.uid() = user_id);
  end if;
end $$;

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Messages
-- ═══════════════════════════════════════════════════════════

create table if not exists public.messages (
  id         uuid primary key default extensions.uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_session on public.messages(session_id, created_at);

alter table public.messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Users can read messages for accessible sessions'
  ) then
    create policy "Users can read messages for accessible sessions"
      on public.messages for select
      using (
        exists (
          select 1 from public.sessions s
          where s.id = session_id
            and (s.user_id is null or s.user_id = auth.uid())
        )
      );
  end if;
end $$;
