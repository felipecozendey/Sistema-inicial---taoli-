import { useStudiesStore } from '@/stores/useStudiesStore'
import { NoteListItem } from '@/components/studies/note-list-item'
import { GameButton } from '@/components/ui/game-button'
import { Plus } from 'lucide-react'

interface NotesTabProps {
  filterNotebookId: string | null
  onClearFilter: () => void
  onOpenNote: (noteId: string) => void
  onNewNote: () => void
}

export function NotesTab({
  filterNotebookId,
  onClearFilter,
  onOpenNote,
  onNewNote,
}: NotesTabProps) {
  const { notes, notebooks } = useStudiesStore()
  const filtered = filterNotebookId ? notes.filter((n) => n.notebookId === filterNotebookId) : notes
  const filterNotebook = filterNotebookId
    ? notebooks.find((nb) => nb.id === filterNotebookId)
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {filterNotebook && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">
              Filtrando: {filterNotebook.emoji} {filterNotebook.title}
            </span>
            <button
              onClick={onClearFilter}
              className="text-sm text-primary font-bold hover:underline transition-all"
            >
              Limpar
            </button>
          </div>
        )}
        <GameButton variant="primary" size="md" className="gap-2 ml-auto" onClick={onNewNote}>
          <Plus className="w-5 h-5" strokeWidth={2.5} /> Nova Nota
        </GameButton>
      </div>

      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered
            .slice()
            .sort((a, b) => b.lastEdited.localeCompare(a.lastEdited))
            .map((note) => (
              <NoteListItem key={note.id} note={note} onClick={() => onOpenNote(note.id)} />
            ))
        ) : (
          <div className="text-center p-12 text-muted-foreground bg-card/50 rounded-3xl border border-dashed">
            Nenhuma nota encontrada.
          </div>
        )}
      </div>
    </div>
  )
}
