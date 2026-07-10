CREATE TABLE IF NOT EXISTS note_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_note_id, target_note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_references_source ON note_references(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_references_target ON note_references(target_note_id);

ALTER TABLE note_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "note_references_select" ON note_references;
CREATE POLICY "note_references_select" ON note_references
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM notes n WHERE n.id = note_references.source_note_id AND n.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "note_references_insert" ON note_references;
CREATE POLICY "note_references_insert" ON note_references
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM notes n WHERE n.id = note_references.source_note_id AND n.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "note_references_delete" ON note_references;
CREATE POLICY "note_references_delete" ON note_references
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM notes n WHERE n.id = note_references.source_note_id AND n.user_id = auth.uid())
  );
