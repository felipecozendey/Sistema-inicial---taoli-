CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES finance_categories(id) ON DELETE CASCADE,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#1CB0F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_categories_user_id ON finance_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_parent_id ON finance_categories(parent_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_categories_user_name_parent
ON finance_categories (user_id, name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'));

ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_categories_select" ON finance_categories;
CREATE POLICY "finance_categories_select" ON finance_categories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_categories_insert" ON finance_categories;
CREATE POLICY "finance_categories_insert" ON finance_categories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_categories_update" ON finance_categories;
CREATE POLICY "finance_categories_update" ON finance_categories
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "finance_categories_delete" ON finance_categories;
CREATE POLICY "finance_categories_delete" ON finance_categories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'felipecozendey@gmail.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  INSERT INTO finance_categories (user_id, name, parent_id, icon, color)
  VALUES
    (v_user_id, 'Casa', NULL, '🏠', '#1CB0F6'),
    (v_user_id, 'Alimentação', NULL, '🍔', '#FF9600'),
    (v_user_id, 'Transporte', NULL, '🚗', '#82D936'),
    (v_user_id, 'Salário', NULL, '💰', '#58CC02'),
    (v_user_id, 'Freelance', NULL, '💼', '#CE82FF'),
    (v_user_id, 'Streaming', NULL, '📺', '#FF4B4B'),
    (v_user_id, 'Academia', NULL, '🏋️', '#FFC800'),
    (v_user_id, 'Saúde', NULL, '💊', '#FF4B4B'),
    (v_user_id, 'Educação', NULL, '📚', '#1CB0F6'),
    (v_user_id, 'Lazer', NULL, '🎮', '#CE82FF'),
    (v_user_id, 'Compras', NULL, '🛒', '#FF9600'),
    (v_user_id, 'Outros', NULL, '📦', '#AFAFAF')
  ON CONFLICT DO NOTHING;
END $$;
