import type { Notebook, Note } from '@/stores/useStudiesStore'
import type { Deck, Flashcard } from '@/types/flashcard'

const now = Date.now()
const todayIso = new Date(now).toISOString()
const yesterdayIso = new Date(now - 86400000).toISOString()
const tomorrowIso = new Date(now + 86400000).toISOString()

export const mockNotebooks: Notebook[] = [
  { id: 'nb1', title: 'Mindset & Produtividade', emoji: '🧠', coverColor: '#1CB0F6' },
  { id: 'nb2', title: 'Desenvolvimento Pessoal', emoji: '🌱', coverColor: '#58CC02' },
  { id: 'nb3', title: 'Leituras & Resumos', emoji: '📚', coverColor: '#CE82FF' },
]

export const mockNotes: Note[] = [
  {
    id: 'n1',
    notebookId: 'nb1',
    title: 'Hábitos Atômicos',
    emoji: '⚛️',
    content:
      'Pequenos hábitos geram grandes resultados. Ver [[Sistema de Hábitos]] para o framework completo.\n\nO método de 1% melhor a cada dia é poderoso.',
    tags: ['hábitos', 'produtividade'],
    linkedNoteIds: ['n2'],
    lastEdited: new Date(now - 86400000).toISOString(),
  },
  {
    id: 'n2',
    notebookId: 'nb1',
    title: 'Sistema de Hábitos',
    emoji: '🔄',
    content:
      'O loop do hábito: gatilho → rotina → recompensa. Inspirado em [[Hábitos Atômicos]].\n\nPara mudar mindset, veja [[Growth Mindset]].',
    tags: ['framework', 'hábitos'],
    linkedNoteIds: ['n1', 'n3'],
    lastEdited: new Date(now - 43200000).toISOString(),
  },
  {
    id: 'n3',
    notebookId: 'nb2',
    title: 'Growth Mindset',
    emoji: '🧠',
    content: 'Acreditar que habilidades podem ser desenvolvidas. Base para [[Hábitos Atômicos]].',
    tags: ['mindset', 'psicologia'],
    linkedNoteIds: ['n1'],
    lastEdited: new Date(now - 7200000).toISOString(),
  },
  {
    id: 'n4',
    notebookId: 'nb1',
    title: 'Técnica Pomodoro',
    emoji: '🍅',
    content: '25min foco + 5min descanso. Integra bem com o [[Sistema de Hábitos]].',
    tags: ['foco', 'produtividade'],
    linkedNoteIds: ['n2'],
    lastEdited: new Date(now - 3600000).toISOString(),
  },
  {
    id: 'n5',
    notebookId: 'nb3',
    title: 'Resumo: O Poder do Hábito',
    emoji: '📖',
    content:
      'Hábitos moldam destinos. Conceitos-chave em [[Hábitos Atômicos]] e [[Sistema de Hábitos]].',
    tags: ['leitura', 'resumo'],
    linkedNoteIds: ['n1', 'n2'],
    lastEdited: new Date(now).toISOString(),
  },
]

export const mockDecks: Deck[] = [
  { id: 'deck1', title: 'Hábitos & Produtividade', emoji: '🧠', color: '#1CB0F6' },
  { id: 'deck2', title: 'Mindset & Psicologia', emoji: '🌱', color: '#58CC02' },
  { id: 'deck3', title: 'Leituras', emoji: '📚', color: '#CE82FF' },
]

export const mockFlashcards: Flashcard[] = [
  {
    id: 'fc1',
    deckId: 'deck1',
    noteId: 'n1',
    front: 'Qual o princípio do 1% melhor a cada dia?',
    back: 'Pequenos hábitos consistentes geram grandes resultados compostos ao longo do tempo.',
    nextReviewDate: todayIso,
    interval: 0,
    easeFactor: 2.5,
  },
  {
    id: 'fc2',
    deckId: 'deck1',
    noteId: 'n2',
    front: 'Qual é o loop do hábito?',
    back: 'Gatilho → Rotina → Recompensa',
    nextReviewDate: todayIso,
    interval: 2,
    easeFactor: 2.5,
  },
  {
    id: 'fc3',
    deckId: 'deck1',
    noteId: 'n4',
    front: 'Como funciona a Técnica Pomodoro?',
    back: '25 minutos de foco seguidos de 5 minutos de descanso.',
    nextReviewDate: yesterdayIso,
    interval: 3,
    easeFactor: 2.6,
  },
  {
    id: 'fc4',
    deckId: 'deck2',
    noteId: 'n3',
    front: 'O que é Growth Mindset?',
    back: 'Acreditar que habilidades podem ser desenvolvidas com esforço e dedicação.',
    nextReviewDate: todayIso,
    interval: 0,
    easeFactor: 2.5,
  },
  {
    id: 'fc5',
    deckId: 'deck2',
    noteId: null,
    front: 'O que é o efeito Dunning-Kruger?',
    back: 'Tendência de pessoas com baixa habilidade superestimarem sua competência.',
    nextReviewDate: tomorrowIso,
    interval: 5,
    easeFactor: 2.7,
  },
  {
    id: 'fc6',
    deckId: 'deck3',
    noteId: 'n5',
    front: 'Qual a ideia central de "O Poder do Hábito"?',
    back: 'Hábitos moldam destinos através de loops automáticos no cérebro.',
    nextReviewDate: todayIso,
    interval: 1,
    easeFactor: 2.5,
  },
]
