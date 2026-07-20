ALTER TABLE diet_plan_items ADD COLUMN IF NOT EXISTS calories NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE diet_plan_items ADD COLUMN IF NOT EXISTS carbs_g NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE diet_plan_items ADD COLUMN IF NOT EXISTS protein_g NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE diet_plan_items ADD COLUMN IF NOT EXISTS fat_g NUMERIC NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS custom_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  base_unit TEXT NOT NULL DEFAULT '100g',
  calories NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id ON custom_foods(user_id);

ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "custom_foods_select" ON custom_foods;
  CREATE POLICY "custom_foods_select" ON custom_foods FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "custom_foods_insert" ON custom_foods;
  CREATE POLICY "custom_foods_insert" ON custom_foods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "custom_foods_update" ON custom_foods;
  CREATE POLICY "custom_foods_update" ON custom_foods FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "custom_foods_delete" ON custom_foods;
  CREATE POLICY "custom_foods_delete" ON custom_foods FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;
