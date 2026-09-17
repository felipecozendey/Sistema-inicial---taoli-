import React from 'react'

export interface ScopeDefinition {
  key: string
  title: string
  description: string
  icon: (props: { className?: string }) => React.ReactElement
}

export const CONSENT_SCOPES: ScopeDefinition[] = [
  {
    key: 'tarefas',
    title: 'Performance',
    description:
      'Tarefas agendadas, hábitos diários, taxa de conclusão e histórico de consistência, e poderá criar tarefas e hábitos para você, identificados com o nome dele.',
    icon: ({ className = 'w-5 h-5' }: { className?: string }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="M20 12h-4" />
        <path d="m19.07 4.93-2.83 2.83" />
        <path d="M9 11l3 3L22 4" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </svg>
    ),
  },
  {
    key: 'saude',
    title: 'Saúde e Medições',
    description:
      'Métricas corporais, peso, dobras, metas clínicas, exames anexados e registros nutricionais, e poderá registrar plano alimentar, receitas, medidas, ato energético e fichas de treino para você.',
    icon: ({ className = 'w-5 h-5' }: { className?: string }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 9v4" />
        <path d="M10 11h4" />
      </svg>
    ),
  },
  {
    key: 'financas',
    title: 'Finanças Pessoais',
    description:
      'Transações, faturas, contas e investimentos agregados (somente visualização) — senhas nunca são compartilhadas.',
    icon: ({ className = 'w-5 h-5' }: { className?: string }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="14" x="2" y="5" rx="3" />
        <line x1="2" x2="22" y1="10" />
        <path d="M7 15h.01" />
        <path d="M11 15h2" />
      </svg>
    ),
  },
  {
    key: 'estudos',
    title: 'Estudos e Conhecimento',
    description:
      'Cadernos, anotações, baralhos de flashcards e estatísticas de retenção e revisões (somente visualização).',
    icon: ({ className = 'w-5 h-5' }: { className?: string }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
        <path d="M6 14h6" />
      </svg>
    ),
  },
  {
    key: 'mente',
    title: 'Mente',
    description:
      'Histórico das suas avaliações mentais (humor, estresse, ansiedade, tristeza e sono), seu diário e seus acontecimentos registrados (somente visualização).',
    icon: ({ className = 'w-5 h-5' }: { className?: string }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.5 2A4.5 4.5 0 0 0 5 6.5c0 .64.13 1.25.37 1.8A4 4 0 0 0 4 12a4 4 0 0 0 2 3.46V18a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-4" />
        <path d="M14.5 2A4.5 4.5 0 0 1 19 6.5c0 .64-.13 1.25-.37 1.8A4 4 0 0 1 20 12a4 4 0 0 1-2 3.46V18a3 3 0 0 1-3 3h-1a1 1 0 0 1-1-1v-4" />
        <path d="M12 2v20" />
        <path d="M8.5 7.5c1 .5 1.5 1.5 1.5 2.5" />
        <path d="M15.5 7.5c-1 .5-1.5 1.5-1.5 2.5" />
      </svg>
    ),
  },
]

export const SCOPE_LABELS: Record<string, string> = {
  tarefas: 'Performance',
  saude: 'Saúde',
  mente: 'Mente',
  financas: 'Finanças',
  estudos: 'Estudos',
}

export const SCOPE_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  tarefas: {
    bg: 'bg-[#58CC02]/10',
    text: 'text-[#58CC02]',
    border: 'border-[#58CC02]/30',
  },
  saude: {
    bg: 'bg-[#1CB0F6]/10',
    text: 'text-[#1CB0F6]',
    border: 'border-[#1CB0F6]/30',
  },
  mente: {
    bg: 'bg-[#CE82FF]/10',
    text: 'text-[#CE82FF]',
    border: 'border-[#CE82FF]/30',
  },
  financas: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  estudos: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
  },
}
