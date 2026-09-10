-- Migration: garden_and_task_system_settings
-- 1. Create garden_state table
CREATE TABLE IF NOT EXISTS public.garden_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  plot_count INTEGER NOT NULL DEFAULT 6,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT garden_state_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_garden_state_user_id ON public.garden_state(user_id);

ALTER TABLE public.garden_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "garden_state_select" ON public.garden_state;
CREATE POLICY "garden_state_select" ON public.garden_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_state_insert" ON public.garden_state;
CREATE POLICY "garden_state_insert" ON public.garden_state
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_state_update" ON public.garden_state;
CREATE POLICY "garden_state_update" ON public.garden_state
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_state_delete" ON public.garden_state;
CREATE POLICY "garden_state_delete" ON public.garden_state
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 2. Create garden_plants table
CREATE TABLE IF NOT EXISTS public.garden_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plot_index INTEGER NOT NULL,
  species TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0,
  planted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT garden_plants_user_plot_unique UNIQUE (user_id, plot_index)
);

CREATE INDEX IF NOT EXISTS idx_garden_plants_user_id ON public.garden_plants(user_id);

ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "garden_plants_select" ON public.garden_plants;
CREATE POLICY "garden_plants_select" ON public.garden_plants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_plants_insert" ON public.garden_plants;
CREATE POLICY "garden_plants_insert" ON public.garden_plants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_plants_update" ON public.garden_plants;
CREATE POLICY "garden_plants_update" ON public.garden_plants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_plants_delete" ON public.garden_plants;
CREATE POLICY "garden_plants_delete" ON public.garden_plants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 3. Create task_system_settings table
CREATE TABLE IF NOT EXISTS public.task_system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  points_per_task INTEGER NOT NULL DEFAULT 10,
  points_per_habit INTEGER NOT NULL DEFAULT 5,
  bonus_streak INTEGER NOT NULL DEFAULT 15,
  points_per_level INTEGER NOT NULL DEFAULT 100,
  unlock_plot_cost INTEGER NOT NULL DEFAULT 50,
  show_garden BOOLEAN NOT NULL DEFAULT true,
  show_week_day_tabs BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial default settings if not exists
INSERT INTO public.task_system_settings (id, points_per_task, points_per_habit, bonus_streak, points_per_level, unlock_plot_cost, show_garden, show_week_day_tabs)
VALUES ('default', 10, 5, 15, 100, 50, true, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.task_system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_system_settings_select" ON public.task_system_settings;
CREATE POLICY "task_system_settings_select" ON public.task_system_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "task_system_settings_master_insert" ON public.task_system_settings;
CREATE POLICY "task_system_settings_master_insert" ON public.task_system_settings
  FOR INSERT TO authenticated
  WITH CHECK (is_master());

DROP POLICY IF EXISTS "task_system_settings_master_update" ON public.task_system_settings;
CREATE POLICY "task_system_settings_master_update" ON public.task_system_settings
  FOR UPDATE TO authenticated
  USING (is_master())
  WITH CHECK (is_master());

DROP POLICY IF EXISTS "task_system_settings_master_delete" ON public.task_system_settings;
CREATE POLICY "task_system_settings_master_delete" ON public.task_system_settings
  FOR DELETE TO authenticated
  USING (is_master());
