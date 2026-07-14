CREATE TABLE IF NOT EXISTS fasting_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  target_hours INTEGER NOT NULL DEFAULT 16,
  actual_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
  feeling TEXT NOT NULL DEFAULT 'normal',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fasting_logs_user_id ON fasting_logs(user_id);

ALTER TABLE fasting_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "fasting_logs_select" ON fasting_logs;
  CREATE POLICY "fasting_logs_select" ON fasting_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "fasting_logs_insert" ON fasting_logs;
  CREATE POLICY "fasting_logs_insert" ON fasting_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "fasting_logs_delete" ON fasting_logs;
  CREATE POLICY "fasting_logs_delete" ON fasting_logs
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;
