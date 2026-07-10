ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS heart_rate_rest INTEGER;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS blood_pressure TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS sleep_quality INTEGER;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS stress_level INTEGER;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS primary_goal TEXT;

ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS photo_url TEXT;

CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_micro_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plan_items_plan_id ON diet_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_micro_goals_user_id ON nutrition_micro_goals(user_id);

ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_micro_goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "diet_plans_select" ON diet_plans;
  CREATE POLICY "diet_plans_select" ON diet_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "diet_plans_insert" ON diet_plans;
  CREATE POLICY "diet_plans_insert" ON diet_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "diet_plans_update" ON diet_plans;
  CREATE POLICY "diet_plans_update" ON diet_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "diet_plans_delete" ON diet_plans;
  CREATE POLICY "diet_plans_delete" ON diet_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "diet_plan_items_select" ON diet_plan_items;
  CREATE POLICY "diet_plan_items_select" ON diet_plan_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM diet_plans WHERE diet_plans.id = diet_plan_items.plan_id AND diet_plans.user_id = auth.uid()));
  DROP POLICY IF EXISTS "diet_plan_items_insert" ON diet_plan_items;
  CREATE POLICY "diet_plan_items_insert" ON diet_plan_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM diet_plans WHERE diet_plans.id = diet_plan_items.plan_id AND diet_plans.user_id = auth.uid()));
  DROP POLICY IF EXISTS "diet_plan_items_update" ON diet_plan_items;
  CREATE POLICY "diet_plan_items_update" ON diet_plan_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM diet_plans WHERE diet_plans.id = diet_plan_items.plan_id AND diet_plans.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM diet_plans WHERE diet_plans.id = diet_plan_items.plan_id AND diet_plans.user_id = auth.uid()));
  DROP POLICY IF EXISTS "diet_plan_items_delete" ON diet_plan_items;
  CREATE POLICY "diet_plan_items_delete" ON diet_plan_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM diet_plans WHERE diet_plans.id = diet_plan_items.plan_id AND diet_plans.user_id = auth.uid()));

  DROP POLICY IF EXISTS "nutrition_micro_goals_select" ON nutrition_micro_goals;
  CREATE POLICY "nutrition_micro_goals_select" ON nutrition_micro_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "nutrition_micro_goals_insert" ON nutrition_micro_goals;
  CREATE POLICY "nutrition_micro_goals_insert" ON nutrition_micro_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "nutrition_micro_goals_update" ON nutrition_micro_goals;
  CREATE POLICY "nutrition_micro_goals_update" ON nutrition_micro_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "nutrition_micro_goals_delete" ON nutrition_micro_goals;
  CREATE POLICY "nutrition_micro_goals_delete" ON nutrition_micro_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;
