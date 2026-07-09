import { useState } from 'react'
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
import { Plus } from 'lucide-react'

interface NotebooksTabProps {
  onOpenNotebook: (notebookId: string) => void
}

export function NotebooksTab({ onOpenNotebook }: NotebooksTabProps) {
  const { notebooks, notes, deleteNotebook } = useStudiesStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
            noteCount={notes.filter((n) => n.notebookId === nb.id).length}
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
        <div className="text-center p-12 text-muted-foreground bg-card/50 rounded-3xl border border-dashed">
          Nenhum caderno criado ainda.
        </div>
      )}

      <NotebookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingNotebook={editingNotebook}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">Excluir Caderno?</AlertDialogTitle>
            <AlertDialogDescription>
              As notas dentro deste caderno não serão removidas, mas ficarão sem caderno associado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 font-bold"
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
