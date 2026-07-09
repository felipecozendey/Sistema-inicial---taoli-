import type { Notebook, Note } from '@/stores/useStudiesStore'

const now = Date.now()

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
