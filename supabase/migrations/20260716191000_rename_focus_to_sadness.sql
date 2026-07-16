-- Rename focus_level to sadness_level (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_metrics' AND column_name = 'sadness_level') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_metrics' AND column_name = 'focus_level') THEN
      ALTER TABLE body_metrics RENAME COLUMN focus_level TO sadness_level;
    ELSE
      ALTER TABLE body_metrics ADD COLUMN sadness_level INTEGER;
    END IF;
  END IF;
END $$;

-- Clean up out-of-range values before adding constraints
UPDATE body_metrics SET mood = NULL WHERE mood IS NOT NULL AND (mood < 1 OR mood > 5);
UPDATE body_metrics SET stress_level = NULL WHERE stress_level IS NOT NULL AND (stress_level < 1 OR stress_level > 5);
UPDATE body_metrics SET anxiety_level = NULL WHERE anxiety_level IS NOT NULL AND (anxiety_level < 1 OR anxiety_level > 5);
UPDATE body_metrics SET sleep_quality = NULL WHERE sleep_quality IS NOT NULL AND (sleep_quality < 1 OR sleep_quality > 5);
UPDATE body_metrics SET sadness_level = NULL WHERE sadness_level IS NOT NULL AND (sadness_level < 1 OR sadness_level > 5);

-- Add CHECK constraints (1-5) for mental health columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'body_metrics_mood_check') THEN
    ALTER TABLE body_metrics ADD CONSTRAINT body_metrics_mood_check CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'body_metrics_stress_level_check') THEN
    ALTER TABLE body_metrics ADD CONSTRAINT body_metrics_stress_level_check CHECK (stress_level IS NULL OR (stress_level >= 1 AND stress_level <= 5));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'body_metrics_anxiety_level_check') THEN
    ALTER TABLE body_metrics ADD CONSTRAINT body_metrics_anxiety_level_check CHECK (anxiety_level IS NULL OR (anxiety_level >= 1 AND anxiety_level <= 5));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'body_metrics_sleep_quality_check') THEN
    ALTER TABLE body_metrics ADD CONSTRAINT body_metrics_sleep_quality_check CHECK (sleep_quality IS NULL OR (sleep_quality >= 1 AND sleep_quality <= 5));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'body_metrics_sadness_level_check') THEN
    ALTER TABLE body_metrics ADD CONSTRAINT body_metrics_sadness_level_check CHECK (sadness_level IS NULL OR (sadness_level >= 1 AND sadness_level <= 5));
  END IF;
END $$;

-- Ensure mind_journals table exists
CREATE TABLE IF NOT EXISTS mind_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mind_journals_user_id ON mind_journals(user_id);

ALTER TABLE mind_journals ENABLE ROW LEVEL SECURITY;

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
