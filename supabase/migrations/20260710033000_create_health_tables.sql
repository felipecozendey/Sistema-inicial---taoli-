CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meal_type TEXT NOT NULL,
  quality TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS workout_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES workout_routines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bench_press TEXT NOT NULL DEFAULT '',
  squat TEXT NOT NULL DEFAULT '',
  run_time TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_user_id ON workout_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_user_id ON workout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON personal_records(user_id);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "meal_logs_select" ON meal_logs;
  CREATE POLICY "meal_logs_select" ON meal_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "meal_logs_insert" ON meal_logs;
  CREATE POLICY "meal_logs_insert" ON meal_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "meal_logs_update" ON meal_logs;
  CREATE POLICY "meal_logs_update" ON meal_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "meal_logs_delete" ON meal_logs;
  CREATE POLICY "meal_logs_delete" ON meal_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "workout_routines_select" ON workout_routines;
  CREATE POLICY "workout_routines_select" ON workout_routines FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "workout_routines_insert" ON workout_routines;
  CREATE POLICY "workout_routines_insert" ON workout_routines FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "workout_routines_update" ON workout_routines;
  CREATE POLICY "workout_routines_update" ON workout_routines FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "workout_routines_delete" ON workout_routines;
  CREATE POLICY "workout_routines_delete" ON workout_routines FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "workout_history_select" ON workout_history;
  CREATE POLICY "workout_history_select" ON workout_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "workout_history_insert" ON workout_history;
  CREATE POLICY "workout_history_insert" ON workout_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "workout_history_delete" ON workout_history;
  CREATE POLICY "workout_history_delete" ON workout_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "personal_records_select" ON personal_records;
  CREATE POLICY "personal_records_select" ON personal_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "personal_records_insert" ON personal_records;
  CREATE POLICY "personal_records_insert" ON personal_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "personal_records_update" ON personal_records;
  CREATE POLICY "personal_records_update" ON personal_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "personal_records_delete" ON personal_records;
  CREATE POLICY "personal_records_delete" ON personal_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;
