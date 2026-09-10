-- Migration: 20260910160000_user_overrides_and_multi_source_foods.sql
-- Evolution of Masterization: user_feature_overrides and multi-source nutrition tables

-- 1. Multi-source nutrition tables: add source_table column to global_foods
ALTER TABLE public.global_foods
ADD COLUMN IF NOT EXISTS source_table TEXT NOT NULL DEFAULT 'TACO';

-- Create index on source_table for fast filtering and DISTINCT lookups
CREATE INDEX IF NOT EXISTS idx_global_foods_source_table ON public.global_foods(source_table);

-- Backfill existing foods if any have null/empty source_table
UPDATE public.global_foods
SET source_table = 'TACO'
WHERE source_table IS NULL OR source_table = '';

-- 2. User feature overrides table: user-level overrides of global feature flags
CREATE TABLE IF NOT EXISTS public.user_feature_overrides (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_feature_overrides_pkey PRIMARY KEY (user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_user_id ON public.user_feature_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_key ON public.user_feature_overrides(feature_key);

-- Enable RLS on user_feature_overrides
ALTER TABLE public.user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_feature_overrides
-- Authenticated users can read their OWN overrides, or Master can read all
DROP POLICY IF EXISTS "user_feature_overrides_select" ON public.user_feature_overrides;
CREATE POLICY "user_feature_overrides_select" ON public.user_feature_overrides
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_master());

-- Only Master can insert overrides
DROP POLICY IF EXISTS "user_feature_overrides_insert" ON public.user_feature_overrides;
CREATE POLICY "user_feature_overrides_insert" ON public.user_feature_overrides
  FOR INSERT TO authenticated
  WITH CHECK (is_master());

-- Only Master can update overrides
DROP POLICY IF EXISTS "user_feature_overrides_update" ON public.user_feature_overrides;
CREATE POLICY "user_feature_overrides_update" ON public.user_feature_overrides
  FOR UPDATE TO authenticated
  USING (is_master())
  WITH CHECK (is_master());

-- Only Master can delete overrides
DROP POLICY IF EXISTS "user_feature_overrides_delete" ON public.user_feature_overrides;
CREATE POLICY "user_feature_overrides_delete" ON public.user_feature_overrides
  FOR DELETE TO authenticated
  USING (is_master());

-- Helper function to set user feature override
CREATE OR REPLACE FUNCTION public.set_user_feature_override(
  p_user_id UUID,
  p_feature_key TEXT,
  p_enabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode alterar permissões de usuário';
  END IF;

  INSERT INTO public.user_feature_overrides (user_id, feature_key, enabled, updated_by, updated_at)
  VALUES (p_user_id, p_feature_key, p_enabled, auth.uid(), NOW())
  ON CONFLICT (user_id, feature_key)
  DO UPDATE SET
    enabled = EXCLUDED.enabled,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();
END;
$$;
