CREATE TABLE IF NOT EXISTS metabolic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  formula TEXT,
  tmb NUMERIC,
  naf TEXT,
  injury_factor NUMERIC DEFAULT 1.0,
  venta_target NUMERIC,
  extra_activities JSONB DEFAULT '[]'::jsonb,
  weight_goal NUMERIC,
  goal_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metabolic_logs_user_id ON metabolic_logs(user_id);

ALTER TABLE metabolic_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "metabolic_logs_select" ON metabolic_logs;
  CREATE POLICY "metabolic_logs_select" ON metabolic_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "metabolic_logs_insert" ON metabolic_logs;
  CREATE POLICY "metabolic_logs_insert" ON metabolic_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "metabolic_logs_update" ON metabolic_logs;
  CREATE POLICY "metabolic_logs_update" ON metabolic_logs
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "metabolic_logs_delete" ON metabolic_logs;
  CREATE POLICY "metabolic_logs_delete" ON metabolic_logs
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'felipecozendey@gmail.com';
  IF v_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM metabolic_logs WHERE user_id = v_user_id
  ) THEN
    INSERT INTO metabolic_logs (user_id, date, formula, tmb, naf, injury_factor, venta_target, extra_activities, weight_goal, goal_days) VALUES
      (v_user_id, NOW() - INTERVAL '30 days', 'mifflin', 1780, '1.2', 1.0, 2136, '[]'::jsonb, -5, 90),
      (v_user_id, NOW() - INTERVAL '15 days', 'mifflin', 1770, '1.375', 1.0, 2430, '[]'::jsonb, -5, 75),
      (v_user_id, NOW(), 'mifflin', 1759, '1.55', 1.0, 2726, '[]'::jsonb, -5, 60);
  END IF;
END $$;
