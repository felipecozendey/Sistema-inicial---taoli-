CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "transactions_select" ON transactions;
  CREATE POLICY "transactions_select" ON transactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "transactions_insert" ON transactions;
  CREATE POLICY "transactions_insert" ON transactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "transactions_update" ON transactions;
  CREATE POLICY "transactions_update" ON transactions
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "transactions_delete" ON transactions;
  CREATE POLICY "transactions_delete" ON transactions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;

INSERT INTO transactions (user_id, type, amount, category, description, date, status)
SELECT id, 'income', 5000, '💰 Salário', 'Salário mensal', NOW(), 'paid'
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, type, amount, category, description, date, status)
SELECT id, 'expense', 1200, '🏠 Casa', 'Aluguel', NOW(), 'paid'
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, type, amount, category, description, date, status)
SELECT id, 'expense', 450, '🍔 Alimentação', 'Supermercado', NOW(), 'pending'
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, type, amount, category, description, date, status)
SELECT id, 'income', 800, '💼 Freelance', 'Projeto extra', NOW(), 'pending'
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;
