import { useState, useEffect } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { GameButton } from '@/components/ui/game-button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface FlashcardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string | null
}

export function FlashcardDialog({ open, onOpenChange, noteId }: FlashcardDialogProps) {
  const { decks, addFlashcard } = useStudiesStore()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [deckId, setDeckId] = useState('')

  useEffect(() => {
    if (open) {
      setFront('')
      setBack('')
      setDeckId(decks[0]?.id || '')
    }
  }, [open, decks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!front.trim() || !back.trim() || !deckId) return
    await addFlashcard({ deckId, noteId, front: front.trim(), back: back.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Novo Flashcard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="font-bold">Baralho</Label>
            <Select value={deckId} onValueChange={setDeckId}>
              <SelectTrigger className="rounded-2xl font-semibold">
                <SelectValue placeholder="Selecione um baralho..." />
              </SelectTrigger>
              <SelectContent>
                {decks.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.emoji} {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {decks.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Crie um baralho primeiro na aba Revisão.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Frente (Pergunta)</Label>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="rounded-2xl font-semibold min-h-[80px]"
              placeholder="Digite a pergunta..."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Verso (Resposta)</Label>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="rounded-2xl font-semibold min-h-[80px]"
              placeholder="Digite a resposta..."
            />
          </div>
          <GameButton type="submit" variant="primary" size="lg" className="w-full">
            Criar Flashcard
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
