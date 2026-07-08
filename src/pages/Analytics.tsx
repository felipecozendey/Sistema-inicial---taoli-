import { useAppStore } from '@/stores/useAppStore'
import { HabitHeatmap } from '@/components/analytics/habit-heatmap'
import { TaskDistribution } from '@/components/analytics/task-distribution'
import { TimeDistribution } from '@/components/analytics/time-distribution'
import { HabitStreaks } from '@/components/analytics/habit-streaks'

export default function Analytics() {
  const { tasks, habits } = useAppStore()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <header>
        <h2 className="text-3xl font-bold">Sua Evolução</h2>
        <p className="text-muted-foreground mt-1">Acompanhe seu progresso e mantenha o ritmo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskDistribution tasks={tasks} />
        <HabitStreaks habits={habits} />
      </div>

      <TimeDistribution tasks={tasks} />

      <HabitHeatmap habits={habits} />
    </div>
  )
}
