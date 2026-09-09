import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { extractLinkTitles, extractNoteIds } from '@/lib/link-parser'
import { calculateSRS } from '@/lib/srs'
import { supabase } from '@/lib/supabase/client'
import { cleanupOrphanReferences } from '@/services/note-references'
import { toast } from '@/hooks/use-toast'
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

export interface ReviewLog {
  id: string
  user_id: string
  flashcard_id: string
  feedback: ReviewFeedback
  reviewed_at: string
}

const genId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback to strict UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const nowIso = () => new Date().toISOString()

function computeLinkedIds(content: string, notes: Note[], selfId: string): string[] {
  const ids = extractNoteIds(content).filter((id) => id !== selfId)
  const titleIds = extractLinkTitles(content)
    .map((t) => notes.find((n) => n.title === t && n.id !== selfId)?.id)
    .filter((id): id is string => !!id)
  return [...new Set([...ids, ...titleIds])]
}

interface StudiesState {
  notebooks: Notebook[]
  notes: Note[]
  decks: Deck[]
  flashcards: Flashcard[]
  reviewLogs: ReviewLog[]
  loading: boolean

  addNotebook: (data: {
    title: string
    emoji: string
    coverColor: string
  }) => Promise<string | null>
  updateNotebook: (
    id: string,
    updates: Partial<Pick<Notebook, 'title' | 'emoji' | 'coverColor'>>,
  ) => Promise<void>
  deleteNotebook: (id: string) => Promise<void>

  addNote: (data: {
    notebookId: string
    title: string
    content: string
    emoji: string
    tags: string[]
  }) => Promise<string | null>
  updateNote: (
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'emoji' | 'tags' | 'notebookId'>>,
  ) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  getNoteByTitle: (title: string) => Note | undefined
  getBacklinks: (noteId: string) => Note[]

  addDeck: (data: { title: string; emoji: string; color: string }) => Promise<string | null>
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
  }) => Promise<string | null>
  updateFlashcard: (
    id: string,
    updates: Partial<Pick<Flashcard, 'front' | 'back' | 'noteId'>>,
  ) => Promise<void>
  deleteFlashcard: (id: string) => Promise<void>

  reviewCard: (cardId: string, feedback: ReviewFeedback) => Promise<void>
  loadStudiesData: () => Promise<void>
}

export const useStudiesStore = create<StudiesState>()(
  persist(
    (set, get) => ({
      notebooks: [],
      notes: [],
      decks: [],
      flashcards: [],
      reviewLogs: [],
      loading: false,

      addNotebook: async (data) => {
        const tempId = genId()
        const newNotebook: Notebook = { ...data, id: tempId }
        const prevNotebooks = get().notebooks

        // Optimistic update
        set({ notebooks: [...prevNotebooks, newNotebook] })

        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          // Rollback silently + toast.error
          set({ notebooks: prevNotebooks })
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para salvar o caderno.',
            variant: 'destructive',
          })
          return null
        }

        const { data: inserted, error } = await supabase
          .from('notebooks')
          .insert({
            id: tempId,
            user_id: user.id,
            name: data.title,
            emoji: data.emoji,
            color: data.coverColor,
          })
          .select('id')
          .single()

        if (error || !inserted) {
          set({ notebooks: prevNotebooks })
          toast({
            title: 'Erro ao criar caderno',
            description: error?.message || 'Falha ao salvar no banco de dados.',
            variant: 'destructive',
          })
          return null
        }

        const realId = inserted.id
        if (realId !== tempId) {
          set((s) => ({
            notebooks: s.notebooks.map((nb) => (nb.id === tempId ? { ...nb, id: realId } : nb)),
            notes: s.notes.map((n) => (n.notebookId === tempId ? { ...n, notebookId: realId } : n)),
          }))
        }
        toast({ title: 'Caderno criado com sucesso!' })
        return realId
      },

      updateNotebook: async (id, updates) => {
        const prevNotebooks = get().notebooks
        set((s) => ({
          notebooks: s.notebooks.map((nb) => (nb.id === id ? { ...nb, ...updates } : nb)),
        }))

        const dbUpdates: { name?: string; emoji?: string; color?: string } = {}
        if (updates.title !== undefined) dbUpdates.name = updates.title
        if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji
        if (updates.coverColor !== undefined) dbUpdates.color = updates.coverColor

        const { error } = await supabase.from('notebooks').update(dbUpdates).eq('id', id)
        if (error) {
          set({ notebooks: prevNotebooks })
          toast({
            title: 'Erro ao atualizar caderno',
            description: error.message,
            variant: 'destructive',
          })
        }
      },

      deleteNotebook: async (id) => {
        const prevNotebooks = get().notebooks
        const prevNotes = get().notes

        set((s) => ({
          notebooks: s.notebooks.filter((nb) => nb.id !== id),
          notes: s.notes.map((n) => (n.notebookId === id ? { ...n, notebookId: '' } : n)),
        }))

        const { error } = await supabase.from('notebooks').delete().eq('id', id)
        if (error) {
          set({ notebooks: prevNotebooks, notes: prevNotes })
          toast({
            title: 'Erro ao excluir caderno',
            description: error.message,
            variant: 'destructive',
          })
        }
      },

      addNote: async (data) => {
        const tempId = genId()
        const note: Note = { ...data, id: tempId, linkedNoteIds: [], lastEdited: nowIso() }
        const prevNotes = get().notes

        // Optimistic update
        set((s) => {
          const allNotes = [...s.notes, note]
          const withLinks = allNotes.map((n) => ({
            ...n,
            linkedNoteIds: computeLinkedIds(n.content, allNotes, n.id),
          }))
          return { notes: withLinks }
        })

        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          set({ notes: prevNotes })
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para salvar a nota.',
            variant: 'destructive',
          })
          return null
        }

        const { data: inserted, error } = await supabase
          .from('notes')
          .insert({
            id: tempId,
            user_id: user.id,
            notebook_id: data.notebookId || null,
            title: data.title,
            content: data.content,
            emoji: data.emoji,
            tag_ids: data.tags,
          })
          .select('id, updated_at')
          .single()

        if (error || !inserted) {
          set({ notes: prevNotes })
          toast({
            title: 'Erro ao criar nota',
            description: error?.message || 'Falha ao salvar no banco de dados.',
            variant: 'destructive',
          })
          return null
        }

        const realId = inserted.id
        if (realId !== tempId) {
          set((s) => {
            const mapped = s.notes.map((n) =>
              n.id === tempId
                ? { ...n, id: realId, lastEdited: inserted.updated_at || n.lastEdited }
                : n,
            )
            return {
              notes: mapped.map((n) => ({
                ...n,
                linkedNoteIds: computeLinkedIds(n.content, mapped, n.id),
              })),
            }
          })
        }
        toast({ title: 'Nota criada com sucesso!' })
        return realId
      },

      updateNote: async (id, updates) => {
        const prevNotes = get().notes
        set((s) => {
          const updatedNotes = s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, lastEdited: nowIso() } : n,
          )
          return {
            notes: updatedNotes.map((n) => ({
              ...n,
              linkedNoteIds: computeLinkedIds(n.content, updatedNotes, n.id),
            })),
          }
        })

        const updateData: {
          updated_at: string
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

        const { error } = await supabase.from('notes').update(updateData).eq('id', id)
        if (error) {
          set({ notes: prevNotes })
          toast({
            title: 'Erro ao atualizar nota',
            description: error.message,
            variant: 'destructive',
          })
        }
      },

      deleteNote: async (id) => {
        const prevNotes = get().notes
        const prevFlashcards = get().flashcards

        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
          flashcards: s.flashcards.map((fc) => (fc.noteId === id ? { ...fc, noteId: null } : fc)),
        }))

        // Clean up orphan references first
        cleanupOrphanReferences(id)

        const { error } = await supabase.from('notes').delete().eq('id', id)
        if (error) {
          set({ notes: prevNotes, flashcards: prevFlashcards })
          toast({
            title: 'Erro ao excluir nota',
            description: error.message,
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Nota excluída com sucesso.' })
        }
      },

      getNoteByTitle: (title) =>
        get().notes.find((n) => n.title.trim().toLowerCase() === title.trim().toLowerCase()),

      getBacklinks: (noteId) => {
        const note = get().notes.find((n) => n.id === noteId)
        if (!note) return []
        return get().notes.filter((n) => n.id !== noteId && n.linkedNoteIds.includes(noteId))
      },

      addDeck: async (data) => {
        const tempId = genId()
        const newDeck: Deck = { id: tempId, ...data }
        const prevDecks = get().decks

        set((s) => ({ decks: [...s.decks, newDeck] }))

        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          set({ decks: prevDecks })
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para salvar o baralho.',
            variant: 'destructive',
          })
          return null
        }

        const { data: inserted, error } = await supabase
          .from('decks')
          .insert({
            id: tempId,
            user_id: user.id,
            title: data.title,
            emoji: data.emoji,
            color: data.color,
          })
          .select('id')
          .single()

        if (error || !inserted) {
          set({ decks: prevDecks })
          toast({
            title: 'Erro ao criar baralho',
            description: error?.message || 'Falha ao salvar no banco de dados.',
            variant: 'destructive',
          })
          return null
        }

        const realId = inserted.id
        if (realId !== tempId) {
          set((s) => ({
            decks: s.decks.map((d) => (d.id === tempId ? { ...d, id: realId } : d)),
            flashcards: s.flashcards.map((f) =>
              f.deckId === tempId ? { ...f, deckId: realId } : f,
            ),
          }))
        }
        toast({ title: 'Baralho criado com sucesso!' })
        return realId
      },

      updateDeck: async (id, updates) => {
        const prevDecks = get().decks
        set((s) => ({ decks: s.decks.map((d) => (d.id === id ? { ...d, ...updates } : d)) }))

        const { error } = await supabase.from('decks').update(updates).eq('id', id)
        if (error) {
          set({ decks: prevDecks })
          toast({
            title: 'Erro ao atualizar baralho',
            description: error.message,
            variant: 'destructive',
          })
        }
      },

      deleteDeck: async (id) => {
        const prevDecks = get().decks
        const prevCards = get().flashcards

        set((s) => ({
          decks: s.decks.filter((d) => d.id !== id),
          flashcards: s.flashcards.filter((fc) => fc.deckId !== id),
        }))

        const { error } = await supabase.from('decks').delete().eq('id', id)
        if (error) {
          set({ decks: prevDecks, flashcards: prevCards })
          toast({
            title: 'Erro ao excluir baralho',
            description: error.message,
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Baralho excluído com sucesso.' })
        }
      },

      addFlashcard: async (data) => {
        const tempId = genId()
        const card: Flashcard = {
          id: tempId,
          deckId: data.deckId,
          noteId: data.noteId ?? null,
          front: data.front,
          back: data.back,
          nextReviewDate: nowIso(),
          interval: 0,
          easeFactor: 2.5,
        }
        const prevCards = get().flashcards
        set((s) => ({ flashcards: [...s.flashcards, card] }))

        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if (!user) {
          set({ flashcards: prevCards })
          toast({
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para salvar o flashcard.',
            variant: 'destructive',
          })
          return null
        }

        const { data: inserted, error } = await supabase
          .from('flashcards')
          .insert({
            id: tempId,
            user_id: user.id,
            deck_id: data.deckId,
            note_id: data.noteId || null,
            front: data.front,
            back: data.back,
            next_review_date: card.nextReviewDate,
            interval: 0,
            ease_factor: 2.5,
          })
          .select('id')
          .single()

        if (error || !inserted) {
          set({ flashcards: prevCards })
          toast({
            title: 'Erro ao criar flashcard',
            description: error?.message || 'Falha ao salvar no banco de dados.',
            variant: 'destructive',
          })
          return null
        }

        const realId = inserted.id
        if (realId !== tempId) {
          set((s) => ({
            flashcards: s.flashcards.map((f) => (f.id === tempId ? { ...f, id: realId } : f)),
          }))
        }
        toast({ title: 'Flashcard criado com sucesso!' })
        return realId
      },

      updateFlashcard: async (id, updates) => {
        const prevCards = get().flashcards
        set((s) => ({
          flashcards: s.flashcards.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc)),
        }))

        const { error } = await supabase
          .from('flashcards')
          .update({
            front: updates.front,
            back: updates.back,
            note_id: updates.noteId !== undefined ? updates.noteId : undefined,
          })
          .eq('id', id)

        if (error) {
          set({ flashcards: prevCards })
          toast({
            title: 'Erro ao atualizar flashcard',
            description: error.message,
            variant: 'destructive',
          })
        }
      },

      deleteFlashcard: async (id) => {
        const prevCards = get().flashcards
        set((s) => ({ flashcards: s.flashcards.filter((fc) => fc.id !== id) }))

        const { error } = await supabase.from('flashcards').delete().eq('id', id)
        if (error) {
          set({ flashcards: prevCards })
          toast({
            title: 'Erro ao excluir flashcard',
            description: error.message,
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Flashcard excluído.' })
        }
      },

      loadStudiesData: async () => {
        set({ loading: true })
        try {
          const [
            { data: notebooksData, error: nbErr },
            { data: notesData, error: notesErr },
            { data: decksData, error: decksErr },
            { data: cardsData, error: cardsErr },
            { data: logsData },
          ] = await Promise.all([
            supabase.from('notebooks').select('*').order('created_at', { ascending: true }),
            supabase.from('notes').select('*').order('updated_at', { ascending: false }),
            supabase.from('decks').select('*').order('created_at', { ascending: true }),
            supabase.from('flashcards').select('*').order('created_at', { ascending: true }),
            (supabase as any)
              .from('review_logs')
              .select('*')
              .order('reviewed_at', { ascending: false })
              .limit(500),
          ])

          if (nbErr || notesErr || decksErr || cardsErr) {
            const firstErr = nbErr || notesErr || decksErr || cardsErr
            toast({
              title: 'Erro ao carregar dados de estudos',
              description: firstErr?.message || 'Falha ao sincronizar com o servidor.',
              variant: 'destructive',
            })
          }

          // Always set state to what returned from database (even if empty!)
          const mappedNotebooks: Notebook[] = (notebooksData || []).map((nb) => ({
            id: nb.id,
            title: nb.name,
            emoji: nb.emoji,
            coverColor: nb.color,
          }))

          const rawNotes = notesData || []
          const mappedNotes: Note[] = rawNotes.map((n) => ({
            id: n.id,
            notebookId: n.notebook_id || '',
            title: n.title,
            content: n.content,
            emoji: n.emoji,
            tags: n.tag_ids || [],
            linkedNoteIds: [],
            lastEdited: n.updated_at,
          }))

          const withLinks = mappedNotes.map((n) => ({
            ...n,
            linkedNoteIds: computeLinkedIds(n.content, mappedNotes, n.id),
          }))

          const mappedDecks: Deck[] = (decksData || []).map((d) => ({
            id: d.id,
            title: d.title,
            emoji: d.emoji,
            color: d.color,
          }))

          const mappedCards: Flashcard[] = (cardsData || []).map((c) => ({
            id: c.id,
            deckId: c.deck_id,
            noteId: c.note_id,
            front: c.front,
            back: c.back,
            nextReviewDate: c.next_review_date,
            interval: c.interval,
            easeFactor: c.ease_factor,
          }))

          const mappedLogs: ReviewLog[] = (logsData || []).map((l: any) => ({
            id: l.id,
            user_id: l.user_id,
            flashcard_id: l.flashcard_id,
            feedback: l.feedback,
            reviewed_at: l.reviewed_at,
          }))

          set({
            notebooks: mappedNotebooks,
            notes: withLinks,
            decks: mappedDecks,
            flashcards: mappedCards,
            reviewLogs: mappedLogs,
            loading: false,
          })
        } catch (err: any) {
          toast({
            title: 'Erro inesperado',
            description: err?.message || 'Falha na conexão.',
            variant: 'destructive',
          })
          set({ loading: false })
        }
      },

      reviewCard: async (cardId, feedback) => {
        let updated: Flashcard | undefined
        const prevCards = get().flashcards

        // Optimistic SRS update
        set((s) => ({
          flashcards: s.flashcards.map((fc) => {
            if (fc.id !== cardId) return fc
            const { interval, easeFactor, nextReviewDate } = calculateSRS(fc, feedback)
            updated = { ...fc, interval, easeFactor, nextReviewDate }
            return updated
          }),
        }))

        if (updated) {
          const { error: cardError } = await supabase
            .from('flashcards')
            .update({
              interval: updated.interval,
              ease_factor: updated.easeFactor,
              next_review_date: updated.nextReviewDate,
            })
            .eq('id', cardId)

          if (cardError) {
            set({ flashcards: prevCards })
            toast({
              title: 'Erro ao atualizar revisão',
              description: cardError.message,
              variant: 'destructive',
            })
            return
          }

          // Record telemetry log in review_logs (optimistic, UI continues)
          const { data: userData } = await supabase.auth.getUser()
          const user = userData?.user
          if (user) {
            const tempLogId = genId()
            const now = nowIso()
            const newLog: ReviewLog = {
              id: tempLogId,
              user_id: user.id,
              flashcard_id: cardId,
              feedback,
              reviewed_at: now,
            }
            set((s) => ({ reviewLogs: [newLog, ...s.reviewLogs] }))

            ;(supabase as any)
              .from('review_logs')
              .insert({
                id: tempLogId,
                user_id: user.id,
                flashcard_id: cardId,
                feedback,
                reviewed_at: now,
              })
              .then(({ error: logErr }: any) => {
                if (logErr) {
                  console.warn('Falha silenciosa ao registrar review_log:', logErr.message)
                }
              })
          }
        }
      },
    }),
    {
      name: 'taoli-studies-storage-v2',
      // Only keep lightweight data if desired, or let it sync cleanly
      partialize: (state) => ({
        notebooks: state.notebooks,
        notes: state.notes,
        decks: state.decks,
        flashcards: state.flashcards,
      }),
    },
  ),
)
