-- Production sync only. Applied directly via Supabase SQL editor
-- in a prior session. Do not re-run against a live database.
-- Safe for fresh database deploys only.
--
-- This restores the jsonb version of attempt_assessment with the
-- v_used_before boundary fix and full credits path. Migration 019
-- replaced this with a boolean-returning family pool variant, but
-- production was patched back to the jsonb version directly in
-- the Supabase SQL editor.

CREATE OR REPLACE FUNCTION public.attempt_assessment(
  p_user_id uuid,
  p_cap integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_period text := to_char(now(), 'YYYY-MM');
  v_used integer;
  v_used_before integer;
  v_credits integer;
begin
  insert into usage_tracking
    (user_id, period_month, assessments_used, assessments_cap)
  values
    (p_user_id, v_period, 0, p_cap)
  on conflict (user_id, period_month)
  do nothing;

  select assessments_used into v_used_before
  from usage_tracking
  where user_id = p_user_id
    and period_month = v_period;

  update usage_tracking
  set assessments_used = assessments_used + 1,
      updated_at = now()
  where user_id = p_user_id
    and period_month = v_period
    and assessments_used < assessments_cap;

  select assessments_used into v_used
  from usage_tracking
  where user_id = p_user_id
    and period_month = v_period;

  if v_used > v_used_before then
    return jsonb_build_object(
      'allowed', true,
      'source', 'subscription',
      'assessments_used', v_used,
      'assessments_cap', p_cap
    );
  end if;

  select coalesce(sum(credits_remaining), 0)
  into v_credits
  from credits
  where user_id = p_user_id
    and frozen_at is null
    and (expires_at is null or expires_at > now())
    and credits_remaining > 0;

  if v_credits > 0 then
    update credits
    set credits_remaining = credits_remaining - 1
    where id = (
      select id from credits
      where user_id = p_user_id
        and frozen_at is null
        and credits_remaining > 0
        and (expires_at is null or expires_at > now())
      order by purchased_at asc
      limit 1
    );
    return jsonb_build_object(
      'allowed', true,
      'source', 'credits',
      'credits_remaining', v_credits - 1
    );
  end if;

  return jsonb_build_object(
    'allowed', false,
    'assessments_used', v_used,
    'assessments_cap', p_cap,
    'credits_remaining', 0
  );
end;
$function$;

revoke all on function public.attempt_assessment(uuid, integer) from public;
grant execute on function public.attempt_assessment(uuid, integer) to service_role;

CREATE OR REPLACE FUNCTION public.rollback_assessment(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_period text := to_char(now(), 'YYYY-MM');
begin
  update public.usage_tracking
  set assessments_used =
      greatest(assessments_used - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and period_month = v_period;
end;
$$;

revoke all on function public.rollback_assessment(uuid) from public;
grant execute on function public.rollback_assessment(uuid) to service_role;
