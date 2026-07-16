-- Add mood and notes columns to body_metrics for unified mental health assessment
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS mood INTEGER;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create mind_journals table for rich-text emotional journaling
CREATE TABLE IF NOT EXISTS mind_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mind_journals_user_id ON mind_journals(user_id);

-- Enable RLS
ALTER TABLE mind_journals ENABLE ROW LEVEL SECURITY;

-- RLS policies for mind_journals
DROP POLICY IF EXISTS "mind_journals_select" ON mind_journals;
CREATE POLICY "mind_journals_select" ON mind_journals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mind_journals_insert" ON mind_journals;
CREATE POLICY "mind_journals_insert" ON mind_journals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mind_journals_update" ON mind_journals;
CREATE POLICY "mind_journals_update" ON mind_journals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mind_journals_delete" ON mind_journals;
CREATE POLICY "mind_journals_delete" ON mind_journals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed auth user (idempotent)
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
