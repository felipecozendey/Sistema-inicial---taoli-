import { useState } from 'react'
import { useAppStore, Tag } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Pencil, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

export function TagManager() {
  const { tags, addTag, updateTag, deleteTag } = useAppStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => {
    setEditingTag(null)
    setName('')
    setColor(PRESET_COLORS[0])
    setDialogOpen(true)
  }

  const openEdit = (tag: Tag) => {
    setEditingTag(tag)
    setName(tag.name)
    setColor(tag.color)
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editingTag) updateTag(editingTag.id, { name, color })
    else addTag(name, color)
    setDialogOpen(false)
  }

  return (
    <section className="bg-card rounded-[2rem] p-6 md:p-8 shadow-sm border space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Tags</h3>
        <Button onClick={openCreate} size="sm" variant="outline" className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Nova Tag
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 bg-muted/50 rounded-full pl-3 pr-1 py-1 group"
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="text-sm font-medium">{tag.name}</span>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(tag)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteId(tag.id)}
                className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma tag criada ainda.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                placeholder="Ex: Projetos Pessoais"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform',
                      color === c && 'ring-2 ring-offset-2 ring-foreground scale-110',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full rounded-xl h-12 font-semibold">
              {editingTag ? 'Salvar' : 'Criar Tag'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Tarefas e hábitos associados a esta tag não serão removidos, mas ficarão sem tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteTag(deleteId)
                setDeleteId(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
