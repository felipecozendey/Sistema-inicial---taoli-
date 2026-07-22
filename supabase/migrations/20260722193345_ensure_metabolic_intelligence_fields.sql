ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS calc_formula TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS injury_factor NUMERIC NOT NULL DEFAULT 1.0;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS target_weight NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS days_for_goal INTEGER;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS venta_target NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS methodology_used TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS lean_mass NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS met_activities JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS patient_profile TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS tmb NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS get NUMERIC;

DROP POLICY IF EXISTS "body_metrics_select" ON body_metrics;
CREATE POLICY "body_metrics_select" ON body_metrics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "body_metrics_insert" ON body_metrics;
CREATE POLICY "body_metrics_insert" ON body_metrics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "body_metrics_update" ON body_metrics;
CREATE POLICY "body_metrics_update" ON body_metrics
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "body_metrics_delete" ON body_metrics;
CREATE POLICY "body_metrics_delete" ON body_metrics
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
