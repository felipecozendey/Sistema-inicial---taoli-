-- Migration: 20261003033000_fix_create_offline_patient_optional_email.sql
-- Fixes search_path and pgcrypto usage in create_offline_patient
-- Adds support for optional email (synthetic email @pacientes.offline and email_pending: true)
-- Adds set_offline_patient_email RPC to allow setting real email before conversion

-- 1. Redefine create_offline_patient
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
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- Must be the professional himself or master
  SELECT (role = 'master') INTO is_caller_master
  FROM public.profiles
  WHERE id = caller_id;

  IF caller_id <> p_professional_id AND NOT COALESCE(is_caller_master, false) THEN
    RAISE EXCEPTION 'Acesso negado: você só pode cadastrar pacientes para seu próprio consultório.';
  END IF;

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

  default_granted := ARRAY['tarefas', 'saude', 'prontuario_geral', 'nutricao', 'exercicios', 'raio_x']::text[];

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

      -- Existing offline patient: link to this professional if not linked yet
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

      -- Audit log
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

    -- Also check auth.users directly
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

  -- Case B: Create new user in auth.users
  new_patient_id := gen_random_uuid();
  -- Strong random hash for password using extensions.crypt and extensions.gen_salt
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
    NULL, -- E-mail NÃO confirmado
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    json_build_object('name', trim(p_display_name), 'display_name', trim(p_display_name), 'is_offline', true),
    false,
    'authenticated',
    'authenticated',
    '', '', '', '', '',
    NULL, -- phone MUST be NULL due to UNIQUE constraint
    '', '', ''
  );

  -- Upsert / Update profiles
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

  -- Create relationship in professional_patients
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

  -- Gravar em admin_audit_logs
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

-- 2. RPC: set_offline_patient_email(patient_id, email)
-- Security Definer to update the email of an offline patient before conversion
CREATE OR REPLACE FUNCTION public.set_offline_patient_email(
  p_patient_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  caller_id uuid;
  is_caller_master boolean;
  clean_email text;
  patient_profile record;
  patient_link record;
  updated_offline_details jsonb;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  SELECT (role = 'master') INTO is_caller_master
  FROM public.profiles
  WHERE id = caller_id;

  -- Verify active link or master
  SELECT * INTO patient_link
  FROM public.professional_patients
  WHERE professional_id = caller_id
    AND patient_id = p_patient_id
    AND status = 'active';

  IF NOT FOUND AND NOT COALESCE(is_caller_master, false) THEN
    RAISE EXCEPTION 'Acesso negado: você não possui vínculo ativo com este paciente.';
  END IF;

  clean_email := lower(trim(p_email));
  IF clean_email = '' OR clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Informe um e-mail válido.';
  END IF;

  IF clean_email LIKE '%@pacientes.offline' THEN
    RAISE EXCEPTION 'Informe um e-mail real.';
  END IF;

  -- Check target patient
  SELECT id, email, display_name, is_offline INTO patient_profile
  FROM public.profiles
  WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente não encontrado.';
  END IF;

  IF NOT patient_profile.is_offline THEN
    RAISE EXCEPTION 'Este paciente já possui conta online regular.';
  END IF;

  -- Check if real email is already used by another user
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(email) = clean_email AND id <> p_patient_id
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = clean_email AND id <> p_patient_id
  ) THEN
    RAISE EXCEPTION 'Este e-mail já está em uso por outro usuário no sistema.';
  END IF;

  -- Update auth.users email
  UPDATE auth.users
  SET
    email = clean_email,
    updated_at = NOW()
  WHERE id = p_patient_id;

  -- Update profiles email
  UPDATE public.profiles
  SET
    email = clean_email,
    updated_at = NOW()
  WHERE id = p_patient_id;

  -- Update offline_details across links for this patient
  UPDATE public.professional_patients
  SET offline_details = COALESCE(offline_details, '{}'::jsonb) || json_build_object(
    'email_pending', false,
    'email_updated_at', now(),
    'email_updated_by', caller_id
  )::jsonb
  WHERE patient_id = p_patient_id;

  -- Audit log
  INSERT INTO public.admin_audit_logs (
    actor_id,
    action,
    target_user_id,
    target_email,
    details
  ) VALUES (
    caller_id,
    'set_offline_patient_email',
    p_patient_id,
    clean_email,
    json_build_object(
      'old_email', patient_profile.email,
      'new_email', clean_email
    )
  );

  RETURN json_build_object(
    'ok', true,
    'patient_id', p_patient_id,
    'email', clean_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_offline_patient_email(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_offline_patient_email(uuid, text) TO authenticated;
