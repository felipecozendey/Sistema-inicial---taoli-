import type { Flashcard, ReviewFeedback } from '@/types/flashcard'

export function calculateSRS(
  card: Pick<Flashcard, 'interval' | 'easeFactor'>,
  feedback: ReviewFeedback,
): { interval: number; easeFactor: number; nextReviewDate: string } {
  let interval = card.interval
  let easeFactor = card.easeFactor

  switch (feedback) {
    case 'AGAIN': {
      interval = 1
      easeFactor = Math.max(1.3, easeFactor - 0.2)
      break
    }
    case 'HARD': {
      interval = Math.max(1, Math.round(interval * 1.2))
      easeFactor = Math.max(1.3, easeFactor - 0.15)
      break
    }
    case 'GOOD': {
      interval = interval <= 0 ? 1 : Math.round(interval * easeFactor)
      easeFactor = Math.max(1.3, easeFactor + 0.1)
      break
    }
  }

  const nextReviewDate = new Date(Date.now() + interval * 86400000).toISOString()
  return { interval, easeFactor, nextReviewDate }
}
