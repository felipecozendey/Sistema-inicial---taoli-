-- Migration: professional_admin_v1
-- Administrative management for Master users: list links, manage links (end/delete with audit), list professional profiles with aggregates.

-- 1. master_list_professional_links()
-- Returns enriched professional_patients records without sensitive data. Restricted to is_master().
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
  responded_at timestamptz
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
    pp.responded_at
  FROM public.professional_patients pp
  LEFT JOIN public.profiles p_prof ON p_prof.id = pp.professional_id
  LEFT JOIN public.professional_profiles pr_prof ON pr_prof.user_id = pp.professional_id
  LEFT JOIN public.profiles p_pat ON p_pat.id = pp.patient_id
  ORDER BY pp.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.master_list_professional_links() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_list_professional_links() TO authenticated;


-- 2. master_manage_professional_link(link_id uuid, action text)
-- action IN ('end', 'delete')
-- 'end' forces status='ended', 'delete' removes the row.
-- Always logs to admin_audit_logs ('professional_link_forced_end' / 'professional_link_deleted').
CREATE OR REPLACE FUNCTION public.master_manage_professional_link(link_id uuid, action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_email TEXT;
  v_link RECORD;
  v_audit_action TEXT;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores Master podem gerenciar vínculos.';
  END IF;

  IF action NOT IN ('end', 'delete') THEN
    RAISE EXCEPTION 'Ação inválida. Use "end" ou "delete".';
  END IF;

  SELECT * INTO v_link
  FROM public.professional_patients
  WHERE id = link_id;

  IF v_link IS NULL THEN
    RAISE EXCEPTION 'Vínculo não encontrado.';
  END IF;

  SELECT email INTO v_caller_email
  FROM public.profiles
  WHERE id = auth.uid();

  IF action = 'end' THEN
    UPDATE public.professional_patients
    SET status = 'ended', responded_at = NOW()
    WHERE id = link_id;

    v_audit_action := 'professional_link_forced_end';
  ELSIF action = 'delete' THEN
    DELETE FROM public.professional_patients
    WHERE id = link_id;

    v_audit_action := 'professional_link_deleted';
  END IF;

  INSERT INTO public.admin_audit_logs (
    actor_id,
    actor_email,
    action,
    target_user_id,
    target_email,
    details
  )
  SELECT
    auth.uid(),
    v_caller_email,
    v_audit_action,
    v_link.patient_id,
    p_pat.email,
    jsonb_build_object(
      'link_id', link_id,
      'professional_id', v_link.professional_id,
      'patient_id', v_link.patient_id,
      'previous_status', v_link.status,
      'action', action
    )
  FROM public.profiles p_pat
  WHERE p_pat.id = v_link.patient_id;
END;
$$;

REVOKE ALL ON FUNCTION public.master_manage_professional_link(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_manage_professional_link(uuid, text) TO authenticated;


-- 3. master_list_professional_profiles()
-- Lists professional_profiles + profiles.is_professional + aggregated counts
-- (active patients, scheduled/done appointments, notes).
CREATE OR REPLACE FUNCTION public.master_list_professional_profiles()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  is_professional boolean,
  role text,
  profession text,
  register_code text,
  specialty text,
  phone text,
  bio text,
  clinic_name text,
  created_at timestamptz,
  updated_at timestamptz,
  active_patients_count bigint,
  total_patients_count bigint,
  scheduled_appointments_count bigint,
  done_appointments_count bigint,
  notes_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores Master podem visualizar o catálogo de profissionais.';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(p.display_name, split_part(p.email, '@', 1), 'Profissional') AS display_name,
    p.email,
    p.is_professional,
    p.role,
    COALESCE(pp.profession, 'Não configurado') AS profession,
    pp.register_code,
    pp.specialty,
    pp.phone,
    pp.bio,
    pp.clinic_name,
    pp.created_at,
    pp.updated_at,
    COALESCE(pat_counts.active_cnt, 0)::bigint AS active_patients_count,
    COALESCE(pat_counts.total_cnt, 0)::bigint AS total_patients_count,
    COALESCE(appt_counts.scheduled_cnt, 0)::bigint AS scheduled_appointments_count,
    COALESCE(appt_counts.done_cnt, 0)::bigint AS done_appointments_count,
    COALESCE(note_counts.notes_cnt, 0)::bigint AS notes_count
  FROM public.profiles p
  LEFT JOIN public.professional_profiles pp ON pp.user_id = p.id
  LEFT JOIN (
    SELECT
      professional_id,
      COUNT(*) FILTER (WHERE status = 'active') AS active_cnt,
      COUNT(*) AS total_cnt
    FROM public.professional_patients
    GROUP BY professional_id
  ) pat_counts ON pat_counts.professional_id = p.id
  LEFT JOIN (
    SELECT
      professional_id,
      COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled_cnt,
      COUNT(*) FILTER (WHERE status = 'done') AS done_cnt
    FROM public.professional_appointments
    GROUP BY professional_id
  ) appt_counts ON appt_counts.professional_id = p.id
  LEFT JOIN (
    SELECT
      professional_id,
      COUNT(*) AS notes_cnt
    FROM public.professional_notes
    GROUP BY professional_id
  ) note_counts ON note_counts.professional_id = p.id
  WHERE p.is_professional = true OR pp.id IS NOT NULL
  ORDER BY p.is_professional DESC, p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.master_list_professional_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_list_professional_profiles() TO authenticated;
