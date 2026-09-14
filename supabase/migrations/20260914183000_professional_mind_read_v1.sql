-- Migration: professional_mind_read_v1
-- Permite leitura profissional (read-only) dos dados de saúde mental do paciente
-- quando o escopo 'mente' tiver sido concedido na relação profissional_patients.

-- 1. body_metrics: política SELECT para profissional com escopo 'mente'
DROP POLICY IF EXISTS "prof_read_patient_body_metrics_mente" ON public.body_metrics;
CREATE POLICY "prof_read_patient_body_metrics_mente" ON public.body_metrics
  FOR SELECT TO authenticated
  USING (is_my_patient_for_page(user_id, 'mente'));

-- 2. mind_journals: política SELECT para profissional com escopo 'mente'
DROP POLICY IF EXISTS "prof_read_patient_mind_journals" ON public.mind_journals;
CREATE POLICY "prof_read_patient_mind_journals" ON public.mind_journals
  FOR SELECT TO authenticated
  USING (is_my_patient_for_page(user_id, 'mente'));

-- 3. mind_events: política SELECT para profissional com escopo 'mente'
DROP POLICY IF EXISTS "prof_read_patient_mind_events" ON public.mind_events;
CREATE POLICY "prof_read_patient_mind_events" ON public.mind_events
  FOR SELECT TO authenticated
  USING (is_my_patient_for_page(user_id, 'mente'));
