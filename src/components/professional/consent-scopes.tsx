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
    title: 'Hábitos e Tarefas',
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
]

export const SCOPE_LABELS: Record<string, string> = {
  tarefas: 'Hábitos e Tarefas',
  saude: 'Saúde',
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
