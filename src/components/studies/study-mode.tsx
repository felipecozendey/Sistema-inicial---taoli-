import { useState, useMemo, useCallback } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { GameButton } from '@/components/ui/game-button'
import { ArrowLeft, Check, X, TrendingUp, Sparkles, Shuffle, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReviewFeedback } from '@/types/flashcard'

interface StudyModeProps {
  deckId: string
  onExit: () => void
}

export function StudyMode({ deckId, onExit }: StudyModeProps) {
  const { decks, flashcards, reviewCard } = useStudiesStore()
  const deck = decks.find((d) => d.id === deckId)

  // Safe memoized current time
  const nowIso = useMemo(() => new Date().toISOString(), [])

  // All cards for this deck
  const allCards = useMemo(() => {
    return flashcards.filter((fc) => fc.deckId === deckId)
  }, [flashcards, deckId])

  // Overdue / due cards ordered by nextReviewDate ascending (oldest first)
  const strictlyDueCards = useMemo(() => {
    return allCards
      .filter((fc) => {
        if (!fc.nextReviewDate) return true
        const d = new Date(fc.nextReviewDate)
        return isNaN(d.getTime()) || fc.nextReviewDate <= nowIso
      })
      .sort((a, b) => {
        const timeA = new Date(a.nextReviewDate).getTime() || 0
        const timeB = new Date(b.nextReviewDate).getTime() || 0
        return timeA - timeB
      })
  }, [allCards, nowIso])

  const hasDueCards = strictlyDueCards.length > 0

  // Session mode: if due cards exist, default to 'due'. If 0 due cards, allow user choice
  const [studyModeChoice, setStudyModeChoice] = useState<'due' | 'free' | null>(() => {
    return hasDueCards ? 'due' : null
  })

  // Shuffle toggle
  const [isShuffled, setIsShuffled] = useState(false)

  // Active study cards pool based on choice
  const studyCards = useMemo(() => {
    if (!studyModeChoice) return []
    const base = studyModeChoice === 'due' ? [...strictlyDueCards] : [...allCards]
    if (isShuffled) {
      // Fisher-Yates shuffle copy
      const shuffled = [...base]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }
    return base
  }, [studyModeChoice, strictlyDueCards, allCards, isShuffled])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [feedbackStats, setFeedbackStats] = useState<{ AGAIN: number; HARD: number; GOOD: number }>(
    {
      AGAIN: 0,
      HARD: 0,
      GOOD: 0,
    },
  )

  const currentCard = studyCards[currentIndex]

  const handleReview = useCallback(
    async (feedback: ReviewFeedback) => {
      if (!currentCard) return
      await reviewCard(currentCard.id, feedback)
      setFeedbackStats((prev) => ({
        ...prev,
        [feedback]: prev[feedback] + 1,
      }))
      setIsFlipped(false)
      setTimeout(() => setCurrentIndex((i) => i + 1), 250)
    },
    [currentCard, reviewCard],
  )

  if (!deck) {
    return (
      <div className="text-center p-12 bg-card rounded-3xl border">
        <p className="text-muted-foreground font-semibold">Baralho não encontrado.</p>
        <GameButton variant="primary" size="md" onClick={onExit} className="mt-4">
          Voltar
        </GameButton>
      </div>
    )
  }

  // Deck has 0 cards overall
  if (allCards.length === 0) {
    return (
      <div className="text-center p-12 bg-card rounded-3xl border animate-fade-in-up">
        <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4 mx-auto border-2 border-b-4 border-border">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-extrabold mb-2">Nenhuma carta no baralho</h3>
        <p className="text-muted-foreground font-semibold max-w-sm mx-auto mb-6">
          Este baralho ainda não possui flashcards. Adicione flashcards para começar a estudar!
        </p>
        <GameButton variant="primary" size="md" onClick={onExit}>
          Voltar aos Baralhos
        </GameButton>
      </div>
    )
  }

  // Coherence with "Em dia" badge: 0 due cards, prompt user with free training
  if (!hasDueCards && studyModeChoice === null) {
    return (
      <div className="text-center p-10 bg-card rounded-3xl border-2 border-b-4 border-border animate-fade-in-up max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mb-4 mx-auto border-2 border-[#58CC02]/30">
          <Check className="w-10 h-10" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-[#58CC02]/15 text-[#58CC02] text-xs font-bold mb-3">
          Baralho em dia
        </span>
        <h3 className="text-2xl font-extrabold mb-2">Nada para revisar hoje! 🎉</h3>
        <p className="text-muted-foreground font-medium mb-6">
          Você já revisou todas as cartas programadas para este baralho. Deseja fazer um treino
          livre com todas as {allCards.length} cartas?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <GameButton variant="secondary" size="md" onClick={onExit}>
            Voltar
          </GameButton>
          <GameButton
            variant="primary"
            size="md"
            className="gap-2"
            onClick={() => setStudyModeChoice('free')}
          >
            <BookOpen className="w-4 h-4" /> Treinar Todas ({allCards.length})
          </GameButton>
        </div>
      </div>
    )
  }

  // Session completed view with feedback breakdown
  if (currentIndex >= studyCards.length && studyCards.length > 0) {
    const totalReviewed = feedbackStats.AGAIN + feedbackStats.HARD + feedbackStats.GOOD
    return (
      <div className="text-center p-10 bg-card rounded-3xl border-2 border-b-4 border-border animate-fade-in-up max-w-lg mx-auto space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#58CC02]/15 flex items-center justify-center mx-auto border-2 border-[#58CC02]/30">
          <Check className="w-10 h-10 text-[#58CC02]" />
        </div>
        <div>
          <h3 className="text-2xl font-extrabold mb-1">Sessão Concluída! 🎉</h3>
          <p className="text-muted-foreground font-semibold">
            Você revisou {totalReviewed} {totalReviewed === 1 ? 'carta' : 'cartas'}.
          </p>
        </div>

        {/* Feedback Breakdown Badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/30 flex flex-col items-center">
            <span className="text-xs font-bold text-[#FF4B4B] uppercase">Errei</span>
            <span className="text-2xl font-black text-[#FF4B4B]">{feedbackStats.AGAIN}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FFC800]/10 border-2 border-b-4 border-[#FFC800]/30 flex flex-col items-center">
            <span className="text-xs font-bold text-[#D99B00] uppercase">Difícil</span>
            <span className="text-2xl font-black text-[#D99B00]">{feedbackStats.HARD}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/30 flex flex-col items-center">
            <span className="text-xs font-bold text-[#58CC02] uppercase">Fácil</span>
            <span className="text-2xl font-black text-[#58CC02]">{feedbackStats.GOOD}</span>
          </div>
        </div>

        <GameButton variant="primary" size="lg" className="w-full" onClick={onExit}>
          Voltar aos Baralhos
        </GameButton>
      </div>
    )
  }

  const progress = studyCards.length > 0 ? (currentIndex / studyCards.length) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Sair
        </button>

        <div className="flex items-center gap-2">
          {currentIndex === 0 && (
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={cn(
                'px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border-2 border-b-4 transition-all',
                isShuffled
                  ? 'bg-primary text-primary-foreground border-primary/80'
                  : 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
              )}
              title="Embaralhar cartas"
            >
              <Shuffle className="w-3.5 h-3.5" /> Embaralhar
            </button>
          )}

          <span className="text-sm font-bold text-muted-foreground">
            {deck.emoji} {deck.title}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden border">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
          <span>{studyModeChoice === 'free' ? 'Modo Treino Livre' : 'Modo Revisão Espaçada'}</span>
          <span>
            Carta {currentIndex + 1} de {studyCards.length}
          </span>
        </div>
      </div>

      {/* 3D Flip Card */}
      {currentCard && (
        <div className="[perspective:1000px] min-h-[380px] h-[400px]">
          <div
            className={cn(
              'relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 cursor-pointer',
              isFlipped && '[transform:rotateY(180deg)]',
            )}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-card rounded-3xl border-2 border-b-4 border-border p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
                Pergunta
              </span>
              <div
                className="cloze-front text-xl font-extrabold leading-relaxed prose prose-sm max-w-none text-card-foreground"
                dangerouslySetInnerHTML={{ __html: currentCard.front }}
              />
              <p className="text-xs text-muted-foreground font-semibold mt-6">Toque para virar</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-card rounded-3xl border-2 border-b-4 border-primary p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-primary uppercase tracking-wide mb-4">
                Resposta
              </span>
              <div
                className="cloze-back text-lg font-bold leading-relaxed prose prose-sm max-w-none text-card-foreground"
                dangerouslySetInnerHTML={{ __html: currentCard.back }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feedback buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
          <button
            onClick={() => handleReview('AGAIN')}
            className="py-3.5 rounded-2xl bg-[#FF4B4B] text-white font-bold text-sm border-2 border-b-4 border-[#FF4B4B]/80 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-1.5 hover:brightness-105"
          >
            <X className="w-4 h-4" /> Errei
          </button>
          <button
            onClick={() => handleReview('HARD')}
            className="py-3.5 rounded-2xl bg-[#FFC800] text-black font-bold text-sm border-2 border-b-4 border-[#FFC800]/80 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-1.5 hover:brightness-105"
          >
            <TrendingUp className="w-4 h-4" /> Difícil
          </button>
          <button
            onClick={() => handleReview('GOOD')}
            className="py-3.5 rounded-2xl bg-[#58CC02] text-white font-bold text-sm border-2 border-b-4 border-[#58CC02]/80 active:translate-y-0.5 active:border-b-2 transition-all flex items-center justify-center gap-1.5 hover:brightness-105"
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
