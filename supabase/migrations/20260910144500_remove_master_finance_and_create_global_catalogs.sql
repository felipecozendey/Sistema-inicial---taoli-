-- Migração única: Remoção do vínculo de finanças com a masterização e criação de catálogos globais (global_foods e global_exercises)

-- 1. DROP das policies de leitura do Master em transações e investimentos dos usuários
DROP POLICY IF EXISTS "master_select_all_transactions" ON public.transactions;
DROP POLICY IF EXISTS "master_select_all_investments" ON public.investments;

-- Garantir que as policies do próprio usuário permaneçam intactas
-- (investments_select, investments_insert, investments_update, investments_delete)
-- (transactions_select, transactions_insert, transactions_update, transactions_delete)

-- 2. Tabela global_foods
CREATE TABLE IF NOT EXISTS public.global_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  base_unit TEXT NOT NULL DEFAULT '100g',
  calories NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  fibers_g NUMERIC NOT NULL DEFAULT 0,
  sodium_mg NUMERIC NOT NULL DEFAULT 0,
  allergens TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_foods_name ON public.global_foods(name);
CREATE INDEX IF NOT EXISTS idx_global_foods_category ON public.global_foods(category);
CREATE INDEX IF NOT EXISTS idx_global_foods_is_active ON public.global_foods(is_active);

-- Trigger de updated_at para global_foods
DROP TRIGGER IF EXISTS trg_global_foods_updated_at ON public.global_foods;
CREATE TRIGGER trg_global_foods_updated_at
  BEFORE UPDATE ON public.global_foods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS global_foods
ALTER TABLE public.global_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "global_foods_select" ON public.global_foods;
CREATE POLICY "global_foods_select" ON public.global_foods
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "global_foods_insert" ON public.global_foods;
CREATE POLICY "global_foods_insert" ON public.global_foods
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "global_foods_update" ON public.global_foods;
CREATE POLICY "global_foods_update" ON public.global_foods
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "global_foods_delete" ON public.global_foods;
CREATE POLICY "global_foods_delete" ON public.global_foods
  FOR DELETE TO authenticated
  USING (public.is_master());

-- 3. Tabela global_exercises
CREATE TABLE IF NOT EXISTS public.global_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  difficulty TEXT CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado')),
  instructions TEXT,
  video_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_exercises_name ON public.global_exercises(name);
CREATE INDEX IF NOT EXISTS idx_global_exercises_muscle_group ON public.global_exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_global_exercises_is_active ON public.global_exercises(is_active);

-- Trigger de updated_at para global_exercises
DROP TRIGGER IF EXISTS trg_global_exercises_updated_at ON public.global_exercises;
CREATE TRIGGER trg_global_exercises_updated_at
  BEFORE UPDATE ON public.global_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS global_exercises
ALTER TABLE public.global_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "global_exercises_select" ON public.global_exercises;
CREATE POLICY "global_exercises_select" ON public.global_exercises
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "global_exercises_insert" ON public.global_exercises;
CREATE POLICY "global_exercises_insert" ON public.global_exercises
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "global_exercises_update" ON public.global_exercises;
CREATE POLICY "global_exercises_update" ON public.global_exercises
  FOR UPDATE TO authenticated
  USING (public.is_master())
  WITH CHECK (public.is_master());

DROP POLICY IF EXISTS "global_exercises_delete" ON public.global_exercises;
CREATE POLICY "global_exercises_delete" ON public.global_exercises
  FOR DELETE TO authenticated
  USING (public.is_master());

-- Seed inicial de exemplo para TACO / IBGE e Exercícios Globais se vazios
INSERT INTO public.global_foods (name, category, base_unit, calories, carbs_g, protein_g, fat_g, fibers_g, sodium_mg, allergens, tags, is_active)
VALUES
  ('Arroz integral cozido', 'Cereais', '100g', 124, 25.8, 2.6, 1.0, 2.7, 1.0, NULL, ARRAY['taco', 'grãos'], true),
  ('Arroz polido cozido', 'Cereais', '100g', 128, 28.1, 2.5, 0.2, 1.6, 1.0, NULL, ARRAY['taco', 'grãos'], true),
  ('Feijão carioca cozido', 'Leguminosas', '100g', 76, 13.6, 4.8, 0.5, 8.5, 2.0, NULL, ARRAY['taco', 'leguminosas'], true),
  ('Peito de frango grelhado', 'Carnes e Derivados', '100g', 159, 0, 32.0, 2.5, 0, 50.0, NULL, ARRAY['taco', 'proteína'], true),
  ('Ovo de galinha cozido', 'Ovos e Derivados', '100g', 146, 0.6, 13.3, 9.5, 0, 146.0, 'Ovo', ARRAY['taco', 'proteína'], true),
  ('Banana prata crua', 'Frutas', '100g', 98, 26.0, 1.3, 0.1, 2.0, 0, NULL, ARRAY['taco', 'frutas'], true),
  ('Aveia em flocos crua', 'Cereais', '100g', 394, 66.6, 13.9, 8.5, 9.1, 5.0, 'Glúten', ARRAY['taco', 'fibras'], true),
  ('Azeite de oliva extra virgem', 'Óleos e Gorduras', '100g', 884, 0, 0, 100.0, 0, 0, NULL, ARRAY['taco', 'gordura-boa'], true)
ON CONFLICT DO NOTHING;

INSERT INTO public.global_exercises (name, muscle_group, equipment, difficulty, instructions, video_url, is_active)
VALUES
  ('Supino Reto com Barra', 'Peito', 'Barra e Banco Plano', 'Intermediário', 'Deite-se no banco, pegue a barra com largura um pouco maior que os ombros, desça a barra de forma controlada até o peito e empurre para cima.', '', true),
  ('Supino Inclinado com Halteres', 'Peito', 'Halteres e Banco Inclinado (30-45°)', 'Intermediário', 'Com o banco inclinado a 30-45 graus, empurre os halteres para cima e aproxime-os no topo sem bater.', '', true),
  ('Puxada Frontal na Polia', 'Costas', 'Polia Alta', 'Iniciante', 'Sente-se com as coxas fixas sob o suporte, puxe a barra em direção ao peitoral superior abrindo o peito e contraindo as dorsais.', '', true),
  ('Remada Curvada com Barra', 'Costas', 'Barra', 'Avançado', 'Incline o tronco para a frente mantendo a coluna alinhada, puxe a barra em direção ao umbigo mantendo os cotovelos próximos ao corpo.', '', true),
  ('Agachamento Livre com Barra', 'Pernas', 'Barra e Rack', 'Avançado', 'Posicione a barra nos trapézios, pés afastados na largura dos ombros, agache empurrando os quadris para trás até passar dos 90 graus.', '', true),
  ('Leg Press 45°', 'Pernas', 'Máquina Leg Press 45°', 'Iniciante', 'Posicione os pés no centro da plataforma, empurre com segurança e flexione os joelhos controlando o movimento sem travar na extensão.', '', true),
  ('Desenvolvimento com Halteres', 'Ombros', 'Halteres e Banco', 'Iniciante', 'Sentado em banco com encosto reto, eleve os halteres verticalmente acima da cabeça até quase estender os braços.', '', true),
  ('Elevação Lateral com Halteres', 'Ombros', 'Halteres', 'Iniciante', 'Em pé ou sentado, eleve os braços lateralmente com leve flexão nos cotovelos até a linha dos ombros.', '', true),
  ('Rosca Direta com Barra', 'Braços', 'Barra W ou Reta', 'Iniciante', 'Mantenha os cotovelos fixos ao lado do corpo e flexione os antebraços trazendo a barra em direção aos ombros.', '', true),
  ('Tríceps Corda na Polia', 'Braços', 'Polia Alta com Corda', 'Iniciante', 'Estenda os cotovelos para baixo abrindo as pontas da corda na contração máxima.', '', true),
  ('Prancha Abdominal', 'Core', 'Colchonete', 'Iniciante', 'Apoie antebraços e pontas dos pés no chão, mantendo abdômen e glúteos contraídos em linha reta.', '', true),
  ('Corrida Esteira', 'Cardio', 'Esteira Ergométrica', 'Iniciante', 'Aquecimento progressivo seguido de ritmo constante ou intervalado.', '', true)
ON CONFLICT DO NOTHING;
