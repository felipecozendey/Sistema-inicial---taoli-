-- Migration: AI Infrastructure Phase 1 (ai_provider_settings, ai_config, ai_usage_logs, ai_pricing)
-- Tables and RLS policies for centralized AI configuration and usage tracking

-- 1. ai_provider_settings (one row per provider: openai, gemini, anthropic)
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('openai', 'gemini', 'anthropic')),
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT, -- null = not configured. Key stays master-only and service-role accessible
  base_url TEXT NOT NULL,
  default_model TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_settings_provider ON public.ai_provider_settings(provider);

ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_select_ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "master_select_ai_provider_settings" ON public.ai_provider_settings
  FOR SELECT TO authenticated
  USING (public.is_master());

DROP POLICY IF EXISTS "master_insert_ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "master_insert_ai_provider_settings" ON public.ai_provider_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "master_update_ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "master_update_ai_provider_settings" ON public.ai_provider_settings
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "master_delete_ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "master_delete_ai_provider_settings" ON public.ai_provider_settings
  FOR DELETE TO authenticated
  USING (public.is_master());

-- Seed initial providers
INSERT INTO public.ai_provider_settings (provider, display_name, base_url, default_model, enabled)
VALUES
  ('openai', 'ChatGPT / OpenAI', 'https://api.openai.com/v1', 'gpt-4o-mini', false),
  ('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta', 'gemini-1.5-flash', false),
  ('anthropic', 'Claude / Anthropic', 'https://api.anthropic.com/v1', 'claude-3-5-haiku-20241022', false)
ON CONFLICT (provider) DO NOTHING;

-- 2. ai_config (single row, id default)
CREATE TABLE IF NOT EXISTS public.ai_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  features_enabled JSONB NOT NULL DEFAULT '{
    "resumo_prontuario": {"common": false, "pro": false},
    "gerar_treino": {"common": false, "pro": false},
    "assistente_estudos": {"common": false, "pro": false},
    "analise_financeira": {"common": false, "pro": false}
  }'::jsonb,
  quota_pro_daily INT NOT NULL DEFAULT 50,
  quota_pro_monthly INT NOT NULL DEFAULT 1000,
  quota_common_daily INT NOT NULL DEFAULT 5,
  quota_common_monthly INT NOT NULL DEFAULT 50,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_ai_config" ON public.ai_config;
CREATE POLICY "authenticated_select_ai_config" ON public.ai_config
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "master_insert_ai_config" ON public.ai_config;
CREATE POLICY "master_insert_ai_config" ON public.ai_config
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "master_update_ai_config" ON public.ai_config;
CREATE POLICY "master_update_ai_config" ON public.ai_config
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "master_delete_ai_config" ON public.ai_config;
CREATE POLICY "master_delete_ai_config" ON public.ai_config
  FOR DELETE TO authenticated
  USING (public.is_master());

-- Seed single row if not exists
INSERT INTO public.ai_config (id, ai_enabled, quota_pro_daily, quota_pro_monthly, quota_common_daily, quota_common_monthly)
VALUES ('default', false, 50, 1000, 5, 50)
ON CONFLICT (id) DO NOTHING;

-- 3. ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT,
  feature TEXT NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  cost_usd NUMERIC DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider ON public.ai_usage_logs(provider);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Master sees all logs, regular user sees only their own
DROP POLICY IF EXISTS "select_ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "select_ai_usage_logs" ON public.ai_usage_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_master());

-- Allow authenticated/service role to insert usage logs (proxy logs requests)
DROP POLICY IF EXISTS "insert_ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "insert_ai_usage_logs" ON public.ai_usage_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_master());

-- Master can delete logs if needed for maintenance
DROP POLICY IF EXISTS "master_delete_ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "master_delete_ai_usage_logs" ON public.ai_usage_logs
  FOR DELETE TO authenticated
  USING (public.is_master());

-- 4. ai_pricing (for token cost estimation)
CREATE TABLE IF NOT EXISTS public.ai_pricing (
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_usd_per_1k NUMERIC NOT NULL DEFAULT 0,
  output_usd_per_1k NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, model)
);

ALTER TABLE public.ai_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_select_ai_pricing" ON public.ai_pricing;
CREATE POLICY "master_select_ai_pricing" ON public.ai_pricing
  FOR SELECT TO authenticated
  USING (public.is_master());

DROP POLICY IF EXISTS "master_insert_ai_pricing" ON public.ai_pricing;
CREATE POLICY "master_insert_ai_pricing" ON public.ai_pricing
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "master_update_ai_pricing" ON public.ai_pricing;
CREATE POLICY "master_update_ai_pricing" ON public.ai_pricing
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "master_delete_ai_pricing" ON public.ai_pricing;
CREATE POLICY "master_delete_ai_pricing" ON public.ai_pricing
  FOR DELETE TO authenticated
  USING (public.is_master());

-- Seed representative current pricing per 1k tokens (prices in USD per 1,000 tokens)
-- OpenAI: gpt-4o-mini ($0.15/1M in = $0.00015/1k, $0.60/1M out = $0.0006/1k), gpt-4o ($2.50/1M in = $0.0025/1k, $10/1M out = $0.01/1k)
-- Gemini: 1.5-flash ($0.075/1M in = $0.000075/1k, $0.30/1M out = $0.0003/1k), 1.5-pro ($1.25/1M in = $0.00125/1k, $5/1M out = $0.005/1k)
-- Claude: 3-5-haiku ($0.80/1M in = $0.0008/1k, $4/1M out = $0.004/1k), 3-5-sonnet ($3/1M in = $0.003/1k, $15/1M out = $0.015/1k)
INSERT INTO public.ai_pricing (provider, model, input_usd_per_1k, output_usd_per_1k)
VALUES
  ('openai', 'gpt-4o-mini', 0.00015, 0.0006),
  ('openai', 'gpt-4o', 0.0025, 0.01),
  ('gemini', 'gemini-1.5-flash', 0.000075, 0.0003),
  ('gemini', 'gemini-1.5-pro', 0.00125, 0.005),
  ('anthropic', 'claude-3-5-haiku-20241022', 0.0008, 0.004),
  ('anthropic', 'claude-3-5-sonnet-20241022', 0.003, 0.015)
ON CONFLICT (provider, model) DO UPDATE
SET input_usd_per_1k = EXCLUDED.input_usd_per_1k,
    output_usd_per_1k = EXCLUDED.output_usd_per_1k;
