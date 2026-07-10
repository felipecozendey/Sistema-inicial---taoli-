import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { extractLinkTitles, extractNoteIds } from '@/lib/link-parser'
import { mockNotebooks, mockNotes, mockDecks, mockFlashcards } from '@/lib/studies-mock-data'
import { calculateSRS } from '@/lib/srs'
import { supabase } from '@/lib/supabase/client'
import type { Deck, Flashcard, ReviewFeedback } from '@/types/flashcard'

export type Notebook = {
  id: string
  title: string
  emoji: string
  coverColor: string
}

export type Note = {
  id: string
  notebookId: string
  title: string
  content: string
  emoji: string
  tags: string[]
  linkedNoteIds: string[]
  lastEdited: string
}

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 11)

const nowIso = () => new Date().toISOString()

function computeLinkedIds(content: string, notes: Note[], selfId: string): string[] {
  const ids = extractNoteIds(content).filter((id) => id !== selfId)
  const titleIds = extractLinkTitles(content)
    .map((t) => notes.find((n) => n.title === t && n.id !== selfId)?.id)
    .filter((id): id is string => !!id)
  return [...new Set([...ids, ...titleIds])]
}

async function syncRefsInternal(noteId: string, content: string) {
  const ids = extractNoteIds(content)
  const refsTable = (supabase as any).from('note_references')
  try {
    await refsTable.delete().eq('source_note_id', noteId)
    if (ids.length > 0) {
      await refsTable.insert(
        ids.map((targetId) => ({
          source_note_id: noteId,
          target_note_id: targetId,
        })),
      )
    }
  } catch {
    /* intentionally ignored */
  }
}

interface StudiesState {
  notebooks: Notebook[]
  notes: Note[]
  decks: Deck[]
  flashcards: Flashcard[]
  addNotebook: (data: { title: string; emoji: string; coverColor: string }) => void
  updateNotebook: (
    id: string,
    updates: Partial<Pick<Notebook, 'title' | 'emoji' | 'coverColor'>>,
  ) => void
  deleteNotebook: (id: string) => void
  addNote: (data: {
    notebookId: string
    title: string
    content: string
    emoji: string
    tags: string[]
  }) => string
  updateNote: (
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'emoji' | 'tags' | 'notebookId'>>,
  ) => void
  deleteNote: (id: string) => void
  getNoteByTitle: (title: string) => Note | undefined
  getBacklinks: (noteId: string) => Note[]
  addDeck: (data: { title: string; emoji: string; color: string }) => Promise<void>
  updateDeck: (
    id: string,
    updates: Partial<Pick<Deck, 'title' | 'emoji' | 'color'>>,
  ) => Promise<void>
  deleteDeck: (id: string) => Promise<void>
  addFlashcard: (data: {
    deckId: string
    noteId?: string | null
    front: string
    back: string
  }) => Promise<void>
  updateFlashcard: (
    id: string,
    updates: Partial<Pick<Flashcard, 'front' | 'back' | 'noteId'>>,
  ) => Promise<void>
  deleteFlashcard: (id: string) => Promise<void>
  reviewCard: (cardId: string, feedback: ReviewFeedback) => Promise<void>
  syncNoteReferences: (noteId: string, content: string) => Promise<void>
  loadStudiesData: () => Promise<void>
}

export const useStudiesStore = create<StudiesState>()(
  persist(
    (set, get) => ({
      notebooks: mockNotebooks,
      notes: mockNotes,
      decks: mockDecks,
      flashcards: mockFlashcards,

      addNotebook: (data) =>
        set((s) => ({ notebooks: [...s.notebooks, { ...data, id: genId() }] })),

      updateNotebook: (id, updates) =>
        set((s) => ({
          notebooks: s.notebooks.map((nb) => (nb.id === id ? { ...nb, ...updates } : nb)),
        })),

      deleteNotebook: (id) =>
        set((s) => ({
          notebooks: s.notebooks.filter((nb) => nb.id !== id),
          notes: s.notes.map((n) => (n.notebookId === id ? { ...n, notebookId: '' } : n)),
        })),

      addNote: (data) => {
        const id = genId()
        const note: Note = { ...data, id, linkedNoteIds: [], lastEdited: nowIso() }
        set((s) => {
          const allNotes = [...s.notes, note]
          const withLinks = allNotes.map((n) => ({
            ...n,
            linkedNoteIds: computeLinkedIds(n.content, allNotes, n.id),
          }))
          return { notes: withLinks }
        })
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user)
            return supabase
              .from('notes')
              .insert({
                id,
                user_id: user.id,
                notebook_id: data.notebookId || null,
                title: data.title,
                content: data.content,
                emoji: data.emoji,
                tag_ids: data.tags,
              })
              .then(() => syncRefsInternal(id, data.content))
        })
        return id
      },

      updateNote: (id, updates) => {
        set((s) => {
          const updatedNotes = s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, lastEdited: nowIso() } : n,
          )
          const withLinks = updatedNotes.map((n) => ({
            ...n,
            linkedNoteIds: computeLinkedIds(n.content, updatedNotes, n.id),
          }))
          return { notes: withLinks }
        })
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return
          const updateData: {
            updated_at?: string
            title?: string
            content?: string
            emoji?: string
            notebook_id?: string | null
            tag_ids?: string[]
          } = { updated_at: nowIso() }
          if (updates.title !== undefined) updateData.title = updates.title
          if (updates.content !== undefined) updateData.content = updates.content
          if (updates.emoji !== undefined) updateData.emoji = updates.emoji
          if (updates.notebookId !== undefined) updateData.notebook_id = updates.notebookId || null
          if (updates.tags !== undefined) updateData.tag_ids = updates.tags
          supabase
            .from('notes')
            .update(updateData)
            .eq('id', id)
            .then(() => {
              if (updates.content !== undefined) syncRefsInternal(id, updates.content)
            })
        })
      },

      deleteNote: (id) => {
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          flashcards: s.flashcards.map((fc) => (fc.noteId === id ? { ...fc, noteId: null } : fc)),
        }))
        supabase
          .from('notes')
          .delete()
          .eq('id', id)
          .then(() => {})
      },

      getNoteByTitle: (title) => get().notes.find((n) => n.title === title),
      getBacklinks: (noteId) => {
        const note = get().notes.find((n) => n.id === noteId)
        if (!note) return []
        return get().notes.filter((n) => n.id !== noteId && n.linkedNoteIds.includes(noteId))
      },

      addDeck: async (data) => {
        const id = genId()
        const deck: Deck = { id, ...data }
        set((s) => ({ decks: [...s.decks, deck] }))
        try {
          await supabase
            .from('decks')
            .insert({ id, title: data.title, emoji: data.emoji, color: data.color })
        } catch {
          /* intentionally ignored */
        }
      },

      updateDeck: async (id, updates) => {
        set((s) => ({ decks: s.decks.map((d) => (d.id === id ? { ...d, ...updates } : d)) }))
        try {
          await supabase.from('decks').update(updates).eq('id', id)
        } catch {
          /* intentionally ignored */
        }
      },

      deleteDeck: async (id) => {
        set((s) => ({
          decks: s.decks.filter((d) => d.id !== id),
          flashcards: s.flashcards.filter((fc) => fc.deckId !== id),
        }))
        try {
          await supabase.from('decks').delete().eq('id', id)
        } catch {
          /* intentionally ignored */
        }
      },

      addFlashcard: async (data) => {
        const id = genId()
        const card: Flashcard = {
          id,
          deckId: data.deckId,
          noteId: data.noteId ?? null,
          front: data.front,
          back: data.back,
          nextReviewDate: nowIso(),
          interval: 0,
          easeFactor: 2.5,
        }
        set((s) => ({ flashcards: [...s.flashcards, card] }))
        try {
          await supabase.from('flashcards').insert({
            id,
            deck_id: data.deckId,
            note_id: data.noteId,
            front: data.front,
            back: data.back,
            next_review_date: card.nextReviewDate,
            interval: 0,
            ease_factor: 2.5,
          })
        } catch {
          /* intentionally ignored */
        }
      },

      updateFlashcard: async (id, updates) => {
        set((s) => ({
          flashcards: s.flashcards.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc)),
        }))
        try {
          await supabase
            .from('flashcards')
            .update({ front: updates.front, back: updates.back, note_id: updates.noteId })
            .eq('id', id)
        } catch {
          /* intentionally ignored */
        }
      },

      deleteFlashcard: async (id) => {
        set((s) => ({ flashcards: s.flashcards.filter((fc) => fc.id !== id) }))
        try {
          await supabase.from('flashcards').delete().eq('id', id)
        } catch {
          /* intentionally ignored */
        }
      },

      loadStudiesData: async () => {
        try {
          const [
            { data: notebooksData },
            { data: notesData },
            { data: decksData },
            { data: cardsData },
          ] = await Promise.all([
            supabase.from('notebooks').select('*').order('created_at', { ascending: true }),
            supabase.from('notes').select('*').order('updated_at', { ascending: false }),
            supabase.from('decks').select('*').order('created_at', { ascending: true }),
            supabase.from('flashcards').select('*').order('created_at', { ascending: true }),
          ])
          if (notebooksData && notebooksData.length > 0) {
            set({
              notebooks: notebooksData.map((nb) => ({
                id: nb.id,
                title: nb.name,
                emoji: nb.emoji,
                coverColor: nb.color,
              })),
            })
          }
          if (notesData && notesData.length > 0) {
            const mapped: Note[] = notesData.map((n) => ({
              id: n.id,
              notebookId: n.notebook_id || '',
              title: n.title,
              content: n.content,
              emoji: n.emoji,
              tags: n.tag_ids || [],
              linkedNoteIds: [],
              lastEdited: n.updated_at,
            }))
            set({
              notes: mapped.map((n) => ({
                ...n,
                linkedNoteIds: computeLinkedIds(n.content, mapped, n.id),
              })),
            })
          }
          if (decksData && decksData.length > 0) {
            set({
              decks: decksData.map((d) => ({
                id: d.id,
                title: d.title,
                emoji: d.emoji,
                color: d.color,
              })),
            })
          }
          if (cardsData && cardsData.length > 0) {
            set({
              flashcards: cardsData.map((c) => ({
                id: c.id,
                deckId: c.deck_id,
                noteId: c.note_id,
                front: c.front,
                back: c.back,
                nextReviewDate: c.next_review_date,
                interval: c.interval,
                easeFactor: c.ease_factor,
              })),
            })
          }
        } catch {
          /* intentionally ignored */
        }
      },

      reviewCard: async (cardId, feedback) => {
        let updated: Flashcard | undefined
        set((s) => ({
          flashcards: s.flashcards.map((fc) => {
            if (fc.id !== cardId) return fc
            const { interval, easeFactor, nextReviewDate } = calculateSRS(fc, feedback)
            updated = { ...fc, interval, easeFactor, nextReviewDate }
            return updated
          }),
        }))
        if (updated) {
          try {
            await supabase
              .from('flashcards')
              .update({
                interval: updated.interval,
                ease_factor: updated.easeFactor,
                next_review_date: updated.nextReviewDate,
              })
              .eq('id', cardId)
          } catch {
            /* intentionally ignored */
          }
        }
      },

      syncNoteReferences: async (noteId, content) => {
        await syncRefsInternal(noteId, content)
      },
    }),
    { name: 'taoli-studies-storage' },
  ),
)
