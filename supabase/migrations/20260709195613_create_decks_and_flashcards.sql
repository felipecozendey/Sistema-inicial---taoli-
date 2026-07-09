CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📚',
  color TEXT NOT NULL DEFAULT '#1CB0F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  note_id UUID,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interval INTEGER NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_date);

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decks_select" ON decks;
CREATE POLICY "decks_select" ON decks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "decks_insert" ON decks;
CREATE POLICY "decks_insert" ON decks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "decks_update" ON decks;
CREATE POLICY "decks_update" ON decks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "decks_delete" ON decks;
CREATE POLICY "decks_delete" ON decks FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "flashcards_select" ON flashcards;
CREATE POLICY "flashcards_select" ON flashcards FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "flashcards_insert" ON flashcards;
CREATE POLICY "flashcards_insert" ON flashcards FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "flashcards_update" ON flashcards;
CREATE POLICY "flashcards_update" ON flashcards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "flashcards_delete" ON flashcards;
CREATE POLICY "flashcards_delete" ON flashcards FOR DELETE TO authenticated USING (true);
