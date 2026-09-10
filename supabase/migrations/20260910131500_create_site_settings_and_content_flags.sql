-- Migration: create site_settings and content_flags for public landing and master content management

-- 1. Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at on site_settings
DROP TRIGGER IF EXISTS tr_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER tr_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Create content_flags table (dedicated to landing page & login display toggles)
CREATE TABLE IF NOT EXISTS public.content_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at on content_flags
DROP TRIGGER IF EXISTS tr_content_flags_updated_at ON public.content_flags;
CREATE TRIGGER tr_content_flags_updated_at
  BEFORE UPDATE ON public.content_flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for site_settings
-- Anyone (anon and authenticated) can read site settings
DROP POLICY IF EXISTS "site_settings_select_all" ON public.site_settings;
CREATE POLICY "site_settings_select_all" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only master can insert / update / delete site settings
DROP POLICY IF EXISTS "site_settings_master_insert" ON public.site_settings;
CREATE POLICY "site_settings_master_insert" ON public.site_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "site_settings_master_update" ON public.site_settings;
CREATE POLICY "site_settings_master_update" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "site_settings_master_delete" ON public.site_settings;
CREATE POLICY "site_settings_master_delete" ON public.site_settings
  FOR DELETE TO authenticated
  USING (public.is_master());

-- 5. RLS Policies for content_flags
-- Anyone (anon and authenticated) can read content flags
DROP POLICY IF EXISTS "content_flags_select_all" ON public.content_flags;
CREATE POLICY "content_flags_select_all" ON public.content_flags
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only master can insert / update / delete content flags
DROP POLICY IF EXISTS "content_flags_master_insert" ON public.content_flags;
CREATE POLICY "content_flags_master_insert" ON public.content_flags
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "content_flags_master_update" ON public.content_flags;
CREATE POLICY "content_flags_master_update" ON public.content_flags
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "content_flags_master_delete" ON public.content_flags;
CREATE POLICY "content_flags_master_delete" ON public.content_flags
  FOR DELETE TO authenticated
  USING (public.is_master());

-- 6. Helper function to set content flag by Master
CREATE OR REPLACE FUNCTION public.set_content_flag(p_key TEXT, p_enabled BOOLEAN)
RETURNS VOID AS $$
DECLARE
  caller_email TEXT;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode alterar flags de conteúdo.';
  END IF;

  SELECT email INTO caller_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.content_flags (key, enabled, updated_at)
  VALUES (p_key, p_enabled, NOW())
  ON CONFLICT (key) DO UPDATE
  SET enabled = EXCLUDED.enabled, updated_at = NOW();

  INSERT INTO public.admin_audit_logs (actor_id, actor_email, action, details)
  VALUES (
    auth.uid(),
    caller_email,
    'toggle_content_flag',
    jsonb_build_object('key', p_key, 'enabled', p_enabled)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Seed content_flags: hero, features_section, how_it_works, final_cta, footer, public_signup (all true)
INSERT INTO public.content_flags (key, enabled)
VALUES
  ('hero', true),
  ('features_section', true),
  ('how_it_works', true),
  ('final_cta', true),
  ('footer', true),
  ('public_signup', true)
ON CONFLICT (key) DO NOTHING;

-- 8. Seed initial site_settings
INSERT INTO public.site_settings (key, value)
VALUES
  ('app_name', '"VibeCoding Tarefas"'::jsonb),
  ('hero_title', '"Organize sua vida com o poder do VibeCoding"'::jsonb),
  ('hero_subtitle', '"Tarefas, hábitos, saúde física e mental, estudos e finanças pessoais em um ecossistema gamificado e ultra-rápido."'::jsonb),
  ('cta_primary_label', '"Entrar"'::jsonb),
  ('cta_secondary_label', '"Criar conta"'::jsonb),
  ('login_title', '"Bem-vindo de volta!"'::jsonb),
  ('login_subtitle', '"Acesse sua conta para continuar evoluindo suas metas."'::jsonb),
  ('footer_message', '"Desenvolvido com foco em alta performance e simplicidade."'::jsonb),
  ('features', jsonb_build_array(
    jsonb_build_object(
      'id', 'tasks',
      'title', 'Tarefas e Hábitos',
      'description', 'Gerencie afazeres diários com streaks gamificados, prioridades e escudo de hábitos.',
      'icon', 'CheckSquare',
      'color', '#58CC02'
    ),
    jsonb_build_object(
      'id', 'health',
      'title', 'Saúde e Treinos',
      'description', 'Acompanhe antropometria, nutrição, jejum intermitente, treinos e saúde mental.',
      'icon', 'HeartPulse',
      'color', '#FF4B4B'
    ),
    jsonb_build_object(
      'id', 'studies',
      'title', 'Estudos e Flashcards',
      'description', 'Cadernos inteligentes com repetição espaçada (SRS) e decks dinâmicos de aprendizado.',
      'icon', 'GraduationCap',
      'color', '#FFC800'
    ),
    jsonb_build_object(
      'id', 'finance',
      'title', 'Finanças Pessoais',
      'description', 'Transações, contas bancárias, metas de investimento e demonstrativos detalhados.',
      'icon', 'Wallet',
      'color', '#1CB0F6'
    ),
    jsonb_build_object(
      'id', 'analytics',
      'title', 'Relatórios e Métricas',
      'description', 'Visão holística de sua evolução pessoal e produtividade com gráficos interativos.',
      'icon', 'BarChart2',
      'color', '#CE82FF'
    )
  )),
  ('steps', jsonb_build_array(
    jsonb_build_object(
      'step', 1,
      'title', 'Planeje seu dia',
      'description', 'Cadastre tarefas e defina hábitos essenciais para manter sua consistência diária.'
    ),
    jsonb_build_object(
      'step', 2,
      'title', 'Monitore sua evolução',
      'description', 'Registre nutrição, treinos, estudos e finanças em uma interface veloz e intuitiva.'
    ),
    jsonb_build_object(
      'step', 3,
      'title', 'Alcance novos patamares',
      'description', 'Suba de nível com streaks contínuos e relatórios em tempo real sem atrito.'
    )
  ))
ON CONFLICT (key) DO NOTHING;
