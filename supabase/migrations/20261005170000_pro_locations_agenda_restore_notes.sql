-- Migração para Painel Pro:
-- 1. Correção da RLS prof_patients_update em professional_patients (corrige bug "Erro ao atualizar locais do paciente")
-- 2. Novas colunas em professional_appointments (location_name, reminder_task_id)
-- 3. Nova coluna e ajuste de RLS em professional_notes (is_multidisciplinary)
-- 4. Nova RPC restore_patient_link(p_link_id uuid) com auditoria

-- 1. RLS prof_patients_update
DROP POLICY IF EXISTS "prof_patients_update" ON public.professional_patients;
CREATE POLICY "prof_patients_update" ON public.professional_patients
  FOR UPDATE TO authenticated
  USING (
    professional_id = auth.uid()
    OR patient_id = auth.uid()
  )
  WITH CHECK (
    professional_id = auth.uid()
    OR patient_id = auth.uid()
  );

-- 2. Colunas em professional_appointments
ALTER TABLE public.professional_appointments
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS reminder_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prof_appts_reminder_task
  ON public.professional_appointments (reminder_task_id);

-- 3. Coluna is_multidisciplinary e RLS em professional_notes
ALTER TABLE public.professional_notes
  ADD COLUMN IF NOT EXISTS is_multidisciplinary boolean NOT NULL DEFAULT false;

-- RLS de professional_notes:
-- O profissional criador sempre pode ver suas próprias notas.
-- Outros profissionais ativos daquele paciente podem ver se a nota for multidisciplinar E o paciente permitir multidisciplinary
-- (ou se for consulta multidisciplinary compartilhada)
DROP POLICY IF EXISTS "prof_notes_select" ON public.professional_notes;
CREATE POLICY "prof_notes_select" ON public.professional_notes
  FOR SELECT TO authenticated
  USING (
    professional_id = auth.uid()
    OR (
      is_multidisciplinary = true
      AND EXISTS (
        SELECT 1 FROM public.professional_patients me
        WHERE me.professional_id = auth.uid()
          AND me.patient_id = professional_notes.patient_id
          AND me.status = 'active'
      )
    )
  );

-- 4. Nova RPC: restore_patient_link(p_link_id uuid)
CREATE OR REPLACE FUNCTION public.restore_patient_link(p_link_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_caller_id uuid;
  v_is_master boolean;
  v_link record;
  v_patient record;
  v_caller_email text;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  SELECT (role = 'master'), email INTO v_is_master, v_caller_email
  FROM public.profiles
  WHERE id = v_caller_id;

  SELECT * INTO v_link
  FROM public.professional_patients
  WHERE id = p_link_id;

  IF v_link IS NULL THEN
    RAISE EXCEPTION 'Vínculo não encontrado.';
  END IF;

  -- Validar titularidade ou master
  IF v_link.professional_id <> v_caller_id AND NOT COALESCE(v_is_master, false) THEN
    RAISE EXCEPTION 'Acesso negado: apenas o profissional titular ou administrador Master pode restaurar este paciente.';
  END IF;

  IF v_link.status <> 'ended' THEN
    RAISE EXCEPTION 'Apenas vínculos encerrados podem ser restaurados (status atual: %).', v_link.status;
  END IF;

  -- Obter perfil do paciente
  SELECT * INTO v_patient
  FROM public.profiles
  WHERE id = v_link.patient_id;

  -- Restaurar status para active, preservando granted_pages e offline_details intactos
  UPDATE public.professional_patients
  SET status = 'active',
      responded_at = now()
  WHERE id = p_link_id;

  -- Auditoria em admin_audit_logs
  INSERT INTO public.admin_audit_logs (
    actor_id,
    actor_email,
    action,
    target_user_id,
    target_email,
    details
  ) VALUES (
    v_caller_id,
    v_caller_email,
    'restore_patient_link',
    v_link.patient_id,
    v_patient.email,
    jsonb_build_object(
      'link_id', p_link_id,
      'professional_id', v_link.professional_id,
      'patient_id', v_link.patient_id,
      'patient_name', v_patient.display_name,
      'is_offline', COALESCE(v_patient.is_offline, false),
      'restored_at', now()
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'link_id', p_link_id,
    'patient_id', v_link.patient_id,
    'status', 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.restore_patient_link(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_patient_link(uuid) TO authenticated;
