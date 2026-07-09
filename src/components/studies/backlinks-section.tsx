import { useStudiesStore } from '@/stores/useStudiesStore'

interface BacklinksSectionProps {
  noteId: string
  onNavigate: (noteId: string) => void
}

export function BacklinksSection({ noteId, onNavigate }: BacklinksSectionProps) {
  const { getBacklinks } = useStudiesStore()
  const backlinks = getBacklinks(noteId)

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
        Referências (Backlinks)
      </h4>
      {backlinks.length > 0 ? (
        <div className="space-y-1.5">
          {backlinks.map((note) => (
            <button
              key={note.id}
              onClick={() => onNavigate(note.id)}
              className="flex items-center gap-2 w-full p-2.5 rounded-2xl bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <span className="text-base">{note.emoji}</span>
              <span className="flex-1 text-sm font-semibold truncate">{note.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-semibold">
          Nenhuma nota referencia esta nota ainda.
        </p>
      )}
    </div>
  )
}
