import { useState, useEffect } from 'react'
import { useStudiesStore, Notebook } from '@/stores/useStudiesStore'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmojiPicker } from '@/components/studies/emoji-picker'
import { cn } from '@/lib/utils'

const COVER_COLORS = [
  '#1CB0F6',
  '#58CC02',
  '#CE82FF',
  '#FFC800',
  '#FF4B4B',
  '#FF9600',
  '#E84BD6',
  '#84CC16',
]

interface NotebookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingNotebook?: Notebook | null
}

export function NotebookDialog({ open, onOpenChange, editingNotebook }: NotebookDialogProps) {
  const { addNotebook, updateNotebook } = useStudiesStore()
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🧠')
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0])

  useEffect(() => {
    if (open) {
      if (editingNotebook) {
        setTitle(editingNotebook.title)
        setEmoji(editingNotebook.emoji)
        setCoverColor(editingNotebook.coverColor)
      } else {
        setTitle('')
        setEmoji('🧠')
        setCoverColor(COVER_COLORS[0])
      }
    }
  }, [open, editingNotebook])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (editingNotebook) updateNotebook(editingNotebook.id, { title, emoji, coverColor })
    else addNotebook({ title, emoji, coverColor })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {editingNotebook ? 'Editar Caderno' : 'Novo Caderno'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="font-bold">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl font-semibold"
              placeholder="Ex: Aprendizado de Idiomas"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Emoji</Label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Cor da Capa</Label>
            <div className="flex flex-wrap gap-2">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCoverColor(c)}
                  className={cn(
                    'w-9 h-9 rounded-full transition-transform border-2 border-b-4 active:translate-y-0.5 active:border-b-2',
                    coverColor === c && 'ring-2 ring-offset-2 ring-foreground scale-110',
                  )}
                  style={{ backgroundColor: c, borderColor: c }}
                />
              ))}
            </div>
          </div>
          <GameButton type="submit" variant="primary" size="lg" className="w-full">
            {editingNotebook ? 'Salvar' : 'Criar Caderno'}
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
