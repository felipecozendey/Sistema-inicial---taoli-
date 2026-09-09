import { useState, useMemo } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { NoteListItem } from '@/components/studies/note-list-item'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Tag, FileText, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotesTabProps {
  filterNotebookId: string | null
  onClearFilter: () => void
  onOpenNote: (noteId: string) => void
  onNewNote: () => void
}

const PAGE_SIZE = 20

export function NotesTab({
  filterNotebookId,
  onClearFilter,
  onOpenNote,
  onNewNote,
}: NotesTabProps) {
  const { notes, notebooks } = useStudiesStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedNotebookFilter, setSelectedNotebookFilter] = useState<string | null>(
    filterNotebookId,
  )
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Sync prop changes
  const activeNotebookId = filterNotebookId || selectedNotebookFilter

  // Extract all existing unique tags from notes
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    for (const note of notes) {
      if (note.tags && Array.isArray(note.tags)) {
        for (const tag of note.tags) {
          if (tag.trim()) tagsSet.add(tag.trim())
        }
      }
    }
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b))
  }, [notes])

  // Filter notes client-side
  const filteredNotes = useMemo(() => {
    let result = notes

    // Filter by notebook
    if (activeNotebookId) {
      result = result.filter((n) => n.notebookId === activeNotebookId)
    }

    // Filter by tag
    if (selectedTag) {
      result = result.filter((n) => n.tags && n.tags.includes(selectedTag))
    }

    // Search query in title + content
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q)),
      )
    }

    // Sort by last edited descending
    return [...result].sort((a, b) => (b.lastEdited || '').localeCompare(a.lastEdited || ''))
  }, [notes, activeNotebookId, selectedTag, searchQuery])

  const paginatedNotes = useMemo(() => {
    return filteredNotes.slice(0, visibleCount)
  }, [filteredNotes, visibleCount])

  const filterNotebook = activeNotebookId
    ? notebooks.find((nb) => nb.id === activeNotebookId)
    : null

  const handleClearAllFilters = () => {
    onClearFilter()
    setSelectedNotebookFilter(null)
    setSelectedTag(null)
    setSearchQuery('')
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            placeholder="Buscar por título, conteúdo ou tag..."
            className="pl-10 rounded-2xl font-semibold bg-card"
          />
        </div>

        <GameButton variant="primary" size="md" className="gap-2 shrink-0" onClick={onNewNote}>
          <Plus className="w-5 h-5" strokeWidth={2.5} /> Nova Nota
        </GameButton>
      </div>

      {/* Filter by Notebooks and Tags */}
      <div className="space-y-2">
        {/* Notebooks selector if not already filtering via page prop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => {
              setSelectedNotebookFilter(null)
              if (filterNotebookId) onClearFilter()
            }}
            className={cn(
              'px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border',
              !activeNotebookId
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted',
            )}
          >
            Todos os Cadernos ({notes.length})
          </button>
          {notebooks.map((nb) => {
            const count = notes.filter((n) => n.notebookId === nb.id).length
            const isSelected = activeNotebookId === nb.id
            return (
              <button
                key={nb.id}
                onClick={() => {
                  setSelectedNotebookFilter(isSelected ? null : nb.id)
                  if (isSelected && filterNotebookId) onClearFilter()
                }}
                className={cn(
                  'px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border flex items-center gap-1',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted',
                )}
              >
                <span>{nb.emoji}</span>
                <span>{nb.title}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-muted-foreground font-bold flex items-center gap-1 px-1">
              <Tag className="w-3.5 h-3.5" /> Tags:
            </span>
            {allTags.map((t) => {
              const isSelected = selectedTag === t
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTag(isSelected ? null : t)}
                  className={cn(
                    'px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all border text-[11px]',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/70 text-foreground/80 border-transparent hover:bg-muted',
                  )}
                >
                  #{t}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Active Filter Indicators */}
      {(filterNotebook || selectedTag || searchQuery.trim()) && (
        <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-2xl border text-xs font-semibold">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">Filtros ativos:</span>
            {filterNotebook && (
              <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold">
                {filterNotebook.emoji} {filterNotebook.title}
              </span>
            )}
            {selectedTag && (
              <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold">
                #{selectedTag}
              </span>
            )}
            {searchQuery.trim() && (
              <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold">
                "{searchQuery.trim()}"
              </span>
            )}
            <span className="text-muted-foreground font-normal">
              ({filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'})
            </span>
          </div>
          <button
            onClick={handleClearAllFilters}
            className="text-primary font-bold hover:underline shrink-0"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-2">
        {paginatedNotes.length > 0 ? (
          <>
            {paginatedNotes.map((note) => (
              <NoteListItem key={note.id} note={note} onClick={() => onOpenNote(note.id)} />
            ))}

            {/* Load More Button */}
            {filteredNotes.length > visibleCount && (
              <div className="pt-2 text-center">
                <GameButton
                  variant="secondary"
                  size="md"
                  className="gap-2"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  <ChevronDown className="w-4 h-4" /> Carregar Mais (
                  {filteredNotes.length - visibleCount} restantes)
                </GameButton>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-12 text-muted-foreground bg-card/50 rounded-3xl border border-dashed flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-3">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-base font-extrabold text-foreground">Nenhuma nota encontrada</h4>
            <p className="text-sm font-semibold max-w-sm mt-1">
              {notes.length === 0
                ? 'Comece criando sua primeira anotação ou resumo de estudo.'
                : 'Nenhum resultado corresponde aos filtros selecionados.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
