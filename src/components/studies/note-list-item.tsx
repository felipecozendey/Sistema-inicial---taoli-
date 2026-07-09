import { Note, useStudiesStore } from '@/stores/useStudiesStore'

interface NoteListItemProps {
  note: Note
  onClick: () => void
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ontem'
  if (d < 7) return `há ${d} dias`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function NoteListItem({ note, onClick }: NoteListItemProps) {
  const { notebooks } = useStudiesStore()
  const notebook = notebooks.find((nb) => nb.id === note.notebookId)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border hover:shadow-md transition-all text-left"
    >
      <span className="text-2xl flex-shrink-0">{note.emoji}</span>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold truncate">{note.title}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          {notebook && (
            <span className="text-xs text-muted-foreground font-semibold">
              {notebook.emoji} {notebook.title}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            · {formatRelativeTime(note.lastEdited)}
          </span>
        </div>
      </div>
      {note.tags.length > 0 && (
        <div className="flex gap-1 flex-shrink-0">
          {note.tags.slice(0, 2).map((t, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs font-bold">
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
