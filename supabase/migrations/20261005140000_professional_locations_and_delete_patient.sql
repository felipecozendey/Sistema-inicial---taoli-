-- Migration: 20261005140000_professional_locations_and_delete_patient.sql
-- 1. Add professional_locations jsonb to profiles (defaults to '[]')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS professional_locations jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Backfill existing offline patients: granted_pages with all 9 scopes
UPDATE public.professional_patients pp
SET granted_pages = ARRAY['prontuario_geral','tarefas','mente','nutricao','exercicios','raio_x','financas','estudos','historico_social']::text[]
FROM public.profiles p
WHERE pp.patient_id = p.id
  AND p.is_offline = true
  AND pp.status = 'active';

-- Also update default_granted in create_offline_patient RPC so newly created offline patients get all 9 scopes
CREATE OR REPLACE FUNCTION public.create_offline_patient(
  p_professional_id uuid,
  p_email text DEFAULT NULL,
  p_display_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_birth_date text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_gender text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  caller_id uuid;
  is_caller_master boolean;
  clean_email text;
  has_real_email boolean := false;
  synthetic_email text;
  new_patient_id uuid;
  existing_profile record;
  strong_temp_pwd text;
  offline_data jsonb;
  default_granted text[];
BEGIN
  -- Authenticate caller
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  SELECT (role = 'master') INTO is_caller_master
  FROM public.profiles
  WHERE id = caller_id;

  -- Validate caller has professional rights or is master
  IF caller_id <> p_professional_id AND NOT COALESCE(is_caller_master, false) THEN
    RAISE EXCEPTION 'Acesso negado: você só pode cadastrar pacientes para seu próprio consultório.';
  END IF;

  -- Validate name
  IF p_display_name IS NULL OR trim(p_display_name) = '' THEN
    RAISE EXCEPTION 'O nome do paciente é obrigatório.';
  END IF;

  -- Handle optional email
  clean_email := lower(trim(COALESCE(p_email, '')));
  IF clean_email <> '' THEN
    IF clean_email NOT LIKE '%@%' THEN
      RAISE EXCEPTION 'E-mail inválido.';
    END IF;
    has_real_email := true;
  END IF;

  -- 9 full scopes for offline patient
  default_granted := ARRAY['prontuario_geral','tarefas','mente','nutricao','exercicios','raio_x','financas','estudos','historico_social']::text[];

  IF has_real_email THEN
    -- Check if email already exists in profiles or auth.users
    SELECT id, is_offline, display_name INTO existing_profile
    FROM public.profiles
    WHERE lower(email) = clean_email
    LIMIT 1;

    offline_data := json_build_object(
      'phone', p_phone,
      'birth_date', p_birth_date,
      'gender', p_gender,
      'notes', p_notes,
      'email_pending', false,
      'created_offline_at', now(),
      'created_by_professional_id', p_professional_id
    );

    -- Case A: Patient already exists as OFFLINE with this email
    IF existing_profile.id IS NOT NULL THEN
      IF NOT existing_profile.is_offline THEN
        RAISE EXCEPTION 'Este e-mail já possui cadastro no sistema.';
      END IF;

      new_patient_id := existing_profile.id;

      INSERT INTO public.professional_patients (
        professional_id,
        patient_id,
        status,
        requested_by,
        granted_pages,
        offline_details
      ) VALUES (
        p_professional_id,
        new_patient_id,
        'active',
        p_professional_id,
        default_granted,
        offline_data
      )
      ON CONFLICT (professional_id, patient_id) DO UPDATE SET
        status = 'active',
        offline_details = EXCLUDED.offline_details,
        granted_pages = default_granted;

      INSERT INTO public.admin_audit_logs (
        actor_id,
        action,
        target_user_id,
        target_email,
        details
      ) VALUES (
        caller_id,
        'link_existing_offline_patient',
        new_patient_id,
        clean_email,
        json_build_object(
          'professional_id', p_professional_id,
          'display_name', p_display_name,
          'secondary_professional', true
        )
      );

      RETURN new_patient_id;
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = clean_email) THEN
      RAISE EXCEPTION 'Este e-mail já possui cadastro no sistema.';
    END IF;
  ELSE
    -- Generate synthetic email for offline patient without email
    synthetic_email := 'offline.' || replace(gen_random_uuid()::text, '-', '') || '@pacientes.offline';
    clean_email := synthetic_email;

    offline_data := json_build_object(
      'phone', p_phone,
      'birth_date', p_birth_date,
      'gender', p_gender,
      'notes', p_notes,
      'email_pending', true,
      'synthetic_email', synthetic_email,
      'created_offline_at', now(),
      'created_by_professional_id', p_professional_id
    );
  END IF;

  new_patient_id := gen_random_uuid();
  strong_temp_pwd := extensions.crypt(gen_random_uuid()::text || gen_random_uuid()::text, extensions.gen_salt('bf'));

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    phone,
    phone_change,
    phone_change_token,
    reauthentication_token
  ) VALUES (
    new_patient_id,
    '00000000-0000-0000-0000-000000000000',
    clean_email,
    strong_temp_pwd,
    NULL,
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    json_build_object('name', trim(p_display_name), 'display_name', trim(p_display_name), 'is_offline', true),
    false,
    'authenticated',
    'authenticated',
    '', '', '', '', '',
    NULL,
    '', '', ''
  );

  UPDATE public.profiles
  SET
    is_offline = true,
    display_name = trim(p_display_name),
    email = clean_email
  WHERE id = new_patient_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      is_offline,
      role,
      status
    ) VALUES (
      new_patient_id,
      clean_email,
      trim(p_display_name),
      true,
      'user',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      is_offline = true,
      display_name = trim(p_display_name),
      email = clean_email;
  END IF;

  INSERT INTO public.professional_patients (
    professional_id,
    patient_id,
    status,
    requested_by,
    granted_pages,
    offline_details
  ) VALUES (
    p_professional_id,
    new_patient_id,
    'active',
    p_professional_id,
    default_granted,
    offline_data
  )
  ON CONFLICT (professional_id, patient_id) DO UPDATE SET
    status = 'active',
    granted_pages = default_granted,
    offline_details = EXCLUDED.offline_details;

  INSERT INTO public.admin_audit_logs (
    actor_id,
    action,
    target_user_id,
    target_email,
    details
  ) VALUES (
    caller_id,
    'create_offline_patient',
    new_patient_id,
    clean_email,
    json_build_object(
      'professional_id', p_professional_id,
      'display_name', trim(p_display_name),
      'has_real_email', has_real_email,
      'offline_details', offline_data
    )
  );

  RETURN new_patient_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_offline_patient(uuid, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_offline_patient(uuid, text, text, text, text, text, text) TO authenticated;

-- 3. Nova RPC: delete_patient_from_pro(p_link_id uuid)
CREATE OR REPLACE FUNCTION public.delete_patient_from_pro(p_link_id uuid)
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
  v_counts jsonb := '{}'::jsonb;
  v_cnt_appts integer := 0;
  v_cnt_notes integer := 0;
  v_cnt_diet_items integer := 0;
  v_cnt_diet_plans integer := 0;
  v_cnt_routines integer := 0;
  v_cnt_metrics integer := 0;
  v_cnt_metabolic integer := 0;
  v_cnt_recipes integer := 0;
  v_cnt_tasks integer := 0;
  v_cnt_habits integer := 0;
  v_cnt_total integer := 0;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  SELECT (role = 'master'), email INTO v_is_master, v_caller_email
  FROM public.profiles
  WHERE id = v_caller_id;

  -- Obter vínculo
  SELECT * INTO v_link
  FROM public.professional_patients
  WHERE id = p_link_id;

  IF v_link IS NULL THEN
    RAISE EXCEPTION 'Vínculo não encontrado.';
  END IF;

  -- Validar titularidade ou master
  IF v_link.professional_id <> v_caller_id AND NOT COALESCE(v_is_master, false) THEN
    RAISE EXCEPTION 'Acesso negado: apenas o profissional titular ou administrador Master pode excluir este paciente da base.';
  END IF;

  -- Obter perfil do paciente
  SELECT * INTO v_patient
  FROM public.profiles
  WHERE id = v_link.patient_id;

  IF v_patient IS NULL THEN
    -- Caso o perfil não exista mais mas o vínculo exista, removemos apenas o vínculo
    DELETE FROM public.professional_patients WHERE id = p_link_id;
    RETURN json_build_object('ok', true, 'removed_link_only', true);
  END IF;

  -- 1) Remover registros Pro criados pelo profissional para esse paciente
  -- Appointments do profissional com esse paciente
  WITH deleted AS (
    DELETE FROM public.professional_appointments
    WHERE professional_id = v_link.professional_id AND patient_id = v_link.patient_id
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_appts FROM deleted;

  -- Notes do profissional sobre esse paciente
  WITH deleted AS (
    DELETE FROM public.professional_notes
    WHERE professional_id = v_link.professional_id AND patient_id = v_link.patient_id
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_notes FROM deleted;

  -- Itens de diet_plans criados pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.diet_plan_items
    WHERE created_by = v_link.professional_id
      AND plan_id IN (SELECT id FROM public.diet_plans WHERE user_id = v_link.patient_id)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_diet_items FROM deleted;

  -- diet_plans criados pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.diet_plans
    WHERE user_id = v_link.patient_id AND (created_by = v_link.professional_id OR v_patient.is_offline)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_diet_plans FROM deleted;

  -- workout_routines criadas pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.workout_routines
    WHERE user_id = v_link.patient_id AND (created_by = v_link.professional_id OR v_patient.is_offline)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_routines FROM deleted;

  -- body_metrics criadas pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.body_metrics
    WHERE user_id = v_link.patient_id AND (created_by = v_link.professional_id OR v_patient.is_offline)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_metrics FROM deleted;

  -- metabolic_logs criados pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.metabolic_logs
    WHERE user_id = v_link.patient_id AND (created_by = v_link.professional_id OR v_patient.is_offline)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_metabolic FROM deleted;

  -- nutrition_recipes criadas pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.nutrition_recipes
    WHERE user_id = v_link.patient_id AND (created_by = v_link.professional_id OR v_patient.is_offline)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_recipes FROM deleted;

  -- tasks criadas pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.tasks
    WHERE user_id = v_link.patient_id AND (created_by = v_link.professional_id OR v_patient.is_offline)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_tasks FROM deleted;

  -- habits criados pelo profissional para esse paciente
  WITH deleted AS (
    DELETE FROM public.habits
    WHERE user_id = v_link.patient_id AND (created_by = v_link.professional_id OR v_patient.is_offline)
    RETURNING id
  )
  SELECT count(*) INTO v_cnt_habits FROM deleted;

  -- Vínculo da relação profissional-paciente
  DELETE FROM public.professional_patients WHERE id = p_link_id;

  v_cnt_total := v_cnt_appts + v_cnt_notes + v_cnt_diet_items + v_cnt_diet_plans +
                 v_cnt_routines + v_cnt_metrics + v_cnt_metabolic + v_cnt_recipes +
                 v_cnt_tasks + v_cnt_habits + 1;

  v_counts := jsonb_build_object(
    'appointments', v_cnt_appts,
    'notes', v_cnt_notes,
    'diet_plan_items', v_cnt_diet_items,
    'diet_plans', v_cnt_diet_plans,
    'workout_routines', v_cnt_routines,
    'body_metrics', v_cnt_metrics,
    'metabolic_logs', v_cnt_metabolic,
    'recipes', v_cnt_recipes,
    'tasks', v_cnt_tasks,
    'habits', v_cnt_habits,
    'total_removed', v_cnt_total
  );

  -- 2) Tratamento especial para paciente offline vs online
  IF COALESCE(v_patient.is_offline, false) = true THEN
    -- Paciente offline: verificar se não há outros vínculos ativos/encerrados com outro profissional
    IF NOT EXISTS (
      SELECT 1 FROM public.professional_patients
      WHERE patient_id = v_patient.id
    ) THEN
      -- Limpar dados residuais do paciente em tabelas do app
      DELETE FROM public.patient_goals WHERE user_id = v_patient.id;
      DELETE FROM public.medical_exams WHERE user_id = v_patient.id;
      DELETE FROM public.workout_history WHERE user_id = v_patient.id;
      DELETE FROM public.fasting_logs WHERE user_id = v_patient.id;
      DELETE FROM public.meal_logs WHERE user_id = v_patient.id;
      DELETE FROM public.mind_journals WHERE user_id = v_patient.id;
      DELETE FROM public.mind_events WHERE user_id = v_patient.id;
      DELETE FROM public.custom_foods WHERE user_id = v_patient.id;
      DELETE FROM public.nutrition_macro_goals WHERE user_id = v_patient.id;
      DELETE FROM public.nutrition_micro_goals WHERE user_id = v_patient.id;
      DELETE FROM public.daily_checklist WHERE user_id = v_patient.id;
      DELETE FROM public.transactions WHERE user_id = v_patient.id;
      DELETE FROM public.bank_accounts WHERE user_id = v_patient.id;
      DELETE FROM public.payment_methods WHERE user_id = v_patient.id;
      DELETE FROM public.passwords WHERE user_id = v_patient.id;
      DELETE FROM public.finance_categories WHERE user_id = v_patient.id;
      DELETE FROM public.investments WHERE user_id = v_patient.id;
      DELETE FROM public.investment_goals WHERE user_id = v_patient.id;
      DELETE FROM public.investment_transactions WHERE user_id = v_patient.id;
      DELETE FROM public.decks WHERE user_id = v_patient.id;
      DELETE FROM public.flashcards WHERE user_id = v_patient.id;
      DELETE FROM public.notes WHERE user_id = v_patient.id;
      DELETE FROM public.notebooks WHERE user_id = v_patient.id;
      DELETE FROM public.jiu_logs WHERE user_id = v_patient.id;
      DELETE FROM public.jiu_profiles WHERE user_id = v_patient.id;
      DELETE FROM public.jiu_techniques WHERE user_id = v_patient.id;
      DELETE FROM public.jiu_categories WHERE user_id = v_patient.id;
      DELETE FROM public.personal_records WHERE user_id = v_patient.id;

      -- Excluir de profiles e auth.users
      DELETE FROM public.profiles WHERE id = v_patient.id;
      DELETE FROM auth.users WHERE id = v_patient.id;
    END IF;
  END IF;

  -- 3) Gravar na tabela de auditoria admin_audit_logs
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
    'delete_patient_from_pro',
    v_patient.id,
    v_patient.email,
    jsonb_build_object(
      'link_id', p_link_id,
      'professional_id', v_link.professional_id,
      'patient_id', v_patient.id,
      'patient_name', v_patient.display_name,
      'patient_email', v_patient.email,
      'is_offline', COALESCE(v_patient.is_offline, false),
      'counts', v_counts,
      'deleted_at', now()
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'link_id', p_link_id,
    'patient_id', v_patient.id,
    'patient_name', v_patient.display_name,
    'is_offline', COALESCE(v_patient.is_offline, false),
    'counts', v_counts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_patient_from_pro(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_patient_from_pro(uuid) TO authenticated;
