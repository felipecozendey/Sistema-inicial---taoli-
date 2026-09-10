-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('master', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. Trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Trigger on auth.users to create profile (default role 'user', active)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for any existing auth.users
INSERT INTO public.profiles (id, email, display_name, role, status)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  'user',
  'active'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Promote initial master user: felipecozendey@gmail.com
UPDATE public.profiles
SET role = 'master'
WHERE email = 'felipecozendey@gmail.com';

-- 5. Helper function is_master() - security definer, stable, search_path fixed
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'master'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 6. Admin audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_email TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_select_admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "master_select_admin_audit_logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.is_master());

DROP POLICY IF EXISTS "master_insert_admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "master_insert_admin_audit_logs" ON public.admin_audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_master());

-- 7. Security definer functions for set_user_role and set_user_status
CREATE OR REPLACE FUNCTION public.set_user_role(target UUID, new_role TEXT)
RETURNS VOID AS $$
DECLARE
  caller_email TEXT;
  target_user_email TEXT;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas usuários Master podem alterar papéis.';
  END IF;

  IF new_role NOT IN ('master', 'user') THEN
    RAISE EXCEPTION 'Papel inválido: %', new_role;
  END IF;

  -- Block self demotion
  IF target = auth.uid() AND new_role = 'user' THEN
    RAISE EXCEPTION 'Auto-rebaixamento bloqueado: você não pode remover seu próprio privilégio de Master.';
  END IF;

  SELECT email INTO caller_email FROM public.profiles WHERE id = auth.uid();
  SELECT email INTO target_user_email FROM public.profiles WHERE id = target;

  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário alvo não encontrado.';
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target;

  INSERT INTO public.admin_audit_logs (actor_id, actor_email, action, target_user_id, target_email, details)
  VALUES (
    auth.uid(),
    caller_email,
    'set_role',
    target,
    target_user_email,
    jsonb_build_object('new_role', new_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_user_status(target UUID, new_status TEXT)
RETURNS VOID AS $$
DECLARE
  caller_email TEXT;
  target_user_email TEXT;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas usuários Master podem alterar o status de contas.';
  END IF;

  IF new_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Status inválido: %', new_status;
  END IF;

  IF target = auth.uid() AND new_status = 'suspended' THEN
    RAISE EXCEPTION 'Auto-suspensão bloqueada: você não pode suspender sua própria conta.';
  END IF;

  SELECT email INTO caller_email FROM public.profiles WHERE id = auth.uid();
  SELECT email INTO target_user_email FROM public.profiles WHERE id = target;

  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário alvo não encontrado.';
  END IF;

  UPDATE public.profiles
  SET status = new_status, updated_at = NOW()
  WHERE id = target;

  INSERT INTO public.admin_audit_logs (actor_id, actor_email, action, target_user_id, target_email, details)
  VALUES (
    auth.uid(),
    caller_email,
    CASE WHEN new_status = 'suspended' THEN 'suspend' ELSE 'reactivate' END,
    target,
    target_user_email,
    jsonb_build_object('new_status', new_status)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self_or_master" ON public.profiles;
CREATE POLICY "profiles_select_self_or_master" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_master());

DROP POLICY IF EXISTS "profiles_update_self_display_name" ON public.profiles;
CREATE POLICY "profiles_update_self_display_name" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 9. Billings table
CREATE TABLE IF NOT EXISTS public.billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billings_user_id ON public.billings(user_id);
CREATE INDEX IF NOT EXISTS idx_billings_due_date ON public.billings(due_date);
CREATE INDEX IF NOT EXISTS idx_billings_status ON public.billings(status);

ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billings_select_policy" ON public.billings;
CREATE POLICY "billings_select_policy" ON public.billings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_master());

DROP POLICY IF EXISTS "billings_master_insert" ON public.billings;
CREATE POLICY "billings_master_insert" ON public.billings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "billings_master_update" ON public.billings;
CREATE POLICY "billings_master_update" ON public.billings
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "billings_master_delete" ON public.billings;
CREATE POLICY "billings_master_delete" ON public.billings
  FOR DELETE TO authenticated
  USING (public.is_master());

-- 10. Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_flags_select_all" ON public.feature_flags;
CREATE POLICY "feature_flags_select_all" ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.set_feature_flag(p_key TEXT, p_enabled BOOLEAN)
RETURNS VOID AS $$
DECLARE
  caller_email TEXT;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode alterar feature flags.';
  END IF;

  SELECT email INTO caller_email FROM public.profiles WHERE id = auth.uid();

  UPDATE public.feature_flags
  SET enabled = p_enabled, updated_at = NOW()
  WHERE key = p_key;

  INSERT INTO public.admin_audit_logs (actor_id, actor_email, action, details)
  VALUES (
    auth.uid(),
    caller_email,
    'toggle_feature',
    jsonb_build_object('key', p_key, 'enabled', p_enabled)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Seed feature flags
INSERT INTO public.feature_flags (key, label, description, enabled)
VALUES
  ('tasks', 'Tarefas e Hábitos', 'Módulo de gerenciamento de tarefas, rotinas diárias e hábitos', true),
  ('health', 'Saúde e Treinos', 'Módulo de antropometria, nutrição, jejum, treinos e mente', true),
  ('studies', 'Estudos e Flashcards', 'Módulo de cadernos, notas, decks e repetição espaçada', true),
  ('finance', 'Finanças Pessoais', 'Módulo de transações, contas bancárias, metas e investimentos', true),
  ('analytics', 'Relatórios e Métricas', 'Módulo de dashboards analíticos e gráficos evolutivos', true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label, description = EXCLUDED.description;

-- 11. Allow Master to view global transactions and investments for Global Finance view
DROP POLICY IF EXISTS "master_select_all_transactions" ON public.transactions;
CREATE POLICY "master_select_all_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_master());

DROP POLICY IF EXISTS "master_select_all_investments" ON public.investments;
CREATE POLICY "master_select_all_investments" ON public.investments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_master());
