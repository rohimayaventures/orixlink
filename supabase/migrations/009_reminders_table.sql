-- Follow-up reminders (optional email check-ins after assessment)
-- After applying: run pg_cron + pg_net extensions and cron job in Supabase SQL editor (see product docs).

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id)
    ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id)
    ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  chief_complaint text,
  urgency_tier text,
  hours_delay integer NOT NULL
    CHECK (hours_delay IN (24, 48, 72)),
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN
      ('pending', 'sent', 'cancelled', 'failed')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX idx_reminders_send_at
  ON public.reminders(send_at)
  WHERE status = 'pending';

CREATE INDEX idx_reminders_user_id
  ON public.reminders(user_id);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
