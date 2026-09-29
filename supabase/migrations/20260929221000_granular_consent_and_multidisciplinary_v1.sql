-- Migration: granular_consent_and_multidisciplinary_v1
-- Adiciona suporte a escopos granulares (prontuario_geral, nutricao, exercicios, raio_x, mente, historico_social),
-- Atendimento Multidisciplinar (opt-in do paciente em allow_multidisciplinary),
-- Atualiza funções is_my_patient_for_page e is_my_patient_for_page_read para checar multidisciplinar,
-- E atualiza políticas RLS de leitura e escrita.

-- 1. Alterar CHECK constraint em professional_patients para permitir os 9 escopos granulares + saude legado
ALTER TABLE public.professional_patients
  DROP CONSTRAINT IF EXISTS professional_patients_granted_pages_check;

ALTER TABLE public.professional_patients
  ADD CONSTRAINT professional_patients_granted_pages_check
  CHECK (granted_pages <@ ARRAY[
    'tarefas',
    'saude',
    'prontuario_geral',
    'nutricao',
    'exercicios',
    'raio_x',
    'mente',
    'financas',
    'estudos',
    'historico_social'
  ]::text[]);

-- 2. Adicionar coluna allow_multidisciplinary na tabela professional_patients
ALTER TABLE public.professional_patients
  ADD COLUMN IF NOT EXISTS allow_multidisciplinary boolean NOT NULL DEFAULT false;

-- 3. Expandir registros legados: onde houver 'saude', garantir os escopos granulares correspondentes
UPDATE public.professional_patients
SET granted_pages = ARRAY(
  SELECT DISTINCT unnest(array_cat(granted_pages, ARRAY['prontuario_geral', 'nutricao', 'exercicios', 'raio_x']::text[]))
)
WHERE 'saude' = ANY(granted_pages);

-- 4. Função auxiliar de leitura: is_my_patient_for_page_read(patient uuid, page text)
CREATE OR REPLACE FUNCTION public.is_my_patient_for_page_read(patient uuid, page text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Caso 1: Concessão direta ao profissional logado
    SELECT 1 FROM public.professional_patients pp
    WHERE pp.professional_id = auth.uid()
      AND pp.patient_id = patient
      AND pp.status = 'active'
      AND (
        page = ANY(pp.granted_pages)
        OR ('saude' = ANY(pp.granted_pages) AND page IN ('prontuario_geral', 'nutricao', 'exercicios', 'raio_x'))
      )

    UNION ALL

    -- Caso 2: Atendimento multidisciplinar opt-in
    SELECT 1 FROM public.professional_patients me
    WHERE me.professional_id = auth.uid()
      AND me.patient_id = patient
      AND me.status = 'active'
      AND EXISTS (
        SELECT 1 FROM public.professional_patients any_p
        WHERE any_p.patient_id = patient
          AND any_p.status = 'active'
          AND any_p.allow_multidisciplinary = true
          AND (
            page = ANY(any_p.granted_pages)
            OR ('saude' = ANY(any_p.granted_pages) AND page IN ('prontuario_geral', 'nutricao', 'exercicios', 'raio_x'))
          )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_my_patient_for_page_read(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_my_patient_for_page_read(uuid, text) TO authenticated;

-- 5. Atualizar is_my_patient_for_page(patient uuid, page text) para ESCRITA direta (apenas quem tem concessão direta)
CREATE OR REPLACE FUNCTION public.is_my_patient_for_page(patient uuid, page text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_patients
    WHERE professional_id = auth.uid()
      AND patient_id = patient
      AND status = 'active'
      AND (
        page = ANY(granted_pages)
        OR ('saude' = ANY(granted_pages) AND page IN ('prontuario_geral', 'nutricao', 'exercicios', 'raio_x'))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_my_patient_for_page(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_my_patient_for_page(uuid, text) TO authenticated;

-- 6. Atualizar políticas de LEITURA (SELECT) para usar is_my_patient_for_page_read

-- 6.1 Tarefas
DROP POLICY IF EXISTS "prof_read_patient_tasks" ON public.tasks;
CREATE POLICY "prof_read_patient_tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'tarefas'));

DROP POLICY IF EXISTS "prof_read_patient_habits" ON public.habits;
CREATE POLICY "prof_read_patient_habits" ON public.habits
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'tarefas'));

DROP POLICY IF EXISTS "prof_read_patient_daily_checklist" ON public.daily_checklist;
CREATE POLICY "prof_read_patient_daily_checklist" ON public.daily_checklist
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'tarefas'));

-- 6.2 Prontuário Geral / Raio-X: body_metrics, patient_goals, medical_exams
DROP POLICY IF EXISTS "prof_read_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_read_patient_body_metrics" ON public.body_metrics
  FOR SELECT TO authenticated
  USING (
    public.is_my_patient_for_page_read(user_id, 'prontuario_geral')
    OR public.is_my_patient_for_page_read(user_id, 'raio_x')
    OR public.is_my_patient_for_page_read(user_id, 'mente')
  );

DROP POLICY IF EXISTS "prof_read_patient_goals" ON public.patient_goals;
CREATE POLICY "prof_read_patient_goals" ON public.patient_goals
  FOR SELECT TO authenticated
  USING (
    public.is_my_patient_for_page_read(user_id, 'prontuario_geral')
    OR public.is_my_patient_for_page_read(user_id, 'raio_x')
  );

DROP POLICY IF EXISTS "prof_read_patient_medical_exams" ON public.medical_exams;
CREATE POLICY "prof_read_patient_medical_exams" ON public.medical_exams
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'prontuario_geral'));

-- 6.3 Nutrição: meal_logs, metabolic_logs, diet_plans, diet_plan_items, nutrition_recipes, recipe_ingredients, custom_foods
DROP POLICY IF EXISTS "prof_read_patient_meal_logs" ON public.meal_logs;
CREATE POLICY "prof_read_patient_meal_logs" ON public.meal_logs
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'nutricao'));

DROP POLICY IF EXISTS "prof_read_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_read_patient_metabolic_logs" ON public.metabolic_logs
  FOR SELECT TO authenticated
  USING (
    public.is_my_patient_for_page_read(user_id, 'nutricao')
    OR public.is_my_patient_for_page_read(user_id, 'prontuario_geral')
  );

DROP POLICY IF EXISTS "prof_read_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_read_patient_diet_plans" ON public.diet_plans
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'nutricao'));

DROP POLICY IF EXISTS "prof_read_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_read_patient_diet_plan_items" ON public.diet_plan_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans p
      WHERE p.id = diet_plan_items.plan_id
        AND public.is_my_patient_for_page_read(p.user_id, 'nutricao')
    )
  );

DROP POLICY IF EXISTS "prof_read_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_read_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'nutricao'));

DROP POLICY IF EXISTS "prof_read_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_read_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND public.is_my_patient_for_page_read(r.user_id, 'nutricao')
    )
  );

DROP POLICY IF EXISTS "prof_read_patient_custom_foods" ON public.custom_foods;
CREATE POLICY "prof_read_patient_custom_foods" ON public.custom_foods
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'nutricao'));

-- 6.4 Exercícios: workout_routines
DROP POLICY IF EXISTS "prof_read_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_read_patient_workout_routines" ON public.workout_routines
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'exercicios'));

-- 6.5 Mente: mind_journals, mind_events
DROP POLICY IF EXISTS "prof_read_patient_mind_journals" ON public.mind_journals;
CREATE POLICY "prof_read_patient_mind_journals" ON public.mind_journals
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'mente'));

DROP POLICY IF EXISTS "prof_read_patient_mind_events" ON public.mind_events;
CREATE POLICY "prof_read_patient_mind_events" ON public.mind_events
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'mente'));

-- 6.6 Finanças & Estudos
DROP POLICY IF EXISTS "prof_read_patient_transactions" ON public.transactions;
CREATE POLICY "prof_read_patient_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_investments" ON public.investments;
CREATE POLICY "prof_read_patient_investments" ON public.investments
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_investment_transactions" ON public.investment_transactions;
CREATE POLICY "prof_read_patient_investment_transactions" ON public.investment_transactions
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_investment_goals" ON public.investment_goals;
CREATE POLICY "prof_read_patient_investment_goals" ON public.investment_goals
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_billings" ON public.billings;
CREATE POLICY "prof_read_patient_billings" ON public.billings
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_finance_categories" ON public.finance_categories;
CREATE POLICY "prof_read_patient_finance_categories" ON public.finance_categories
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_payment_methods" ON public.payment_methods;
CREATE POLICY "prof_read_patient_payment_methods" ON public.payment_methods
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_bank_accounts" ON public.bank_accounts;
CREATE POLICY "prof_read_patient_bank_accounts" ON public.bank_accounts
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_notes" ON public.notes;
CREATE POLICY "prof_read_patient_notes" ON public.notes
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_notebooks" ON public.notebooks;
CREATE POLICY "prof_read_patient_notebooks" ON public.notebooks
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_decks" ON public.decks;
CREATE POLICY "prof_read_patient_decks" ON public.decks
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND public.is_my_patient_for_page_read(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_flashcards" ON public.flashcards;
CREATE POLICY "prof_read_patient_flashcards" ON public.flashcards
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND public.is_my_patient_for_page_read(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_review_logs" ON public.review_logs;
CREATE POLICY "prof_read_patient_review_logs" ON public.review_logs
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page_read(user_id, 'estudos'));

-- 7. Políticas de ESCRITA: agora com escopo granular correspondente (ou 'saude' legado via is_my_patient_for_page)
-- 7.1 body_metrics (prontuario_geral OU raio_x)
DROP POLICY IF EXISTS "prof_insert_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_insert_patient_body_metrics" ON public.body_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      public.is_my_patient_for_page(user_id, 'prontuario_geral')
      OR public.is_my_patient_for_page(user_id, 'raio_x')
    )
  );

DROP POLICY IF EXISTS "prof_update_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_update_patient_body_metrics" ON public.body_metrics
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND (
      public.is_my_patient_for_page(user_id, 'prontuario_geral')
      OR public.is_my_patient_for_page(user_id, 'raio_x')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.is_my_patient_for_page(user_id, 'prontuario_geral')
      OR public.is_my_patient_for_page(user_id, 'raio_x')
    )
  );

DROP POLICY IF EXISTS "prof_delete_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_delete_patient_body_metrics" ON public.body_metrics
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND (
      public.is_my_patient_for_page(user_id, 'prontuario_geral')
      OR public.is_my_patient_for_page(user_id, 'raio_x')
    )
  );

-- 7.2 metabolic_logs (nutricao OU prontuario_geral)
DROP POLICY IF EXISTS "prof_insert_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_insert_patient_metabolic_logs" ON public.metabolic_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      public.is_my_patient_for_page(user_id, 'nutricao')
      OR public.is_my_patient_for_page(user_id, 'prontuario_geral')
    )
  );

DROP POLICY IF EXISTS "prof_update_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_update_patient_metabolic_logs" ON public.metabolic_logs
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND (
      public.is_my_patient_for_page(user_id, 'nutricao')
      OR public.is_my_patient_for_page(user_id, 'prontuario_geral')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.is_my_patient_for_page(user_id, 'nutricao')
      OR public.is_my_patient_for_page(user_id, 'prontuario_geral')
    )
  );

DROP POLICY IF EXISTS "prof_delete_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_delete_patient_metabolic_logs" ON public.metabolic_logs
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND (
      public.is_my_patient_for_page(user_id, 'nutricao')
      OR public.is_my_patient_for_page(user_id, 'prontuario_geral')
    )
  );

-- 7.3 workout_routines (exercicios)
DROP POLICY IF EXISTS "prof_insert_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_insert_patient_workout_routines" ON public.workout_routines
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_my_patient_for_page(user_id, 'exercicios')
  );

DROP POLICY IF EXISTS "prof_update_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_update_patient_workout_routines" ON public.workout_routines
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'exercicios')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'exercicios')
  );

DROP POLICY IF EXISTS "prof_delete_patient_workout_routines" ON public.workout_routines;
CREATE POLICY "prof_delete_patient_workout_routines" ON public.workout_routines
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'exercicios')
  );

-- 7.4 diet_plans (nutricao)
DROP POLICY IF EXISTS "prof_insert_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_insert_patient_diet_plans" ON public.diet_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  );

DROP POLICY IF EXISTS "prof_update_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_update_patient_diet_plans" ON public.diet_plans
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  );

DROP POLICY IF EXISTS "prof_delete_patient_diet_plans" ON public.diet_plans;
CREATE POLICY "prof_delete_patient_diet_plans" ON public.diet_plans
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  );

-- 7.5 diet_plan_items (nutricao)
DROP POLICY IF EXISTS "prof_insert_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_insert_patient_diet_plan_items" ON public.diet_plan_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diet_plans p
      WHERE p.id = diet_plan_items.plan_id
        AND p.created_by = auth.uid()
        AND public.is_my_patient_for_page(p.user_id, 'nutricao')
    )
  );

DROP POLICY IF EXISTS "prof_update_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_update_patient_diet_plan_items" ON public.diet_plan_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diet_plans p
    WHERE p.id = diet_plan_items.plan_id
      AND p.created_by = auth.uid()
      AND public.is_my_patient_for_page(p.user_id, 'nutricao')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diet_plans p
    WHERE p.id = diet_plan_items.plan_id
      AND p.created_by = auth.uid()
      AND public.is_my_patient_for_page(p.user_id, 'nutricao')
  ));

DROP POLICY IF EXISTS "prof_delete_patient_diet_plan_items" ON public.diet_plan_items;
CREATE POLICY "prof_delete_patient_diet_plan_items" ON public.diet_plan_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diet_plans p
    WHERE p.id = diet_plan_items.plan_id
      AND p.created_by = auth.uid()
      AND public.is_my_patient_for_page(p.user_id, 'nutricao')
  ));

-- 7.6 nutrition_recipes (nutricao)
DROP POLICY IF EXISTS "prof_insert_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_insert_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  );

DROP POLICY IF EXISTS "prof_update_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_update_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  );

DROP POLICY IF EXISTS "prof_delete_patient_nutrition_recipes" ON public.nutrition_recipes;
CREATE POLICY "prof_delete_patient_nutrition_recipes" ON public.nutrition_recipes
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_my_patient_for_page(user_id, 'nutricao')
  );

-- 7.7 recipe_ingredients (nutricao)
DROP POLICY IF EXISTS "prof_insert_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_insert_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutrition_recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND r.user_id != auth.uid()
        AND public.is_my_patient_for_page(r.user_id, 'nutricao')
    )
  );

DROP POLICY IF EXISTS "prof_update_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_update_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND r.created_by = auth.uid()
      AND public.is_my_patient_for_page(r.user_id, 'nutricao')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.nutrition_recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND r.created_by = auth.uid()
      AND public.is_my_patient_for_page(r.user_id, 'nutricao')
  ));

DROP POLICY IF EXISTS "prof_delete_patient_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "prof_delete_patient_recipe_ingredients" ON public.recipe_ingredients
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.nutrition_recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND r.created_by = auth.uid()
      AND public.is_my_patient_for_page(r.user_id, 'nutricao')
  ));
