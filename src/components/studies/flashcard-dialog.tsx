import { useState, useEffect } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { GameButton } from '@/components/ui/game-button'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/studies/rich-text-editor'
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
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
    if (!stripHtml(front) || !stripHtml(back) || !deckId) return
    await addFlashcard({ deckId, noteId, front, back })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl">
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
            <RichTextEditor
              key={`front-${open}`}
              content={front}
              onChange={setFront}
              variant="mini"
              enableCloze
              placeholder="Digite a pergunta... Selecione texto e use [...] para omissão."
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Verso (Resposta)</Label>
            <RichTextEditor
              key={`back-${open}`}
              content={back}
              onChange={setBack}
              variant="mini"
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
