CREATE TABLE IF NOT EXISTS mind_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_mind_events_user_id ON mind_events(user_id);

ALTER TABLE mind_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mind_events_select" ON mind_events;
CREATE POLICY "mind_events_select" ON mind_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mind_events_insert" ON mind_events;
CREATE POLICY "mind_events_insert" ON mind_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mind_events_delete" ON mind_events;
CREATE POLICY "mind_events_delete" ON mind_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
