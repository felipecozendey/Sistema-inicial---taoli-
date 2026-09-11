-- Migração para Jardim 2.0: Fazendinha Pixel
-- Remove tabela legada de canteiros (garden_plants) e cria garden_decorations com RLS exclusiva

DROP TABLE IF EXISTS public.garden_plants CASCADE;

CREATE TABLE IF NOT EXISTS public.garden_decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  layer INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_garden_decorations_user_id ON public.garden_decorations(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_decorations_coords ON public.garden_decorations(user_id, x, y);

ALTER TABLE public.garden_decorations ENABLE ROW LEVEL SECURITY;

-- RLS: Apenas user_id = auth.uid() para SELECT/INSERT/UPDATE/DELETE (privacidade absoluta)
DROP POLICY IF EXISTS "garden_decorations_select" ON public.garden_decorations;
CREATE POLICY "garden_decorations_select" ON public.garden_decorations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_decorations_insert" ON public.garden_decorations;
CREATE POLICY "garden_decorations_insert" ON public.garden_decorations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_decorations_update" ON public.garden_decorations;
CREATE POLICY "garden_decorations_update" ON public.garden_decorations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "garden_decorations_delete" ON public.garden_decorations;
CREATE POLICY "garden_decorations_delete" ON public.garden_decorations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
