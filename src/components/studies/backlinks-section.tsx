import { useState, useEffect } from 'react'
import { getBacklinks, type BacklinkNote } from '@/services/note-references'
import { useStudiesStore } from '@/stores/useStudiesStore'

interface BacklinksSectionProps {
  noteId: string
  onNavigate: (noteId: string) => void
}

export function BacklinksSection({ noteId, onNavigate }: BacklinksSectionProps) {
  const [remoteBacklinks, setRemoteBacklinks] = useState<BacklinkNote[]>([])
  const { getBacklinks: getLocalBacklinks } = useStudiesStore()

  useEffect(() => {
    let cancelled = false
    getBacklinks(noteId).then((bl) => {
      if (!cancelled) setRemoteBacklinks(bl)
    })
    return () => {
      cancelled = true
    }
  }, [noteId])

  // Combine remote with client-calculated backlinks for real-time responsiveness without duplicate IDs
  const localBacklinks = getLocalBacklinks(noteId)
  const combinedMap = new Map<string, BacklinkNote>()

  for (const bl of remoteBacklinks) {
    combinedMap.set(bl.id, bl)
  }
  for (const lb of localBacklinks) {
    if (!combinedMap.has(lb.id)) {
      combinedMap.set(lb.id, {
        id: lb.id,
        title: lb.title || 'Sem título',
        emoji: lb.emoji || '📝',
      })
    }
  }

  const allBacklinks = Array.from(combinedMap.values())

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
        Referências (Backlinks)
      </h4>
      {allBacklinks.length > 0 ? (
        <div className="space-y-1.5">
          {allBacklinks.map((note) => (
            <button
              key={note.id}
              onClick={() => onNavigate(note.id)}
              className="flex items-center gap-2 w-full p-2.5 rounded-2xl bg-muted/50 hover:bg-muted transition-colors text-left border border-border/50 hover:border-primary/40"
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
