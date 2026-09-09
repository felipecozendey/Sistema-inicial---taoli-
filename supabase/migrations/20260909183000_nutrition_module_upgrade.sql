-- Migration: nutrition_module_upgrade
-- Creates daily_checklist, adds fibers_g and sodium_mg to meal_logs, and creates nutrition_macro_goals table

-- 1. Daily Checklist table
CREATE TABLE IF NOT EXISTS public.daily_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_checklist_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checklist_user_date ON public.daily_checklist(user_id, date);

ALTER TABLE public.daily_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_checklist_select" ON public.daily_checklist;
CREATE POLICY "daily_checklist_select" ON public.daily_checklist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_checklist_insert" ON public.daily_checklist;
CREATE POLICY "daily_checklist_insert" ON public.daily_checklist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_checklist_update" ON public.daily_checklist;
CREATE POLICY "daily_checklist_update" ON public.daily_checklist
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_checklist_delete" ON public.daily_checklist;
CREATE POLICY "daily_checklist_delete" ON public.daily_checklist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Add fibers_g and sodium_mg to meal_logs
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS fibers_g NUMERIC DEFAULT 0;
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS sodium_mg NUMERIC DEFAULT 0;

-- 3. Nutrition Macro Goals table for editable user macro goals
CREATE TABLE IF NOT EXISTS public.nutrition_macro_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  protein_g_per_kg NUMERIC DEFAULT 2.0,
  fat_pct NUMERIC DEFAULT 25.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT nutrition_macro_goals_user_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_macro_goals_user_id ON public.nutrition_macro_goals(user_id);

ALTER TABLE public.nutrition_macro_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutrition_macro_goals_select" ON public.nutrition_macro_goals;
CREATE POLICY "nutrition_macro_goals_select" ON public.nutrition_macro_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nutrition_macro_goals_insert" ON public.nutrition_macro_goals;
CREATE POLICY "nutrition_macro_goals_insert" ON public.nutrition_macro_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "nutrition_macro_goals_update" ON public.nutrition_macro_goals;
CREATE POLICY "nutrition_macro_goals_update" ON public.nutrition_macro_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "nutrition_macro_goals_delete" ON public.nutrition_macro_goals;
CREATE POLICY "nutrition_macro_goals_delete" ON public.nutrition_macro_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
