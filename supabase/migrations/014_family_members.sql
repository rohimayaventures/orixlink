-- Production already has this table.
-- IF NOT EXISTS makes this safe to run
-- on a fresh database without failing
-- on production.

-- Family plan: invites and member seats (owner + up to 6 members)

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  member_user_id uuid references auth.users (id) on delete set null,
  invited_email text,
  invite_code text not null,
  status text not null check (status in ('pending', 'active', 'removed')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz
);

-- Same code is shared across all seats for one owner (multiple rows).
create index if not exists family_members_invite_code_idx
  on public.family_members (invite_code);

create index if not exists family_members_owner_idx
  on public.family_members (owner_user_id);

create index if not exists family_members_code_pending_idx
  on public.family_members (invite_code)
  where status = 'pending';

alter table public.family_members enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'family_members'
      and policyname = 'family_members_owner_all'
  ) then
    create policy "family_members_owner_all"
      on public.family_members
      for all
      to authenticated
      using (auth.uid() = owner_user_id)
      with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'family_members'
      and policyname = 'family_members_member_select'
  ) then
    create policy "family_members_member_select"
      on public.family_members
      for select
      to authenticated
      using (auth.uid() = member_user_id);
  end if;
end $$;
