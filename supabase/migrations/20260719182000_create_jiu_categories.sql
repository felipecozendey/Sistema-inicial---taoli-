CREATE TABLE IF NOT EXISTS jiu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jiu_categories_user_id ON jiu_categories(user_id);

ALTER TABLE jiu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jiu_categories_select" ON jiu_categories;
CREATE POLICY "jiu_categories_select" ON jiu_categories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "jiu_categories_insert" ON jiu_categories;
CREATE POLICY "jiu_categories_insert" ON jiu_categories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "jiu_categories_delete" ON jiu_categories;
CREATE POLICY "jiu_categories_delete" ON jiu_categories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'felipecozendey@gmail.com';
  IF v_user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM jiu_categories WHERE user_id = v_user_id) THEN
      INSERT INTO jiu_categories (user_id, name) VALUES
        (v_user_id, 'Queda'),
        (v_user_id, 'Passagem'),
        (v_user_id, 'Raspagem'),
        (v_user_id, 'Finalização'),
        (v_user_id, 'Defesa');
    END IF;
  END IF;
END $$;
