import { useState, useEffect } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotebooksTab } from '@/components/studies/notebooks-tab'
import { NotesTab } from '@/components/studies/notes-tab'
import { RevisionPlaceholder } from '@/components/studies/revision-placeholder'
import { NoteEditor } from '@/components/studies/note-editor'
import { GraduationCap } from 'lucide-react'

export default function Studies() {
  const { notes } = useStudiesStore()
  const [activeTab, setActiveTab] = useState('notebooks')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [filterNotebookId, setFilterNotebookId] = useState<string | null>(null)

  useEffect(() => {
    if (editingNoteId && editingNoteId !== 'new') {
      const exists = notes.some((n) => n.id === editingNoteId)
      if (!exists) setEditingNoteId(null)
    }
  }, [editingNoteId, notes])

  const handleOpenNotebook = (notebookId: string) => {
    setFilterNotebookId(notebookId)
    setActiveTab('notes')
  }

  const handleNewNote = () => {
    setEditingNoteId('new')
  }

  const handleOpenNote = (noteId: string) => {
    setEditingNoteId(noteId)
  }

  if (editingNoteId !== null) {
    return (
      <div className="max-w-3xl mx-auto">
        <NoteEditor
          noteId={editingNoteId === 'new' ? null : editingNoteId}
          onClose={() => setEditingNoteId(null)}
          onNavigateToNote={(id) => setEditingNoteId(id)}
          defaultNotebookId={filterNotebookId || undefined}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Estudos</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto rounded-2xl p-1.5">
          <TabsTrigger value="notebooks" className="rounded-xl font-bold">
            Cadernos
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-xl font-bold">
            Notas
          </TabsTrigger>
          <TabsTrigger value="revision" className="rounded-xl font-bold">
            Revisão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notebooks" className="mt-6">
          <NotebooksTab onOpenNotebook={handleOpenNotebook} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab
            filterNotebookId={filterNotebookId}
            onClearFilter={() => setFilterNotebookId(null)}
            onOpenNote={handleOpenNote}
            onNewNote={handleNewNote}
          />
        </TabsContent>

        <TabsContent value="revision" className="mt-6">
          <RevisionPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  )
}
