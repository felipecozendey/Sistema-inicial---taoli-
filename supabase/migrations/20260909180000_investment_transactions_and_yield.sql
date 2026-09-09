-- Refatoração de Investimentos e Metas: rendimento, aportes, retiradas e histórico
-- 1. Alterar tabela investments
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS initial_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yield_rate NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS yield_frequency TEXT NULL;

-- Adicionar CHECK para yield_frequency de forma idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'investments_yield_frequency_check'
  ) THEN
    ALTER TABLE public.investments
      ADD CONSTRAINT investments_yield_frequency_check
      CHECK (yield_frequency IS NULL OR yield_frequency IN ('monthly', 'weekly', 'daily'));
  END IF;
END $$;

-- Preservar dados atuais dos usuários: initial_amount = invested_amount existente
UPDATE public.investments
SET initial_amount = COALESCE(invested_amount, 0)
WHERE initial_amount = 0 AND invested_amount > 0;

-- 2. Alterar tabela investment_goals (adicionar initial_amount para consistência)
ALTER TABLE public.investment_goals
  ADD COLUMN IF NOT EXISTS initial_amount NUMERIC NOT NULL DEFAULT 0;

-- 3. Criar tabela investment_transactions
CREATE TABLE IF NOT EXISTS public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  goal_id UUID NULL REFERENCES public.investment_goals(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('contribution', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inv_tx_user_id ON public.investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_investment_id ON public.investment_transactions(investment_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_goal_id ON public.investment_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_date ON public.investment_transactions(date DESC);

-- Habilitar RLS
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS idempotentes
DROP POLICY IF EXISTS "investment_transactions_select" ON public.investment_transactions;
CREATE POLICY "investment_transactions_select" ON public.investment_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_transactions_insert" ON public.investment_transactions;
CREATE POLICY "investment_transactions_insert" ON public.investment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_transactions_update" ON public.investment_transactions;
CREATE POLICY "investment_transactions_update" ON public.investment_transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_transactions_delete" ON public.investment_transactions;
CREATE POLICY "investment_transactions_delete" ON public.investment_transactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
