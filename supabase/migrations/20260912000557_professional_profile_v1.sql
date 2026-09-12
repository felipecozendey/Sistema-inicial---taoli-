-- Migration: professional_profile_v1
-- Adds is_professional to profiles, creates professional_profiles, professional_patients,
-- professional_appointments, professional_notes, SECURITY DEFINER functions and RLS policies.

-- 1. profiles: add is_professional column & index
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_professional boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_professional
  ON public.profiles USING btree (is_professional);

-- 2. professional_profiles (clinic & practice details)
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profession text NOT NULL,
  register_code text,
  specialty text,
  phone text,
  bio text,
  clinic_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id
  ON public.professional_profiles USING btree (user_id);

DROP POLICY IF EXISTS "prof_profiles_select" ON public.professional_profiles;
CREATE POLICY "prof_profiles_select" ON public.professional_profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "prof_profiles_insert" ON public.professional_profiles;
CREATE POLICY "prof_profiles_insert" ON public.professional_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prof_profiles_update" ON public.professional_profiles;
CREATE POLICY "prof_profiles_update" ON public.professional_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS tr_professional_profiles_updated_at ON public.professional_profiles;
CREATE TRIGGER tr_professional_profiles_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. professional_patients (link between professional and patient)
CREATE TABLE IF NOT EXISTS public.professional_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'ended')),
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT professional_patients_prof_pat_unique UNIQUE (professional_id, patient_id)
);

ALTER TABLE public.professional_patients ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_prof_patients_prof ON public.professional_patients USING btree (professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_patients_pat ON public.professional_patients USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_prof_patients_status ON public.professional_patients USING btree (status);

DROP POLICY IF EXISTS "prof_patients_select" ON public.professional_patients;
CREATE POLICY "prof_patients_select" ON public.professional_patients
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid() OR patient_id = auth.uid());

DROP POLICY IF EXISTS "prof_patients_insert" ON public.professional_patients;
CREATE POLICY "prof_patients_insert" ON public.professional_patients
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND (professional_id = auth.uid() OR patient_id = auth.uid()));

DROP POLICY IF EXISTS "prof_patients_update" ON public.professional_patients;
CREATE POLICY "prof_patients_update" ON public.professional_patients
  FOR UPDATE TO authenticated
  USING (
    patient_id = auth.uid()
    OR (professional_id = auth.uid() AND status IN ('pending', 'active'))
  )
  WITH CHECK (
    patient_id = auth.uid()
    OR (professional_id = auth.uid() AND status = 'ended')
  );

-- 4. professional_appointments (clinic agenda)
CREATE TABLE IF NOT EXISTS public.professional_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 50,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'canceled', 'no_show')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_prof_appts_prof ON public.professional_appointments USING btree (professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_appts_pat ON public.professional_appointments USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_prof_appts_scheduled ON public.professional_appointments USING btree (scheduled_at);

DROP POLICY IF EXISTS "prof_appts_select" ON public.professional_appointments;
CREATE POLICY "prof_appts_select" ON public.professional_appointments
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid() OR patient_id = auth.uid());

DROP POLICY IF EXISTS "prof_appts_insert" ON public.professional_appointments;
CREATE POLICY "prof_appts_insert" ON public.professional_appointments
  FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "prof_appts_update" ON public.professional_appointments;
CREATE POLICY "prof_appts_update" ON public.professional_appointments
  FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "prof_appts_delete" ON public.professional_appointments;
CREATE POLICY "prof_appts_delete" ON public.professional_appointments
  FOR DELETE TO authenticated
  USING (professional_id = auth.uid());

DROP TRIGGER IF EXISTS tr_professional_appointments_updated_at ON public.professional_appointments;
CREATE TRIGGER tr_professional_appointments_updated_at
  BEFORE UPDATE ON public.professional_appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. professional_notes (clinical notes by consultation/patient)
CREATE TABLE IF NOT EXISTS public.professional_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.professional_appointments(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_prof_notes_prof ON public.professional_notes USING btree (professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_notes_pat ON public.professional_notes USING btree (patient_id);

-- Only authoring professional reads and writes; patient NEVER sees clinical notes
DROP POLICY IF EXISTS "prof_notes_select" ON public.professional_notes;
CREATE POLICY "prof_notes_select" ON public.professional_notes
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "prof_notes_insert" ON public.professional_notes;
CREATE POLICY "prof_notes_insert" ON public.professional_notes
  FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "prof_notes_update" ON public.professional_notes;
CREATE POLICY "prof_notes_update" ON public.professional_notes
  FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "prof_notes_delete" ON public.professional_notes;
CREATE POLICY "prof_notes_delete" ON public.professional_notes
  FOR DELETE TO authenticated
  USING (professional_id = auth.uid());

DROP TRIGGER IF EXISTS tr_professional_notes_updated_at ON public.professional_notes;
CREATE TRIGGER tr_professional_notes_updated_at
  BEFORE UPDATE ON public.professional_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Helper function is_my_patient (SECURITY DEFINER) for patient reading consent
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

-- 7. Read-only SELECT policies for active professionals on patient tables
DROP POLICY IF EXISTS "prof_read_patient_body_metrics" ON public.body_metrics;
CREATE POLICY "prof_read_patient_body_metrics" ON public.body_metrics
  FOR SELECT TO authenticated
  USING (public.is_my_patient(user_id));

DROP POLICY IF EXISTS "prof_read_patient_goals" ON public.patient_goals;
CREATE POLICY "prof_read_patient_goals" ON public.patient_goals
  FOR SELECT TO authenticated
  USING (public.is_my_patient(user_id));

DROP POLICY IF EXISTS "prof_read_patient_medical_exams" ON public.medical_exams;
CREATE POLICY "prof_read_patient_medical_exams" ON public.medical_exams
  FOR SELECT TO authenticated
  USING (public.is_my_patient(user_id));

DROP POLICY IF EXISTS "prof_read_patient_habits" ON public.habits;
CREATE POLICY "prof_read_patient_habits" ON public.habits
  FOR SELECT TO authenticated
  USING (public.is_my_patient(user_id));

DROP POLICY IF EXISTS "prof_read_patient_tasks" ON public.tasks;
CREATE POLICY "prof_read_patient_tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_my_patient(user_id));

-- 8. set_user_professional SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.set_user_professional(target uuid, is_prof boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_email TEXT;
  target_user_email TEXT;
  audit_action TEXT;
BEGIN
  -- Strict master validation
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas usuários Master podem alterar o perfil profissional.';
  END IF;

  SELECT email INTO caller_email FROM public.profiles WHERE id = auth.uid();
  SELECT email INTO target_user_email FROM public.profiles WHERE id = target;

  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário alvo não encontrado.';
  END IF;

  UPDATE public.profiles
  SET is_professional = is_prof, updated_at = NOW()
  WHERE id = target;

  -- If revoking (is_prof = false), end active patient bonds and cleanup
  IF NOT is_prof THEN
    UPDATE public.professional_patients
    SET status = 'ended', responded_at = NOW()
    WHERE professional_id = target AND status IN ('pending', 'active');
  END IF;

  IF is_prof THEN
    audit_action := 'professional_granted';
  ELSE
    audit_action := 'professional_revoked';
  END IF;

  INSERT INTO public.admin_audit_logs (actor_id, actor_email, action, target_user_id, target_email, details)
  VALUES (
    auth.uid(),
    caller_email,
    audit_action,
    target,
    target_user_email,
    jsonb_build_object('is_professional', is_prof)
  );
END;
$$;
