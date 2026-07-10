import { supabase } from '@/lib/supabase/client'
import { extractNoteIds } from '@/lib/link-parser'

export interface BacklinkNote {
  id: string
  title: string
  emoji: string
}

export async function syncNoteReferences(noteId: string, content: string): Promise<void> {
  const targetIds = [...new Set(extractNoteIds(content))].filter((id) => id && id !== noteId)

  const { data: existing } = await supabase
    .from('note_references')
    .select('target_note_id')
    .eq('source_note_id', noteId)

  const existingIds = (existing || []).map((r) => r.target_note_id)

  const toDelete = existingIds.filter((id) => !targetIds.includes(id))
  if (toDelete.length > 0) {
    await supabase
      .from('note_references')
      .delete()
      .eq('source_note_id', noteId)
      .in('target_note_id', toDelete)
  }

  const toInsert = targetIds.filter((id) => !existingIds.includes(id))
  if (toInsert.length > 0) {
    const rows = toInsert.map((targetNoteId) => ({
      source_note_id: noteId,
      target_note_id: targetNoteId,
    }))
    await supabase.from('note_references').insert(rows)
  }
}

export async function getBacklinks(noteId: string): Promise<BacklinkNote[]> {
  const { data: refs, error: refError } = await supabase
    .from('note_references')
    .select('source_note_id')
    .eq('target_note_id', noteId)

  if (refError || !refs || refs.length === 0) return []

  const sourceIds = refs.map((r) => r.source_note_id)

  const { data: notes, error: noteError } = await supabase
    .from('notes')
    .select('id, title, emoji')
    .in('id', sourceIds)

  if (noteError || !notes) return []

  return notes.map((n) => ({ id: n.id, title: n.title || '', emoji: n.emoji || '📝' }))
}
