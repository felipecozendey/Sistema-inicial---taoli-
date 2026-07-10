CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight NUMERIC,
  body_fat_percentage NUMERIC,
  muscle_mass NUMERIC,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_weight NUMERIC,
  target_body_fat NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_id ON body_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_goals_user_id ON patient_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_exams_user_id ON medical_exams(user_id);

ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_exams ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "body_metrics_select" ON body_metrics;
  CREATE POLICY "body_metrics_select" ON body_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "body_metrics_insert" ON body_metrics;
  CREATE POLICY "body_metrics_insert" ON body_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "body_metrics_update" ON body_metrics;
  CREATE POLICY "body_metrics_update" ON body_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "body_metrics_delete" ON body_metrics;
  CREATE POLICY "body_metrics_delete" ON body_metrics FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "patient_goals_select" ON patient_goals;
  CREATE POLICY "patient_goals_select" ON patient_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "patient_goals_insert" ON patient_goals;
  CREATE POLICY "patient_goals_insert" ON patient_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "patient_goals_update" ON patient_goals;
  CREATE POLICY "patient_goals_update" ON patient_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "patient_goals_delete" ON patient_goals;
  CREATE POLICY "patient_goals_delete" ON patient_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "medical_exams_select" ON medical_exams;
  CREATE POLICY "medical_exams_select" ON medical_exams FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "medical_exams_insert" ON medical_exams;
  CREATE POLICY "medical_exams_insert" ON medical_exams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "medical_exams_delete" ON medical_exams;
  CREATE POLICY "medical_exams_delete" ON medical_exams FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;
