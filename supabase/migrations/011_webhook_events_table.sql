CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_events
  ENABLE ROW LEVEL SECURITY;
