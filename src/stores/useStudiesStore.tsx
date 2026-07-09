import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { extractLinkTitles } from '@/lib/link-parser'
import { mockNotebooks, mockNotes } from '@/lib/studies-mock-data'

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

interface StudiesState {
  notebooks: Notebook[]
  notes: Note[]
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
}

const StudiesContext = createContext<StudiesState | undefined>(undefined)
const genId = () => Math.random().toString(36).substring(2, 9)
const nowIso = () => new Date().toISOString()

export const StudiesStoreProvider = ({ children }: { children: ReactNode }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    const s = localStorage.getItem('vt_studies_notebooks')
    return s ? JSON.parse(s) : mockNotebooks
  })
  const [notes, setNotes] = useState<Note[]>(() => {
    const s = localStorage.getItem('vt_studies_notes')
    return s ? JSON.parse(s) : mockNotes
  })

  useEffect(() => {
    localStorage.setItem('vt_studies_notebooks', JSON.stringify(notebooks))
  }, [notebooks])
  useEffect(() => {
    localStorage.setItem('vt_studies_notes', JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    setNotes((prev) => {
      let changed = false
      const updated = prev.map((n) => {
        const titles = extractLinkTitles(n.content)
        const newLinked = titles
          .map((t) => prev.find((o) => o.title === t && o.id !== n.id)?.id)
          .filter((id): id is string => !!id)
        const oldStr = [...n.linkedNoteIds].sort().join('|')
        const newStr = [...newLinked].sort().join('|')
        if (oldStr !== newStr) {
          changed = true
          return { ...n, linkedNoteIds: newLinked }
        }
        return n
      })
      return changed ? updated : prev
    })
  }, [notes])

  const addNotebook = (data: { title: string; emoji: string; coverColor: string }) =>
    setNotebooks((p) => [...p, { ...data, id: genId() }])

  const updateNotebook = (
    id: string,
    updates: Partial<Pick<Notebook, 'title' | 'emoji' | 'coverColor'>>,
  ) => setNotebooks((p) => p.map((nb) => (nb.id === id ? { ...nb, ...updates } : nb)))

  const deleteNotebook = (id: string) => {
    setNotebooks((p) => p.filter((nb) => nb.id !== id))
    setNotes((p) => p.map((n) => (n.notebookId === id ? { ...n, notebookId: '' } : n)))
  }

  const addNote = (data: {
    notebookId: string
    title: string
    content: string
    emoji: string
    tags: string[]
  }): string => {
    const id = genId()
    setNotes((p) => [...p, { ...data, id, linkedNoteIds: [], lastEdited: nowIso() }])
    return id
  }

  const updateNote = (
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'emoji' | 'tags' | 'notebookId'>>,
  ) => setNotes((p) => p.map((n) => (n.id === id ? { ...n, ...updates, lastEdited: nowIso() } : n)))

  const deleteNote = (id: string) => setNotes((p) => p.filter((n) => n.id !== id))

  const getNoteByTitle = (title: string) => notes.find((n) => n.title === title)

  const getBacklinks = (noteId: string): Note[] => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return []
    return notes.filter((n) => n.id !== noteId && n.linkedNoteIds.includes(noteId))
  }

  const value: StudiesState = {
    notebooks,
    notes,
    addNotebook,
    updateNotebook,
    deleteNotebook,
    addNote,
    updateNote,
    deleteNote,
    getNoteByTitle,
    getBacklinks,
  }

  return <StudiesContext.Provider value={value}>{children}</StudiesContext.Provider>
}

export const useStudiesStore = () => {
  const ctx = useContext(StudiesContext)
  if (!ctx) throw new Error('useStudiesStore must be used within StudiesStoreProvider')
  return ctx
}
