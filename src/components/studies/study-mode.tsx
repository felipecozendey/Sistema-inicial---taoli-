import { useState, useMemo, useCallback } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { GameButton } from '@/components/ui/game-button'
import { ArrowLeft, Check, X, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReviewFeedback } from '@/types/flashcard'

interface StudyModeProps {
  deckId: string
  onExit: () => void
}

export function StudyMode({ deckId, onExit }: StudyModeProps) {
  const { decks, flashcards, reviewCard } = useStudiesStore()
  const deck = decks.find((d) => d.id === deckId)

  const nowIso = new Date().toISOString()

  const dueCards = useMemo(() => {
    const all = flashcards.filter((fc) => fc.deckId === deckId)
    const due = all.filter((fc) => fc.nextReviewDate <= nowIso)
    return due.length > 0 ? due : all
  }, [flashcards, deckId])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const currentCard = dueCards[currentIndex]

  const handleReview = useCallback(
    async (feedback: ReviewFeedback) => {
      if (!currentCard) return
      await reviewCard(currentCard.id, feedback)
      setReviewedCount((c) => c + 1)
      setIsFlipped(false)
      setTimeout(() => setCurrentIndex((i) => i + 1), 300)
    },
    [currentCard, reviewCard],
  )

  if (!deck) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground font-semibold">Baralho não encontrado.</p>
        <GameButton variant="primary" size="md" onClick={onExit} className="mt-4">
          Voltar
        </GameButton>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return (
      <div className="text-center p-12 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-extrabold mb-2">Nenhuma carta para revisar</h3>
        <p className="text-muted-foreground font-semibold max-w-sm mx-auto mb-6">
          Este baralho está vazio. Adicione flashcards para começar a estudar!
        </p>
        <GameButton variant="primary" size="md" onClick={onExit}>
          Voltar aos Baralhos
        </GameButton>
      </div>
    )
  }

  if (currentIndex >= dueCards.length) {
    return (
      <div className="text-center p-12 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-[#58CC02]/15 flex items-center justify-center mb-4 mx-auto">
          <Check className="w-10 h-10 text-[#58CC02]" />
        </div>
        <h3 className="text-2xl font-extrabold mb-2">Sessão Concluída! 🎉</h3>
        <p className="text-muted-foreground font-semibold mb-6">
          Você revisou {reviewedCount} {reviewedCount === 1 ? 'carta' : 'cartas'}.
        </p>
        <GameButton variant="primary" size="md" onClick={onExit}>
          Voltar aos Baralhos
        </GameButton>
      </div>
    )
  }

  const progress = (currentIndex / dueCards.length) * 100

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Sair
        </button>
        <span className="text-sm font-bold text-muted-foreground">
          {deck.emoji} {deck.title}
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-center text-sm font-bold text-muted-foreground">
        Carta {currentIndex + 1} de {dueCards.length}
      </p>

      <div className="[perspective:1000px] h-[400px]">
        <div
          className={cn(
            'relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 cursor-pointer',
            isFlipped && '[transform:rotateY(180deg)]',
          )}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="absolute inset-0 [backface-visibility:hidden] bg-card rounded-3xl border-2 border-b-4 border-border p-8 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
              Pergunta
            </span>
            <div
              className="cloze-front text-xl font-extrabold leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: currentCard.front }}
            />
            <p className="text-xs text-muted-foreground font-semibold mt-6">Toque para virar</p>
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-card rounded-3xl border-2 border-b-4 border-primary p-8 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-primary uppercase tracking-wide mb-4">
              Resposta
            </span>
            <div
              className="cloze-back text-lg font-bold leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: currentCard.back }}
            />
          </div>
        </div>
      </div>

      {isFlipped ? (
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
          <button
            onClick={() => handleReview('AGAIN')}
            className="py-3 rounded-2xl bg-[#FF4B4B] text-white font-bold text-sm border-2 border-b-4 border-[#FF4B4B]/80 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" /> Errei
          </button>
          <button
            onClick={() => handleReview('HARD')}
            className="py-3 rounded-2xl bg-[#FFC800] text-black font-bold text-sm border-2 border-b-4 border-[#FFC800]/80 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4" /> Difícil
          </button>
          <button
            onClick={() => handleReview('GOOD')}
            className="py-3 rounded-2xl bg-[#58CC02] text-white font-bold text-sm border-2 border-b-4 border-[#58CC02]/80 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Fácil
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground font-semibold">
          Toque no cartão para revelar a resposta
        </p>
      )}
    </div>
  )
}
