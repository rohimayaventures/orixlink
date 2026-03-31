CREATE OR REPLACE FUNCTION
public.attempt_assessment(
  p_user_id uuid,
  p_cap integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period text;
  v_used integer;
  v_owner_id uuid;
  v_family_total integer;
BEGIN
  v_period := to_char(now(), 'YYYY-MM');

  -- Check if user is an active family member
  SELECT owner_user_id INTO v_owner_id
  FROM public.family_members
  WHERE member_user_id = p_user_id
    AND status = 'active'
  LIMIT 1;

  IF v_owner_id IS NOT NULL THEN
    -- Family member path: sum pool usage
    SELECT COALESCE(SUM(ut.assessments_used), 0)
    INTO v_family_total
    FROM public.usage_tracking ut
    WHERE ut.period_month = v_period
      AND ut.user_id IN (
        -- Owner
        SELECT v_owner_id
        UNION
        -- All active members
        SELECT fm.member_user_id
        FROM public.family_members fm
        WHERE fm.owner_user_id = v_owner_id
          AND fm.status = 'active'
          AND fm.member_user_id IS NOT NULL
      );

    IF v_family_total >= p_cap THEN
      RETURN false;
    END IF;

    -- Increment caller's own row
    INSERT INTO public.usage_tracking (
      user_id, period_month,
      assessments_used, assessments_cap
    )
    VALUES (p_user_id, v_period, 1, p_cap)
    ON CONFLICT (user_id, period_month)
    DO UPDATE SET
      assessments_used =
        public.usage_tracking.assessments_used + 1,
      updated_at = now();

    RETURN true;
  END IF;

  -- Non-family path: original behavior
  SELECT COALESCE(assessments_used, 0)
  INTO v_used
  FROM public.usage_tracking
  WHERE user_id = p_user_id
    AND period_month = v_period;

  IF v_used >= p_cap THEN
    RETURN false;
  END IF;

  INSERT INTO public.usage_tracking (
    user_id, period_month,
    assessments_used, assessments_cap
  )
  VALUES (p_user_id, v_period, 1, p_cap)
  ON CONFLICT (user_id, period_month)
  DO UPDATE SET
    assessments_used =
      public.usage_tracking.assessments_used + 1,
    updated_at = now();

  RETURN true;
END;
$$;
