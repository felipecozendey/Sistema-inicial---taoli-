-- Migration: create payment_methods, bank_accounts, investments, investment_goals and update transactions for installments
-- Created at 2026-09-09

-- 1. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'credit_card', -- credit_card, debit_card, pix, cash, boleto, other
  color TEXT DEFAULT '#1CB0F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_select" ON public.payment_methods;
CREATE POLICY "payment_methods_select" ON public.payment_methods
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_insert" ON public.payment_methods;
CREATE POLICY "payment_methods_insert" ON public.payment_methods
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_update" ON public.payment_methods;
CREATE POLICY "payment_methods_update" ON public.payment_methods
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_delete" ON public.payment_methods;
CREATE POLICY "payment_methods_delete" ON public.payment_methods
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Create bank_accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking', -- checking, savings, wallet, investment
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#58CC02',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_accounts_select" ON public.bank_accounts;
CREATE POLICY "bank_accounts_select" ON public.bank_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bank_accounts_update" ON public.bank_accounts;
CREATE POLICY "bank_accounts_update" ON public.bank_accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bank_accounts_delete" ON public.bank_accounts;
CREATE POLICY "bank_accounts_delete" ON public.bank_accounts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Create investment_goals table
CREATE TABLE IF NOT EXISTS public.investment_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_goals_user_id ON public.investment_goals(user_id);

ALTER TABLE public.investment_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investment_goals_select" ON public.investment_goals;
CREATE POLICY "investment_goals_select" ON public.investment_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_goals_insert" ON public.investment_goals;
CREATE POLICY "investment_goals_insert" ON public.investment_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_goals_update" ON public.investment_goals;
CREATE POLICY "investment_goals_update" ON public.investment_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_goals_delete" ON public.investment_goals;
CREATE POLICY "investment_goals_delete" ON public.investment_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Create investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Outros', -- Ações, Fundos, CDB, Tesouro, Cripto, Imóveis, Outros
  invested_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.investment_goals(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_bank_account_id ON public.investments(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_investments_goal_id ON public.investments(goal_id);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investments_select" ON public.investments;
CREATE POLICY "investments_select" ON public.investments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "investments_insert" ON public.investments;
CREATE POLICY "investments_insert" ON public.investments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investments_update" ON public.investments;
CREATE POLICY "investments_update" ON public.investments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investments_delete" ON public.investments;
CREATE POLICY "investments_delete" ON public.investments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Add installment & account / payment method columns to transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS total_installments INTEGER,
  ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON public.transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON public.transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON public.transactions(parent_id);
