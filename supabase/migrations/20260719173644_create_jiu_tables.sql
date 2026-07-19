CREATE TABLE IF NOT EXISTS jiu_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  belt TEXT NOT NULL DEFAULT 'White',
  stripes INTEGER NOT NULL DEFAULT 0 CHECK (stripes >= 0 AND stripes <= 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jiu_profiles_user_id ON jiu_profiles(user_id);

CREATE TABLE IF NOT EXISTS jiu_techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jiu_techniques_user_id ON jiu_techniques(user_id);

CREATE TABLE IF NOT EXISTS jiu_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  sparring_rounds INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jiu_logs_user_id ON jiu_logs(user_id);

ALTER TABLE jiu_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jiu_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE jiu_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "jiu_profiles_select" ON jiu_profiles;
  CREATE POLICY "jiu_profiles_select" ON jiu_profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_profiles_insert" ON jiu_profiles;
  CREATE POLICY "jiu_profiles_insert" ON jiu_profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_profiles_update" ON jiu_profiles;
  CREATE POLICY "jiu_profiles_update" ON jiu_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_profiles_delete" ON jiu_profiles;
  CREATE POLICY "jiu_profiles_delete" ON jiu_profiles
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "jiu_techniques_select" ON jiu_techniques;
  CREATE POLICY "jiu_techniques_select" ON jiu_techniques
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_techniques_insert" ON jiu_techniques;
  CREATE POLICY "jiu_techniques_insert" ON jiu_techniques
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_techniques_update" ON jiu_techniques;
  CREATE POLICY "jiu_techniques_update" ON jiu_techniques
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_techniques_delete" ON jiu_techniques;
  CREATE POLICY "jiu_techniques_delete" ON jiu_techniques
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "jiu_logs_select" ON jiu_logs;
  CREATE POLICY "jiu_logs_select" ON jiu_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_logs_insert" ON jiu_logs;
  CREATE POLICY "jiu_logs_insert" ON jiu_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "jiu_logs_delete" ON jiu_logs;
  CREATE POLICY "jiu_logs_delete" ON jiu_logs
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;

DO $$
DECLARE
  jiu_user_id uuid;
BEGIN
  SELECT id INTO jiu_user_id FROM auth.users WHERE email = 'felipecozendey@gmail.com';
  IF jiu_user_id IS NOT NULL THEN
    INSERT INTO jiu_profiles (user_id, belt, stripes)
    VALUES (jiu_user_id, 'Blue', 2)
    ON CONFLICT (user_id) DO NOTHING;

    IF NOT EXISTS (SELECT 1 FROM jiu_techniques WHERE user_id = jiu_user_id) THEN
      INSERT INTO jiu_techniques (user_id, name, category, proficiency) VALUES
        (jiu_user_id, 'Duplo Pulo', 'Queda', 1),
        (jiu_user_id, 'Rasteira de Mão', 'Queda', 2),
        (jiu_user_id, 'Passagem de Joelho', 'Passagem', 3),
        (jiu_user_id, 'Passagem Toreando', 'Passagem', 2),
        (jiu_user_id, 'Raspagem de Pernas', 'Raspagem', 3),
        (jiu_user_id, 'Raspagem Tesoura', 'Raspagem', 2),
        (jiu_user_id, 'Triângulo', 'Finalização', 3),
        (jiu_user_id, 'Kimura', 'Finalização', 2),
        (jiu_user_id, 'Americana', 'Finalização', 3),
        (jiu_user_id, 'Defesa de Triângulo', 'Defesa', 1),
        (jiu_user_id, 'Defesa de Kimura', 'Defesa', 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM jiu_logs WHERE user_id = jiu_user_id) THEN
      INSERT INTO jiu_logs (user_id, date, duration_minutes, sparring_rounds, notes) VALUES
        (jiu_user_id, NOW() - INTERVAL '1 day', 90, 5, 'Treino pesado de guarda'),
        (jiu_user_id, NOW() - INTERVAL '3 days', 60, 3, 'Drills de passagem'),
        (jiu_user_id, NOW() - INTERVAL '5 days', 120, 8, 'Muito sparring hoje'),
        (jiu_user_id, NOW() - INTERVAL '7 days', 75, 4, 'Trabalhei raspagens'),
        (jiu_user_id, NOW() - INTERVAL '10 days', 90, 6, 'Rolagem com faixa preta'),
        (jiu_user_id, NOW() - INTERVAL '12 days', 60, 3, 'Treino leve'),
        (jiu_user_id, NOW() - INTERVAL '14 days', 100, 7, 'Excelente treino de finalizações');
    END IF;
  END IF;
END $$;
