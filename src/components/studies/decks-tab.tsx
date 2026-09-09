import { useState, useMemo } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { DeckDialog } from '@/components/studies/deck-dialog'
import { GameButton } from '@/components/ui/game-button'
import { StudiesStatsWidget } from '@/components/studies/studies-stats-widget'
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
import { Plus, Pencil, Trash2, Layers, Clock, Play } from 'lucide-react'
import type { Deck } from '@/types/flashcard'

interface DecksTabProps {
  onStudyDeck: (deckId: string) => void
}

export function DecksTab({ onStudyDeck }: DecksTabProps) {
  const { decks, flashcards, deleteDeck } = useStudiesStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const nowIso = useMemo(() => new Date().toISOString(), [])

  // Memoized counts per deck to avoid re-filtering flashcards on every single render
  const deckCounts = useMemo(() => {
    const map = new Map<string, { total: number; due: number }>()
    for (const d of decks) {
      map.set(d.id, { total: 0, due: 0 })
    }
    for (const fc of flashcards) {
      const counts = map.get(fc.deckId)
      if (counts) {
        counts.total++
        if (fc.nextReviewDate && fc.nextReviewDate <= nowIso) {
          counts.due++
        }
      }
    }
    return map
  }, [decks, flashcards, nowIso])

  return (
    <div className="space-y-6">
      {/* Duolingo-style Stats Widget */}
      <StudiesStatsWidget />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold">Baralhos de Flashcards</h3>
          <p className="text-xs text-muted-foreground font-semibold">
            Revise seus conhecimentos com repetição espaçada.
          </p>
        </div>
        <GameButton
          variant="primary"
          size="md"
          className="gap-2 shrink-0"
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
          const counts = deckCounts.get(deck.id) || { total: 0, due: 0 }
          const due = counts.due
          const total = counts.total

          return (
            <div
              key={deck.id}
              className="cursor-pointer rounded-3xl border-2 border-b-4 border-border bg-card p-5 transition-all hover:shadow-lg active:translate-y-0.5 active:border-b-2 group flex flex-col justify-between"
              onClick={() => onStudyDeck(deck.id)}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-border/50"
                      style={{ backgroundColor: `${deck.color}20` }}
                    >
                      {deck.emoji}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base">{deck.title}</h3>
                      <p className="text-sm text-muted-foreground font-semibold flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> {total}{' '}
                        {total === 1 ? 'carta' : 'cartas'}
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
                      title="Editar baralho"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(deck.id)
                      }}
                      className="p-1.5 bg-muted rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                      title="Excluir baralho"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  {due > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4B4B]/15 text-[#FF4B4B] text-xs font-bold border border-[#FF4B4B]/30">
                      <Clock className="w-3.5 h-3.5" /> {due}{' '}
                      {due === 1 ? 'cartão pendente' : 'cartões pendentes'}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#58CC02]/15 text-[#58CC02] text-xs font-bold border border-[#58CC02]/30">
                      Em dia
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStudyDeck(deck.id)
                }}
                className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm border-2 border-b-4 border-primary/80 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-1.5 hover:brightness-105"
              >
                <Play className="w-4 h-4" fill="currentColor" /> Estudar Agora
              </button>
            </div>
          )
        })}
      </div>

      {decks.length === 0 && (
        <div className="text-center p-12 text-muted-foreground bg-card/50 rounded-3xl border border-dashed flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-3">
            <Layers className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="text-base font-extrabold text-foreground">Nenhum baralho criado ainda</h4>
          <p className="text-sm font-semibold max-w-sm mt-1">
            Crie baralhos e adicione flashcards para começar suas revisões espaçadas.
          </p>
        </div>
      )}

      <DeckDialog open={dialogOpen} onOpenChange={setDialogOpen} editingDeck={editingDeck} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-2 border-b-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">Excluir Baralho?</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              Todos os flashcards deste baralho serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold border-2 border-b-4">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 font-bold border-2 border-b-4 border-[#FF4B4B]/80"
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
