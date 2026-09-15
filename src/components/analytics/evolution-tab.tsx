import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { HabitHeatmap } from '@/components/analytics/habit-heatmap'
import { TaskDistribution } from '@/components/analytics/task-distribution'
import { TimeDistribution } from '@/components/analytics/time-distribution'
import { HabitStreaks } from '@/components/analytics/habit-streaks'
import { MoodEvolution } from '@/components/analytics/mood-evolution'
import { HydrationConsistency } from '@/components/analytics/hydration-consistency'
import { OverviewCards } from '@/components/analytics/overview-cards'
import { WeeklyComparisonChart } from '@/components/analytics/weekly-comparison-chart'
import { MindEvolution } from '@/components/analytics/mind-evolution'
import { UnifiedReportModal } from '@/components/analytics/unified-report-modal'
import { Lightbulb, Sparkles, BarChart3, Activity, Heart, Brain, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const EVOLUTION_SECTIONS = [
  { value: 'overview', label: 'Visão Geral', emoji: '📊' },
  { value: 'productivity', label: 'Produtividade', emoji: '⚡' },
  { value: 'habits', label: 'Hábitos', emoji: '🔄' },
  { value: 'health', label: 'Saúde', emoji: '❤️' },
  { value: 'mind', label: 'Mente', emoji: '🧠' },
] as const

type EvolutionSectionKey = (typeof EVOLUTION_SECTIONS)[number]['value']

export function EvolutionTab() {
  const { tasks, habits, tags } = useAppStore()
  const [activeSection, setActiveSection] = useState<EvolutionSectionKey>('overview')

  // Geração de frase de insight dinâmica baseada nos dados reais de produtividade
  const productivityInsight = useMemo(() => {
    // 1. Tag mais frequente em tarefas concluídas
    const tagCounts: Record<string, number> = {}
    tasks
      .filter((t) => t.completed)
      .forEach((t) => {
        if (t.tagId) {
          tagCounts[t.tagId] = (tagCounts[t.tagId] || 0) + 1
        }
      })

    let maxTagId = ''
    let maxCount = 0
    Object.entries(tagCounts).forEach(([tagId, count]) => {
      if (count > maxCount) {
        maxCount = count
        maxTagId = tagId
      }
    })

    const topTag = tags.find((t) => t.id === maxTagId)

    // 2. Nível de energia mais concluído (1: Baixa, 2: Média, 3: Alta)
    const energyCounts = {
      high: tasks.filter((t) => t.completed && t.energyLevel === 3).length,
      medium: tasks.filter((t) => t.completed && t.energyLevel === 2).length,
      low: tasks.filter((t) => t.completed && t.energyLevel === 1).length,
    }

    if (topTag && maxCount >= 2) {
      return `Tarefas de "${topTag.name}" são o seu forte — você já concluiu ${maxCount} tarefas nesta categoria!`
    }

    if (energyCounts.high >= energyCounts.medium && energyCounts.high > 0) {
      return 'As tarefas de Alta Energia são o teu forte! Você rende mais em desafios complexos.'
    }

    if (energyCounts.medium > 0) {
      return 'Você mantém um ritmo constante em tarefas de Média Energia. Excelente constância!'
    }

    return 'Conclua tarefas ao longo da semana para descobrir seus padrões de energia e produtividade!'
  }, [tasks, tags])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com título, subtítulo e botão "Gerar Relatório" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">Sua Evolução</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Acompanhe seu progresso e mantenha o ritmo em todas as áreas.
          </p>
        </div>

        <div className="shrink-0">
          <UnifiedReportModal />
        </div>
      </div>

      {/* Sub-chips horizontais roláveis (Visão Geral · Produtividade · Hábitos · Saúde · Mente) */}
      <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        <div className="inline-flex items-center gap-2 p-1.5 rounded-3xl bg-muted/50 border-2 border-border">
          {EVOLUTION_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.value
            return (
              <button
                key={sec.value}
                type="button"
                onClick={() => setActiveSection(sec.value)}
                className={cn(
                  'px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer border-b-4',
                  isActive
                    ? 'bg-[#1CB0F6] text-white border-[#1899D6] shadow-sm translate-y-[-1px]'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground active:border-b-0 active:translate-y-1',
                )}
              >
                <span>{sec.emoji}</span>
                <span>{sec.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo da seção ativa */}
      <div className="mt-4">
        {/* 1. VISÃO GERAL */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <OverviewCards tasks={tasks} habits={habits} />
            <WeeklyComparisonChart tasks={tasks} habits={habits} />
          </div>
        )}

        {/* 2. PRODUTIVIDADE */}
        {activeSection === 'productivity' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#1CB0F6]/15 border-2 border-b-4 border-[#1CB0F6] text-foreground rounded-3xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <p className="font-extrabold text-xs sm:text-sm leading-relaxed">
                {productivityInsight}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TaskDistribution tasks={tasks} />
              <TimeDistribution tasks={tasks} />
            </div>
          </div>
        )}

        {/* 3. HÁBITOS */}
        {activeSection === 'habits' && (
          <div className="space-y-6 animate-fade-in">
            <HabitStreaks habits={habits} />
            <HabitHeatmap habits={habits} />
          </div>
        )}

        {/* 4. SAÚDE */}
        {activeSection === 'health' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MoodEvolution />
              <HydrationConsistency />
            </div>
          </div>
        )}

        {/* 5. MENTE (NOVO) */}
        {activeSection === 'mind' && (
          <div className="space-y-6 animate-fade-in">
            <MindEvolution />
          </div>
        )}
      </div>
    </div>
  )
}
