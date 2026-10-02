-- Migration: 20261002190000_offline_patients_v1.sql
-- Implements offline patient support for healthcare professionals
-- 1. profiles: add is_offline boolean default false
-- 2. professional_patients: add offline_details jsonb default '{}'::jsonb
-- 3. update public_profiles view so offline patients never appear in Social
-- 4. create_offline_patient RPC (SECURITY DEFINER)
-- 5. convert_offline_patient RPC (SECURITY DEFINER)
-- 6. Trigger / callback on auth.users login / profile update to clear is_offline once email is confirmed or logged in

-- 1. Alter profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_offline BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_offline ON public.profiles(is_offline);

-- 2. Alter professional_patients
ALTER TABLE public.professional_patients
  ADD COLUMN IF NOT EXISTS offline_details JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Update public_profiles view: patient offline MUST NOT appear in Social
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  username,
  display_name,
  avatar_url,
  banner_url,
  bio,
  motivational_phrase,
  is_private,
  is_banned,
  created_at
FROM public.profiles
WHERE is_offline = false;

-- 4. RPC: check_offline_email(email_to_check text)
-- Returns jsonb with status:
-- 'free': email does not exist anywhere
-- 'offline_patient': email belongs to an offline patient (can link, returns patient_id and existing professional info)
-- 'registered_user': email already belongs to an active online user (must block offline registration)
CREATE OR REPLACE FUNCTION public.check_offline_email(email_to_check text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  clean_email text;
  found_profile record;
  caller_id uuid;
  first_prof_id uuid;
  first_prof_name text;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  clean_email := lower(trim(email_to_check));
  IF clean_email = '' OR clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'E-mail inválido.';
  END IF;

  SELECT p.id, p.is_offline, p.display_name, p.email
  INTO found_profile
  FROM public.profiles p
  WHERE lower(p.email) = clean_email
  LIMIT 1;

  IF NOT FOUND THEN
    -- Also verify directly in auth.users just in case
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = clean_email) THEN
      RETURN json_build_object(
        'status', 'registered_user',
        'message', 'Este e-mail já possui cadastro no sistema.'
      );
    END IF;
    RETURN json_build_object('status', 'free');
  END IF;

  -- If found and NOT offline, it is an active system user
  IF NOT found_profile.is_offline THEN
    RETURN json_build_object(
      'status', 'registered_user',
      'message', 'Este e-mail já possui cadastro no sistema.'
    );
  END IF;

  -- If found and IS offline:
  -- Check who was the first professional or if current caller is already linked
  IF EXISTS (
    SELECT 1 FROM public.professional_patients
    WHERE patient_id = found_profile.id
      AND professional_id = caller_id
      AND status IN ('active', 'pending')
  ) THEN
    RETURN json_build_object(
      'status', 'already_linked',
      'patient_id', found_profile.id,
      'message', 'Você já possui cadastro ou convite para este paciente offline.'
    );
  END IF;

  -- Look up first professional
  SELECT pp.professional_id, COALESCE(pr.display_name, 'Outro profissional')
  INTO first_prof_id, first_prof_name
  FROM public.professional_patients pp
  LEFT JOIN public.profiles pr ON pr.id = pp.professional_id
  WHERE pp.patient_id = found_profile.id
  ORDER BY pp.created_at ASC
  LIMIT 1;

  RETURN json_build_object(
    'status', 'offline_patient',
    'patient_id', found_profile.id,
    'first_professional_id', first_prof_id,
    'first_professional_name', first_prof_name,
    'message', 'Este paciente já possui cadastro offline com outro profissional de saúde. Ao converter para online, apenas o primeiro profissional que solicitou a mudança terá os dados importados; as demais informações deverão ser incluídas manualmente.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_offline_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_offline_email(text) TO authenticated;

-- 5. RPC: create_offline_patient
CREATE OR REPLACE FUNCTION public.create_offline_patient(
  p_professional_id uuid,
  p_email text,
  p_display_name text,
  p_phone text DEFAULT NULL,
  p_birth_date text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_gender text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id uuid;
  is_caller_master boolean;
  clean_email text;
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

  clean_email := lower(trim(p_email));
  IF clean_email = '' OR clean_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'E-mail inválido.';
  END IF;

  IF p_display_name IS NULL OR trim(p_display_name) = '' THEN
    RAISE EXCEPTION 'O nome do paciente é obrigatório.';
  END IF;

  -- 1. Check if email already exists in profiles or auth.users
  SELECT id, is_offline, display_name INTO existing_profile
  FROM public.profiles
  WHERE lower(email) = clean_email
  LIMIT 1;

  offline_data := json_build_object(
    'phone', p_phone,
    'birth_date', p_birth_date,
    'gender', p_gender,
    'notes', p_notes,
    'created_offline_at', now(),
    'created_by_professional_id', p_professional_id
  );

  default_granted := ARRAY['tarefas', 'saude', 'prontuario_geral', 'nutricao', 'exercicios', 'raio_x']::text[];

  -- Case A: Patient already exists as OFFLINE
  IF existing_profile.id IS NOT NULL THEN
    IF NOT existing_profile.is_offline THEN
      RAISE EXCEPTION 'Este e-mail já possui cadastro no sistema.';
    END IF;

    -- Existing offline patient: link to this professional if not linked yet
    new_patient_id := existing_profile.id;

    -- Upsert link for this professional
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

  -- Case B: Create new user in auth.users
  new_patient_id := gen_random_uuid();
  -- Strong random hash for password
  strong_temp_pwd := crypt(gen_random_uuid()::text || gen_random_uuid()::text, gen_salt('bf'));

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
    NULL, -- E-mail NÃO confirmado, auto-confirm OFF
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

  -- The trigger handle_new_user_profile creates the profiles row, but ensure is_offline=true and display_name
  UPDATE public.profiles
  SET
    is_offline = true,
    display_name = trim(p_display_name)
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
      display_name = trim(p_display_name);
  END IF;

  -- Create relationship in professional_patients with status 'active' and offline_details
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

  -- Gravar em admin_audit_logs (action create_offline_patient)
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
      'offline_details', offline_data
    )
  );

  RETURN new_patient_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_offline_patient(uuid, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_offline_patient(uuid, text, text, text, text, text, text) TO authenticated;

-- 6. RPC: convert_offline_patient(p_patient_id uuid)
-- Validates caller has active link with patient
-- Checks if another professional already requested conversion first (stored in offline_details->first_conversion_by or admin_audit_logs)
-- Returns jsonb with structured result
CREATE OR REPLACE FUNCTION public.convert_offline_patient(p_patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id uuid;
  patient_profile record;
  patient_link record;
  existing_first_prof uuid;
  is_first boolean := false;
  first_prof_name text;
  updated_offline_details jsonb;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- Verify active link
  SELECT * INTO patient_link
  FROM public.professional_patients
  WHERE professional_id = caller_id
    AND patient_id = p_patient_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vínculo ativo não encontrado entre este profissional e o paciente.';
  END IF;

  -- Verify patient profile
  SELECT id, email, display_name, is_offline INTO patient_profile
  FROM public.profiles
  WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente não encontrado.';
  END IF;

  IF NOT patient_profile.is_offline THEN
    RETURN json_build_object(
      'ok', true,
      'already_online', true,
      'message', 'Este paciente já foi convertido para conta online.'
    );
  END IF;

  -- Check if another professional already requested conversion earlier
  SELECT target_user_id, actor_id INTO patient_profile
  FROM public.admin_audit_logs
  WHERE action = 'convert_offline_patient_request'
    AND target_user_id = p_patient_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF patient_profile.actor_id IS NOT NULL THEN
    existing_first_prof := patient_profile.actor_id;
  END IF;

  IF existing_first_prof IS NOT NULL AND existing_first_prof <> caller_id THEN
    -- Another professional was first!
    SELECT COALESCE(display_name, 'Outro profissional') INTO first_prof_name
    FROM public.profiles
    WHERE id = existing_first_prof;

    -- Still record this conversion attempt
    INSERT INTO public.admin_audit_logs (
      actor_id,
      action,
      target_user_id,
      target_email,
      details
    ) VALUES (
      caller_id,
      'convert_offline_patient_request_secondary',
      p_patient_id,
      patient_link.offline_details->>'email',
      json_build_object(
        'first_conversion_by', existing_first_prof,
        'first_professional_name', first_prof_name
      )
    );

    RETURN json_build_object(
      'ok', true,
      'is_first', false,
      'patient_id', p_patient_id,
      'patient_email', patient_link.offline_details->>'email',
      'warning', 'Outro profissional já solicitou a conversão deste paciente; os dados dele NÃO serão importados — inclusão manual',
      'first_professional_name', first_prof_name
    );
  ELSE
    -- This caller is the FIRST to request conversion!
    is_first := true;

    -- Mark offline_details on the patient link
    updated_offline_details := COALESCE(patient_link.offline_details, '{}'::jsonb) || json_build_object(
      'first_conversion_by', caller_id,
      'conversion_requested_at', now()
    )::jsonb;

    UPDATE public.professional_patients
    SET offline_details = updated_offline_details
    WHERE professional_id = caller_id AND patient_id = p_patient_id;

    -- Audit log
    INSERT INTO public.admin_audit_logs (
      actor_id,
      action,
      target_user_id,
      target_email,
      details
    ) VALUES (
      caller_id,
      'convert_offline_patient_request',
      p_patient_id,
      patient_link.offline_details->>'email',
      json_build_object(
        'first_conversion_by', caller_id,
        'requested_at', now()
      )
    );

    RETURN json_build_object(
      'ok', true,
      'is_first', true,
      'patient_id', p_patient_id,
      'patient_email', patient_link.offline_details->>'email',
      'message', 'Convite de conversão registrado com sucesso. O paciente foi convidado para acessar o sistema.'
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_offline_patient(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_offline_patient(uuid) TO authenticated;

-- 7. Trigger on auth.users / profiles to flip is_offline=false upon first authenticated confirmation
CREATE OR REPLACE FUNCTION public.handle_patient_online_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When email_confirmed_at is set or updated in auth.users
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) THEN
    UPDATE public.profiles
    SET is_offline = false,
        updated_at = NOW()
    WHERE id = NEW.id AND is_offline = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_patient_online_activation ON auth.users;
CREATE TRIGGER tr_patient_online_activation
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_patient_online_activation();
