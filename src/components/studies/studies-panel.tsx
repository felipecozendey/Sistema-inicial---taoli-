import { useState, useEffect } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotebooksTab } from '@/components/studies/notebooks-tab'
import { NotesTab } from '@/components/studies/notes-tab'
import { DecksTab } from '@/components/studies/decks-tab'
import { StudyMode } from '@/components/studies/study-mode'
import { NoteEditor } from '@/components/studies/note-editor'
import { BookOpen, FileText, Sparkles } from 'lucide-react'

interface StudiesPanelProps {
  /** Se desejar sincronizar ou elevar o estado de edição da nota */
  editingNoteId?: string | null
  onEditingNoteIdChange?: (id: string | null) => void
}

export function StudiesPanel({
  editingNoteId: externalEditingNoteId,
  onEditingNoteIdChange,
}: StudiesPanelProps = {}) {
  const { notes, loadStudiesData } = useStudiesStore()
  const [internalEditingNoteId, setInternalEditingNoteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'notebooks' | 'notes' | 'revision'>('notebooks')
  const [filterNotebookId, setFilterNotebookId] = useState<string | null>(null)
  const [studyingDeckId, setStudyingDeckId] = useState<string | null>(null)

  const isControlled = externalEditingNoteId !== undefined
  const editingNoteId = isControlled ? externalEditingNoteId : internalEditingNoteId

  const setEditingNote = (id: string | null) => {
    if (onEditingNoteIdChange) {
      onEditingNoteIdChange(id)
    }
    if (!isControlled) {
      setInternalEditingNoteId(id)
    }
  }

  useEffect(() => {
    if (editingNoteId && editingNoteId !== 'new') {
      const exists = notes.some((n) => n.id === editingNoteId)
      if (!exists) setEditingNote(null)
    }
  }, [editingNoteId, notes])

  useEffect(() => {
    loadStudiesData()
  }, [loadStudiesData])

  const handleOpenNotebook = (notebookId: string) => {
    setFilterNotebookId(notebookId)
    setActiveTab('notes')
  }

  const handleNewNote = () => {
    setEditingNote('new')
  }

  const handleOpenNote = (noteId: string) => {
    setEditingNote(noteId)
  }

  return (
    <div className="w-full space-y-6">
      {/* Se houver uma nota sendo editada, renderizamos o NoteEditor mantendo a montagem do painel */}
      {editingNoteId !== null ? (
        <div className="max-w-3xl mx-auto">
          <NoteEditor
            noteId={editingNoteId === 'new' ? null : editingNoteId}
            onClose={() => setEditingNote(null)}
            onNavigateToNote={(id) => setEditingNote(id)}
            defaultNotebookId={filterNotebookId || undefined}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'notebooks' | 'notes' | 'revision')}
            className="w-full"
          >
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto h-12 p-1.5 rounded-2xl bg-muted/60 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
                <TabsTrigger
                  value="notebooks"
                  className="rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#1899D6] data-[state=active]:shadow-sm"
                >
                  <BookOpen className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  <span>Cadernos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#1899D6] data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  <span>Notas</span>
                </TabsTrigger>
                <TabsTrigger
                  value="revision"
                  className="rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#46A302] data-[state=active]:shadow-sm"
                >
                  <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  <span>Revisão</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notebooks" className="mt-6 focus-visible:outline-none">
              <NotebooksTab onOpenNotebook={handleOpenNotebook} />
            </TabsContent>

            <TabsContent value="notes" className="mt-6 focus-visible:outline-none">
              <NotesTab
                filterNotebookId={filterNotebookId}
                onClearFilter={() => setFilterNotebookId(null)}
                onOpenNote={handleOpenNote}
                onNewNote={handleNewNote}
              />
            </TabsContent>

            <TabsContent value="revision" className="mt-6 focus-visible:outline-none">
              {studyingDeckId ? (
                <StudyMode deckId={studyingDeckId} onExit={() => setStudyingDeckId(null)} />
              ) : (
                <DecksTab onStudyDeck={(id) => setStudyingDeckId(id)} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

export default StudiesPanel
