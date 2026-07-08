import { useState } from 'react'
import { useAppStore, Tag } from '@/stores/useAppStore'
import { GameButton } from '@/components/ui/game-button'
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
  '#58CC02',
  '#1CB0F6',
  '#FFC800',
  '#FF4B4B',
  '#CE82FF',
  '#FF9600',
  '#E84BD6',
  '#84CC16',
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
    <section className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold">Tags</h3>
        <GameButton variant="outline" size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Nova Tag
        </GameButton>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag: any) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 bg-muted/50 rounded-full pl-3 pr-1 py-1 group"
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="text-sm font-bold">{tag.name}</span>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(tag)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setDeleteId(tag.id)}
                className="p-1.5 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground font-semibold">Nenhuma tag criada ainda.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              {editingTag ? 'Editar Tag' : 'Nova Tag'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name" className="font-bold">
                Nome
              </Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-2xl font-semibold"
                placeholder="Ex: Projetos Pessoais"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-9 h-9 rounded-full transition-transform border-2 border-b-4 active:translate-y-0.5 active:border-b-2',
                      color === c && 'ring-2 ring-offset-2 ring-foreground scale-110',
                    )}
                    style={{ backgroundColor: c, borderColor: c }}
                  />
                ))}
              </div>
            </div>
            <GameButton type="submit" variant="primary" size="lg" className="w-full">
              {editingTag ? 'Salvar' : 'Criar Tag'}
            </GameButton>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">Excluir Tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Tarefas e hábitos associados a esta tag não serão removidos, mas ficarão sem tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 font-bold"
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
