export type ReviewFeedback = 'AGAIN' | 'HARD' | 'GOOD'

export interface Deck {
  id: string
  title: string
  icon: string
  color: string
  tagId: string | null
}

export interface Flashcard {
  id: string
  deckId: string
  noteId: string | null
  front: string
  back: string
  nextReviewDate: number
  interval: number
  easeFactor: number
}

export interface StudyNote {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}
