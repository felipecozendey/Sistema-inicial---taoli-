ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS patient_profile TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS calc_formula TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS injury_factor NUMERIC NOT NULL DEFAULT 1.0;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS met_activities JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS tmb NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS get NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS venta_target NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS methodology_used TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS lean_mass NUMERIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'felipecozendey@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'felipecozendey@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Felipe Cozendey"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;
