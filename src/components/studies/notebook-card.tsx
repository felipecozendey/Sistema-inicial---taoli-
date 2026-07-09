import { Notebook } from '@/stores/useStudiesStore'
import { Pencil, Trash2 } from 'lucide-react'

interface NotebookCardProps {
  notebook: Notebook
  noteCount: number
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

export function NotebookCard({ notebook, noteCount, onOpen, onEdit, onDelete }: NotebookCardProps) {
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer rounded-3xl overflow-hidden border-2 border-b-4 border-border bg-card transition-all hover:shadow-lg active:translate-y-0.5 active:border-b-2 group"
    >
      <div
        className="h-28 flex items-center justify-center text-5xl relative"
        style={{ backgroundColor: notebook.coverColor }}
      >
        {notebook.emoji}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1.5 bg-white/80 dark:bg-black/40 rounded-full hover:bg-white dark:hover:bg-black/60 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 bg-white/80 dark:bg-black/40 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-base truncate">{notebook.title}</h3>
        <p className="text-sm text-muted-foreground font-semibold">
          {noteCount} {noteCount === 1 ? 'nota' : 'notas'}
        </p>
      </div>
    </div>
  )
}
