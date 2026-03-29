-- Align usage_tracking column with RPCs (006) and Stripe webhook: period_month
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'usage_tracking'
      and column_name = 'year_month'
  ) then
    alter table public.usage_tracking rename column year_month to period_month;
  end if;
end $$;

create or replace function public.increment_usage_tracking(p_user_id uuid, p_period_month text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_tracking
  set assessments_used = assessments_used + 1
  where user_id = p_user_id and period_month = p_period_month;
$$;

revoke all on function public.increment_usage_tracking(uuid, text) from public;
grant execute on function public.increment_usage_tracking(uuid, text) to service_role;
