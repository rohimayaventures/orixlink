-- AUTHORITATIVE PRODUCTION CONTRACT (supersedes 019 and 028):
-- public.attempt_assessment RETURNS jsonb.
-- This migration canonically defines the contract expected by the app.

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
      select id
      from credits
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
