import { useState, useEffect } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmojiPicker } from '@/components/studies/emoji-picker'
import { cn } from '@/lib/utils'
import type { Deck } from '@/types/flashcard'

const DECK_COLORS = [
  '#1CB0F6',
  '#58CC02',
  '#CE82FF',
  '#FFC800',
  '#FF4B4B',
  '#FF9600',
  '#E84BD6',
  '#84CC16',
]

interface DeckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingDeck?: Deck | null
}

export function DeckDialog({ open, onOpenChange, editingDeck }: DeckDialogProps) {
  const { addDeck, updateDeck } = useStudiesStore()
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('📚')
  const [color, setColor] = useState(DECK_COLORS[0])

  useEffect(() => {
    if (open) {
      if (editingDeck) {
        setTitle(editingDeck.title)
        setEmoji(editingDeck.emoji)
        setColor(editingDeck.color)
      } else {
        setTitle('')
        setEmoji('📚')
        setColor(DECK_COLORS[0])
      }
    }
  }, [open, editingDeck])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (editingDeck) await updateDeck(editingDeck.id, { title, emoji, color })
    else await addDeck({ title, emoji, color })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {editingDeck ? 'Editar Baralho' : 'Novo Baralho'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="font-bold">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl font-semibold"
              placeholder="Ex: Hábitos & Produtividade"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Emoji</Label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Cor</Label>
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map((c) => (
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
            {editingDeck ? 'Salvar' : 'Criar Baralho'}
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
