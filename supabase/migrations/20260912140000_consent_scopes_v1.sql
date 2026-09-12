-- Migration: consent_scopes_v1
-- Adds granted_pages to professional_patients, creates is_my_patient_for_page,
-- updates existing RLS policies and adds read-only policies for financas and estudos.

-- 1. Add granted_pages to professional_patients with CHECK
ALTER TABLE public.professional_patients
  ADD COLUMN IF NOT EXISTS granted_pages text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_patients_granted_pages_check'
  ) THEN
    ALTER TABLE public.professional_patients
      ADD CONSTRAINT professional_patients_granted_pages_check
      CHECK (granted_pages <@ ARRAY['tarefas', 'saude', 'financas', 'estudos']::text[]);
  END IF;
END $$;

-- 2. Backfill: active links receive all 4 scopes; others stay empty
UPDATE public.professional_patients
SET granted_pages = ARRAY['tarefas', 'saude', 'financas', 'estudos']::text[]
WHERE status = 'active' AND (granted_pages IS NULL OR granted_pages = '{}');

-- 3. Security Definer helper function: is_my_patient_for_page
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
      AND page = ANY(granted_pages)
  );
$$;

REVOKE ALL ON FUNCTION public.is_my_patient_for_page(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_my_patient_for_page(uuid, text) TO authenticated;

-- Keep is_my_patient(uuid) backwards-compatible if needed anywhere
CREATE OR REPLACE FUNCTION public.is_my_patient(patient uuid)
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
  );
$$;

-- 4. Rewrite existing SELECT policies to enforce granular scope

-- 4.1 Tarefas module: tasks, habits, daily_checklist
DROP POLICY IF EXISTS "prof_read_patient_tasks" ON public.tasks;
CREATE POLICY "prof_read_patient_tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'tarefas'));

DROP POLICY IF EXISTS "prof_read_patient_habits" ON public.habits;
CREATE POLICY "prof_read_patient_habits" ON public.habits
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'tarefas'));

DROP POLICY IF EXISTS "prof_read_patient_daily_checklist" ON public.daily_checklist;
CREATE POLICY "prof_read_patient_daily_checklist" ON public.daily_checklist
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'tarefas'));

-- 4.2 Saude module: body_metrics, patient_goals, medical_exams, meal_logs, metabolic_logs
DROP POLICY IF EXISTS "prof_read_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_read_patient_body_metrics" ON public.body_metrics
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

DROP POLICY IF EXISTS "prof_read_patient_goals" ON public.patient_goals;
CREATE POLICY "prof_read_patient_goals" ON public.patient_goals
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

DROP POLICY IF EXISTS "prof_read_patient_medical_exams" ON public.medical_exams;
CREATE POLICY "prof_read_patient_medical_exams" ON public.medical_exams
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

DROP POLICY IF EXISTS "prof_read_patient_meal_logs" ON public.meal_logs;
CREATE POLICY "prof_read_patient_meal_logs" ON public.meal_logs
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

DROP POLICY IF EXISTS "prof_read_patient_metabolic_logs" ON public.metabolic_logs;
CREATE POLICY "prof_read_patient_metabolic_logs" ON public.metabolic_logs
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'saude'));

-- 5. Create SELECT policies for 'financas' scope (read-only)
-- Tables: transactions, investments, investment_transactions, investment_goals, billings, finance_categories, payment_methods, bank_accounts
-- passwords NEVER has a policy for professional!

DROP POLICY IF EXISTS "prof_read_patient_transactions" ON public.transactions;
CREATE POLICY "prof_read_patient_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_investments" ON public.investments;
CREATE POLICY "prof_read_patient_investments" ON public.investments
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_investment_transactions" ON public.investment_transactions;
CREATE POLICY "prof_read_patient_investment_transactions" ON public.investment_transactions
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_investment_goals" ON public.investment_goals;
CREATE POLICY "prof_read_patient_investment_goals" ON public.investment_goals
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_billings" ON public.billings;
CREATE POLICY "prof_read_patient_billings" ON public.billings
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_finance_categories" ON public.finance_categories;
CREATE POLICY "prof_read_patient_finance_categories" ON public.finance_categories
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_payment_methods" ON public.payment_methods;
CREATE POLICY "prof_read_patient_payment_methods" ON public.payment_methods
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

DROP POLICY IF EXISTS "prof_read_patient_bank_accounts" ON public.bank_accounts;
CREATE POLICY "prof_read_patient_bank_accounts" ON public.bank_accounts
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'financas'));

-- 6. Create SELECT policies for 'estudos' scope (read-only)
-- Tables: notes, notebooks, decks, flashcards, review_logs

DROP POLICY IF EXISTS "prof_read_patient_notes" ON public.notes;
CREATE POLICY "prof_read_patient_notes" ON public.notes
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_notebooks" ON public.notebooks;
CREATE POLICY "prof_read_patient_notebooks" ON public.notebooks
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_decks" ON public.decks;
CREATE POLICY "prof_read_patient_decks" ON public.decks
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND public.is_my_patient_for_page(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_flashcards" ON public.flashcards;
CREATE POLICY "prof_read_patient_flashcards" ON public.flashcards
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND public.is_my_patient_for_page(user_id, 'estudos'));

DROP POLICY IF EXISTS "prof_read_patient_review_logs" ON public.review_logs;
CREATE POLICY "prof_read_patient_review_logs" ON public.review_logs
  FOR SELECT TO authenticated
  USING (public.is_my_patient_for_page(user_id, 'estudos'));

-- 7. Update master_list_professional_links to return granted_pages
-- First drop existing function so return type changes cleanly
DROP FUNCTION IF EXISTS public.master_list_professional_links();

CREATE OR REPLACE FUNCTION public.master_list_professional_links()
RETURNS TABLE (
  id uuid,
  professional_id uuid,
  professional_name text,
  professional_profession text,
  professional_register text,
  patient_id uuid,
  patient_name text,
  patient_email text,
  status text,
  requested_by uuid,
  created_at timestamptz,
  responded_at timestamptz,
  granted_pages text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores Master podem listar vínculos profissionais.';
  END IF;

  RETURN QUERY
  SELECT
    pp.id,
    pp.professional_id,
    COALESCE(p_prof.display_name, split_part(p_prof.email, '@', 1), 'Profissional') AS professional_name,
    COALESCE(pr_prof.profession, 'Profissional da Saúde') AS professional_profession,
    pr_prof.register_code AS professional_register,
    pp.patient_id,
    COALESCE(p_pat.display_name, split_part(p_pat.email, '@', 1), 'Paciente') AS patient_name,
    COALESCE(p_pat.email, '') AS patient_email,
    pp.status,
    pp.requested_by,
    pp.created_at,
    pp.responded_at,
    pp.granted_pages
  FROM public.professional_patients pp
  LEFT JOIN public.profiles p_prof ON p_prof.id = pp.professional_id
  LEFT JOIN public.professional_profiles pr_prof ON pr_prof.user_id = pp.professional_id
  LEFT JOIN public.profiles p_pat ON p_pat.id = pp.patient_id
  ORDER BY pp.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.master_list_professional_links() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_list_professional_links() TO authenticated;
