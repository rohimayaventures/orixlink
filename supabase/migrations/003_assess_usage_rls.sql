-- Per-user assessment cap column, tighten RLS (server-only session/message inserts), usage RPCs

alter table public.subscriptions
  add column if not exists assessments_cap int not null default 5;

drop policy if exists "Anon users can create sessions" on public.sessions;
drop policy if exists "Anon users can insert messages" on public.messages;

create or replace function public.consume_one_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  select c.id into rid
  from public.credits c
  where c.user_id = p_user_id and c.credits_remaining > 0
  order by c.created_at asc
  limit 1
  for update skip locked;

  if rid is null then
    return false;
  end if;

  update public.credits
  set credits_remaining = credits_remaining - 1
  where id = rid;

  return true;
end;
$$;

create or replace function public.increment_usage_tracking(p_user_id uuid, p_year_month text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_tracking
  set assessments_used = assessments_used + 1
  where user_id = p_user_id and year_month = p_year_month;
$$;

revoke all on function public.consume_one_credit(uuid) from public;
revoke all on function public.increment_usage_tracking(uuid, text) from public;
grant execute on function public.consume_one_credit(uuid) to service_role;
grant execute on function public.increment_usage_tracking(uuid, text) to service_role;
