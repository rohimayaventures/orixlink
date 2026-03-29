-- Allow symptom snippet (up to 500 chars) in sessions.context; consume credits from oldest non-frozen row

alter table public.sessions drop constraint if exists sessions_context_check;

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
  where c.user_id = p_user_id
    and c.credits_remaining > 0
    and coalesce(c.frozen, false) = false
  order by coalesce(c.purchased_at, c.created_at) asc
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

revoke all on function public.consume_one_credit(uuid) from public;
grant execute on function public.consume_one_credit(uuid) to service_role;
