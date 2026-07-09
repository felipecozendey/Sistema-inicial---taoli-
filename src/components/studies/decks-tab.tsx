import { useState } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { DeckDialog } from '@/components/studies/deck-dialog'
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
import { Plus, Pencil, Trash2, Layers, Clock } from 'lucide-react'
import type { Deck } from '@/types/flashcard'

interface DecksTabProps {
  onStudyDeck: (deckId: string) => void
}

export function DecksTab({ onStudyDeck }: DecksTabProps) {
  const { decks, flashcards, deleteDeck } = useStudiesStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const nowIso = new Date().toISOString()
  const getDueCount = (deckId: string) =>
    flashcards.filter((fc) => fc.deckId === deckId && fc.nextReviewDate <= nowIso).length
  const getTotalCount = (deckId: string) => flashcards.filter((fc) => fc.deckId === deckId).length

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GameButton
          variant="primary"
          size="md"
          className="gap-2"
          onClick={() => {
            setEditingDeck(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} /> Novo Baralho
        </GameButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decks.map((deck) => {
          const due = getDueCount(deck.id)
          const total = getTotalCount(deck.id)
          return (
            <div
              key={deck.id}
              onClick={() => onStudyDeck(deck.id)}
              className="cursor-pointer rounded-3xl border-2 border-b-4 border-border bg-card p-5 transition-all hover:shadow-lg active:translate-y-0.5 active:border-b-2 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${deck.color}20` }}
                  >
                    {deck.emoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">{deck.title}</h3>
                    <p className="text-sm text-muted-foreground font-semibold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> {total} {total === 1 ? 'carta' : 'cartas'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingDeck(deck)
                      setDialogOpen(true)
                    }}
                    className="p-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteId(deck.id)
                    }}
                    className="p-1.5 bg-muted rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {due > 0 ? (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4B4B]/15 text-[#FF4B4B] text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" /> {due} para revisar
                </div>
              ) : (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#58CC02]/15 text-[#58CC02] text-xs font-bold">
                  Em dia
                </div>
              )}
            </div>
          )
        })}
      </div>

      {decks.length === 0 && (
        <div className="text-center p-12 text-muted-foreground bg-card/50 rounded-3xl border border-dashed">
          Nenhum baralho criado ainda. Clique em "Novo Baralho" para começar!
        </div>
      )}

      <DeckDialog open={dialogOpen} onOpenChange={setDialogOpen} editingDeck={editingDeck} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">Excluir Baralho?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os flashcards deste baralho serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 font-bold"
              onClick={() => {
                if (deleteId) deleteDeck(deleteId)
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
