import { useState, useMemo } from 'react'
import { useStudiesStore, Notebook } from '@/stores/useStudiesStore'
import { NotebookCard } from '@/components/studies/notebook-card'
import { NotebookDialog } from '@/components/studies/notebook-dialog'
import { GameButton } from '@/components/ui/game-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, BookOpen } from 'lucide-react'

interface NotebooksTabProps {
  onOpenNotebook: (notebookId: string) => void
}

export function NotebooksTab({ onOpenNotebook }: NotebooksTabProps) {
  const { notebooks, notes, deleteNotebook } = useStudiesStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Memoized note counts per notebook
  const notebookNoteCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const nb of notebooks) {
      map.set(nb.id, 0)
    }
    for (const n of notes) {
      if (n.notebookId) {
        map.set(n.notebookId, (map.get(n.notebookId) || 0) + 1)
      }
    }
    return map
  }, [notebooks, notes])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GameButton
          variant="primary"
          size="md"
          className="gap-2"
          onClick={() => {
            setEditingNotebook(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} /> Novo Caderno
        </GameButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {notebooks.map((nb) => (
          <NotebookCard
            key={nb.id}
            notebook={nb}
            noteCount={notebookNoteCounts.get(nb.id) || 0}
            onOpen={() => onOpenNotebook(nb.id)}
            onEdit={() => {
              setEditingNotebook(nb)
              setDialogOpen(true)
            }}
            onDelete={() => setDeleteId(nb.id)}
          />
        ))}
      </div>

      {notebooks.length === 0 && (
        <div className="text-center p-12 text-muted-foreground bg-card/50 rounded-3xl border border-dashed flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-3">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="text-base font-extrabold text-foreground">Nenhum caderno criado ainda</h4>
          <p className="text-sm font-semibold max-w-sm mt-1">
            Organize suas anotações criando seu primeiro caderno de estudos!
          </p>
        </div>
      )}

      <NotebookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingNotebook={editingNotebook}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-2 border-b-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">Excluir Caderno?</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              As notas dentro deste caderno não serão removidas, mas ficarão sem caderno associado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold border-2 border-b-4">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 font-bold border-2 border-b-4 border-[#FF4B4B]/80"
              onClick={() => {
                if (deleteId) deleteNotebook(deleteId)
                setDeleteId(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
