import React from 'react'

export type ScopeId =
  | 'prontuario_geral'
  | 'tarefas'
  | 'mente'
  | 'nutricao'
  | 'exercicios'
  | 'raio_x'
  | 'financas'
  | 'estudos'
  | 'historico_social'
  | 'saude' // Legado mantido para compatibilidade

export interface ScopeDefinition {
  id: ScopeId
  label: string
  description: string
  badgeClass: string
  category?: 'clinica' | 'rotina' | 'vida'
  iconSvg?: React.ReactNode
}

/**
 * Escopos granulares ativos para seleção de consentimento.
 * Ordem alinhada com as abas do Prontuário Pro / Saúde:
 * Prontuário Geral · Performance · Mente · Nutrição · Exercícios · Raio-X Corporal · Finanças · Estudos · Histórico Social
 */
export const CONSENT_SCOPES: ScopeDefinition[] = [
  {
    id: 'prontuario_geral',
    label: 'Prontuário Geral',
    description:
      'Métricas corporais, peso, dobras, metas clínicas, exames anexados e registros gerais de saúde.',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800',
    category: 'clinica',
  },
  {
    id: 'tarefas',
    label: 'Performance',
    description: 'Tarefas diárias, hábitos, rotinas, checklists e progresso das metas.',
    badgeClass: 'bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/30',
    category: 'rotina',
  },
  {
    id: 'mente',
    label: 'Mente',
    description:
      'Avaliações diárias de humor, ansiedade, estresse, diário emocional e linha do tempo.',
    badgeClass: 'bg-[#CE82FF]/10 text-[#CE82FF] border-[#CE82FF]/30',
    category: 'clinica',
  },
  {
    id: 'nutricao',
    label: 'Nutrição',
    description:
      'Plano alimentar prescrito, histórico de refeições, receitas personalizadas e balanço metabólico.',
    badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-300 dark:border-orange-800',
    category: 'clinica',
  },
  {
    id: 'exercicios',
    label: 'Exercícios',
    description:
      'Fichas de treino, rotinas ativas prescritas, registros de treino e histórico de exercícios.',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-800',
    category: 'rotina',
  },
  {
    id: 'raio_x',
    label: 'Raio-X Corporal',
    description:
      'Composição corporal em 4 compartimentos, evolução visual, gráficos e comparativos físicos.',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 border-cyan-300 dark:border-cyan-800',
    category: 'clinica',
  },
  {
    id: 'financas',
    label: 'Finanças',
    description: 'Transações, categorias, DRE pessoal, contas bancárias e metas financeiras.',
    badgeClass: 'bg-[#FFC800]/10 text-amber-700 dark:text-amber-400 border-[#FFC800]/40',
    category: 'vida',
  },
  {
    id: 'estudos',
    label: 'Estudos',
    description:
      'Cadernos de anotações, decks de flashcards, sessões de revisão e notas de estudo.',
    badgeClass: 'bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/30',
    category: 'vida',
  },
  {
    id: 'historico_social',
    label: 'Histórico Social',
    description:
      'Anamnese de hábitos sociais, tabagismo, etilismo, sono, rotina familiar e fatores de risco.',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-800',
    category: 'clinica',
  },
]

export const SCOPE_LABELS: Record<string, string> = {
  prontuario_geral: 'Prontuário Geral',
  tarefas: 'Performance',
  mente: 'Mente',
  nutricao: 'Nutrição',
  exercicios: 'Exercícios',
  raio_x: 'Raio-X Corporal',
  financas: 'Finanças',
  estudos: 'Estudos',
  historico_social: 'Histórico Social',
  saude: 'Saúde (Geral, Nutrição, Treinos, Raio-X)',
}

export const SCOPE_BADGE_STYLES: Record<string, string> = {
  prontuario_geral: 'bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800',
  tarefas: 'bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/30',
  mente: 'bg-[#CE82FF]/10 text-[#CE82FF] border-[#CE82FF]/30',
  nutricao: 'bg-orange-500/10 text-orange-600 border-orange-300 dark:border-orange-800',
  exercicios: 'bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-800',
  raio_x: 'bg-cyan-500/10 text-cyan-600 border-cyan-300 dark:border-cyan-800',
  financas: 'bg-[#FFC800]/10 text-amber-700 dark:text-amber-400 border-[#FFC800]/40',
  estudos: 'bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/30',
  historico_social: 'bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-800',
  saude: 'bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800',
}

/**
 * Normaliza os escopos concedidos pelo paciente:
 * se contiver o legado 'saude', expande para prontuario_geral, nutricao, exercicios e raio_x.
 */
export function normalizeGrantedPages(pages: string[] = []): string[] {
  const set = new Set<string>(pages)
  if (set.has('saude')) {
    set.add('prontuario_geral')
    set.add('nutricao')
    set.add('exercicios')
    set.add('raio_x')
  }
  return Array.from(set)
}

/**
 * Agrupamentos visuais para tela de consentimento
 */
export const SCOPE_CATEGORIES = [
  { id: 'clinica', title: 'Saúde & Clínica', color: '#58CC02' },
  { id: 'rotina', title: 'Rotina & Atividades', color: '#1CB0F6' },
  { id: 'vida', title: 'Vida & Desenvolvimento', color: '#FFC800' },
] as const
