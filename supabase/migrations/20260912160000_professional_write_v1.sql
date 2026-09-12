-- Migration: professional_write_v1
-- Adds created_by to tasks, habits, diet_plans, diet_plan_items, nutrition_recipes, body_metrics, metabolic_logs, workout_routines
-- Adds RLS write/read policies for healthcare professionals with granted scopes

-- 1. Add created_by column with foreign key to auth.users (ON DELETE SET NULL)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.diet_plans
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.diet_plan_items
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.nutrition_recipes
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.body_metrics
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.metabolic_logs
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.workout_routines
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Indexes for created_by on frequently queried / high volume tables
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_habits_created_by ON public.habits USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_body_metrics_created_by ON public.body_metrics USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_diet_plans_created_by ON public.diet_plans USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_nutrition_recipes_created_by ON public.nutrition_recipes USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_metabolic_logs_created_by ON public.metabolic_logs USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_workout_routines_created_by ON public.workout_routines USING btree (created_by);

-- 3. Professional SELECT policies missing for 'saude' scope
-- diet_plans
DROP POLICY IF EXISTS "prof_read_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_read_patient_diet_plans" ON public.diet_plans
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

-- diet_plan_items (via parent diet_plans)
DROP POLICY IF EXISTS "prof_read_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_read_patient_diet_plan_items" ON public.diet_plan_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diet_plans p
    WHERE p.id = diet_plan_items.plan_id
      AND public.is_my_patient_for_page(p.user_id, 'saude')
  ));

-- nutrition_recipes
DROP POLICY IF EXISTS "prof_read_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_read_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

-- recipe_ingredients (via parent nutrition_recipes)
DROP POLICY IF EXISTS "prof_read_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_read_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND public.is_my_patient_for_page(r.user_id, 'saude')
  ));

-- workout_routines
DROP POLICY IF EXISTS "prof_read_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_read_patient_workout_routines" ON public.workout_routines
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

-- custom_foods (allow reading patient custom foods when viewing diet/recipes)
DROP POLICY IF EXISTS "prof_read_patient_custom_foods" ON public.custom_foods;
CREATE POLICY "prof_read_patient_custom_foods" ON public.custom_foods
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

-- 4. INSERT policies for professional
-- 4.1 Scope 'tarefas': tasks, habits
DROP POLICY IF EXISTS "prof_insert_patient_tasks" ON public.tasks;
CREATE POLICY "prof_insert_patient_tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  );

DROP POLICY IF EXISTS "prof_insert_patient_habits" ON public.habits;
CREATE POLICY "prof_insert_patient_habits" ON public.habits
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  );

-- 4.2 Scope 'saude': body_metrics, metabolic_logs, workout_routines, nutrition_recipes, diet_plans
DROP POLICY IF EXISTS "prof_insert_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_insert_patient_body_metrics" ON public.body_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_insert_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_insert_patient_metabolic_logs" ON public.metabolic_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_insert_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_insert_patient_workout_routines" ON public.workout_routines
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_insert_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_insert_patient_diet_plans" ON public.diet_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_insert_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_insert_patient_diet_plan_items" ON public.diet_plan_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diet_plans p
      WHERE p.id = diet_plan_items.plan_id
        AND p.user_id != auth.uid()
        AND public.is_my_patient_for_page(p.user_id, 'saude')
    )
  );

DROP POLICY IF EXISTS "prof_insert_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_insert_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_insert_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_insert_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutrition_recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND r.user_id != auth.uid()
        AND public.is_my_patient_for_page(r.user_id, 'saude')
    )
  );

-- 5. UPDATE and DELETE policies for professional (only records created by this professional: created_by = auth.uid())
-- 5.1 tasks
DROP POLICY IF EXISTS "prof_update_patient_tasks" ON public.tasks;
CREATE POLICY "prof_update_patient_tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  );

DROP POLICY IF EXISTS "prof_delete_patient_tasks" ON public.tasks;
CREATE POLICY "prof_delete_patient_tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  );

-- 5.2 habits
DROP POLICY IF EXISTS "prof_update_patient_habits" ON public.habits;
CREATE POLICY "prof_update_patient_habits" ON public.habits
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  );

DROP POLICY IF EXISTS "prof_delete_patient_habits" ON public.habits;
CREATE POLICY "prof_delete_patient_habits" ON public.habits
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'tarefas')
  );

-- 5.3 body_metrics
DROP POLICY IF EXISTS "prof_update_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_update_patient_body_metrics" ON public.body_metrics
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_delete_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_delete_patient_body_metrics" ON public.body_metrics
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

-- 5.4 metabolic_logs
DROP POLICY IF EXISTS "prof_update_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_update_patient_metabolic_logs" ON public.metabolic_logs
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_delete_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_delete_patient_metabolic_logs" ON public.metabolic_logs
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

-- 5.5 workout_routines
DROP POLICY IF EXISTS "prof_update_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_update_patient_workout_routines" ON public.workout_routines
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_delete_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_delete_patient_workout_routines" ON public.workout_routines
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

-- 5.6 diet_plans
DROP POLICY IF EXISTS "prof_update_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_update_patient_diet_plans" ON public.diet_plans
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_delete_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_delete_patient_diet_plans" ON public.diet_plans
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

-- 5.7 diet_plan_items
DROP POLICY IF EXISTS "prof_update_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_update_patient_diet_plan_items" ON public.diet_plan_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diet_plans p
    WHERE p.id = diet_plan_items.plan_id
      AND p.created_by = auth.uid()
      AND public.is_my_patient_for_page(p.user_id, 'saude')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diet_plans p
    WHERE p.id = diet_plan_items.plan_id
      AND p.created_by = auth.uid()
      AND public.is_my_patient_for_page(p.user_id, 'saude')
  ));

DROP POLICY IF EXISTS "prof_delete_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_delete_patient_diet_plan_items" ON public.diet_plan_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diet_plans p
    WHERE p.id = diet_plan_items.plan_id
      AND p.created_by = auth.uid()
      AND public.is_my_patient_for_page(p.user_id, 'saude')
  ));

-- 5.8 nutrition_recipes
DROP POLICY IF EXISTS "prof_update_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_update_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

DROP POLICY IF EXISTS "prof_delete_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_delete_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'saude')
  );

-- 5.9 recipe_ingredients
DROP POLICY IF EXISTS "prof_update_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_update_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND r.created_by = auth.uid()
      AND public.is_my_patient_for_page(r.user_id, 'saude')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.nutrition_recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND r.created_by = auth.uid()
      AND public.is_my_patient_for_page(r.user_id, 'saude')
  ));

DROP POLICY IF EXISTS "prof_delete_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_delete_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND r.created_by = auth.uid()
      AND public.is_my_patient_for_page(r.user_id, 'saude')
  ));
