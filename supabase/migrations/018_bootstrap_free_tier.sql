-- Auto-creates free tier subscription and usage
-- tracking row for every new user signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_period text;
BEGIN
  v_period := to_char(now(), 'YYYY-MM');

  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'free',
    'active',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.usage_tracking (
    user_id,
    period_month,
    assessments_used,
    assessments_cap
  )
  VALUES (
    NEW.id,
    v_period,
    0,
    5
  )
  ON CONFLICT (user_id, period_month) DO NOTHING;

  INSERT INTO public.profiles (
    id,
    full_name,
    is_admin,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    false,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created
  ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
