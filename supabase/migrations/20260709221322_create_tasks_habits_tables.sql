CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  energy_level INTEGER NOT NULL DEFAULT 2,
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_time INTEGER NOT NULL DEFAULT 30,
  tag_id TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  week_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  weekly_goal INTEGER NOT NULL DEFAULT 0,
  target_completions INTEGER,
  tag_id TEXT,
  completions JSONB NOT NULL DEFAULT '[]'::jsonb,
  escudos INTEGER NOT NULL DEFAULT 2,
  frozen_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notebook_id UUID,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#1CB0F6',
  emoji TEXT NOT NULL DEFAULT '📓',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "tasks_select" ON tasks;
  CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "tasks_insert" ON tasks;
  CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "tasks_update" ON tasks;
  CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "tasks_delete" ON tasks;
  CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "habits_select" ON habits;
  CREATE POLICY "habits_select" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "habits_insert" ON habits;
  CREATE POLICY "habits_insert" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "habits_update" ON habits;
  CREATE POLICY "habits_update" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "habits_delete" ON habits;
  CREATE POLICY "habits_delete" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "notes_select" ON notes;
  CREATE POLICY "notes_select" ON notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "notes_insert" ON notes;
  CREATE POLICY "notes_insert" ON notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "notes_update" ON notes;
  CREATE POLICY "notes_update" ON notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "notes_delete" ON notes;
  CREATE POLICY "notes_delete" ON notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "notebooks_select" ON notebooks;
  CREATE POLICY "notebooks_select" ON notebooks FOR SELECT TO authenticated USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "notebooks_insert" ON notebooks;
  CREATE POLICY "notebooks_insert" ON notebooks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "notebooks_update" ON notebooks;
  CREATE POLICY "notebooks_update" ON notebooks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "notebooks_delete" ON notebooks;
  CREATE POLICY "notebooks_delete" ON notebooks FOR DELETE TO authenticated USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "decks_select" ON decks;
  CREATE POLICY "decks_select" ON decks FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
  DROP POLICY IF EXISTS "decks_insert" ON decks;
  CREATE POLICY "decks_insert" ON decks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "decks_update" ON decks;
  CREATE POLICY "decks_update" ON decks FOR UPDATE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "decks_delete" ON decks;
  CREATE POLICY "decks_delete" ON decks FOR DELETE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

  DROP POLICY IF EXISTS "flashcards_select" ON flashcards;
  CREATE POLICY "flashcards_select" ON flashcards FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
  DROP POLICY IF EXISTS "flashcards_insert" ON flashcards;
  CREATE POLICY "flashcards_insert" ON flashcards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "flashcards_update" ON flashcards;
  CREATE POLICY "flashcards_update" ON flashcards FOR UPDATE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "flashcards_delete" ON flashcards;
  CREATE POLICY "flashcards_delete" ON flashcards FOR DELETE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
END $$;
