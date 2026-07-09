import { useAppStore } from '@/stores/useAppStore'
import { HabitHeatmap } from '@/components/analytics/habit-heatmap'
import { TaskDistribution } from '@/components/analytics/task-distribution'
import { TimeDistribution } from '@/components/analytics/time-distribution'
import { HabitStreaks } from '@/components/analytics/habit-streaks'
import { MoodEvolution } from '@/components/analytics/mood-evolution'
import { HydrationConsistency } from '@/components/analytics/hydration-consistency'
import { OverviewCards } from '@/components/analytics/overview-cards'
import { WeeklyComparisonChart } from '@/components/analytics/weekly-comparison-chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Lightbulb } from 'lucide-react'

const TAB_CONFIG = [
  { value: 'overview', label: 'Visão Geral', emoji: '📊' },
  { value: 'productivity', label: 'Produtividade', emoji: '⚡' },
  { value: 'habits', label: 'Hábitos', emoji: '🔄' },
  { value: 'health', label: 'Saúde', emoji: '❤️' },
]

export default function Analytics() {
  const { tasks, habits } = useAppStore()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <header>
        <h2 className="text-3xl font-bold">Sua Evolução</h2>
        <p className="text-muted-foreground mt-1">Acompanhe seu progresso e mantenha o ritmo.</p>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full justify-start gap-2 bg-transparent overflow-x-auto rounded-3xl p-2 h-auto">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-2xl border-2 border-b-4 border-muted bg-muted/50 px-4 py-2.5 text-sm font-bold transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary-foreground/20 data-[state=active]:border-b-2 data-[state=active]:translate-y-[2px] whitespace-nowrap"
            >
              <span className="mr-1.5">{tab.emoji}</span>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <OverviewCards tasks={tasks} habits={habits} />
          <WeeklyComparisonChart tasks={tasks} habits={habits} />
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6 mt-4">
          <div className="bg-blue-400 border-b-4 border-blue-600 text-blue-950 rounded-3xl p-5 shadow-sm flex items-center gap-3">
            <Lightbulb className="w-6 h-6 shrink-0" />
            <p className="font-bold text-sm">As tarefas de Alta Energia são o teu forte!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TaskDistribution tasks={tasks} />
            <TimeDistribution tasks={tasks} />
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-6 mt-4">
          <HabitStreaks habits={habits} />
          <HabitHeatmap habits={habits} />
        </TabsContent>

        <TabsContent value="health" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoodEvolution />
            <HydrationConsistency />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
