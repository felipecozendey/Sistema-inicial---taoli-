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

ALTER TABLE metabolic_logs ENABLE ROW LEVEL SECURITY;
