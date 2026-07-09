import { useAppStore } from '@/stores/useAppStore'
import { CircularProgress } from '@/components/ui/circular-progress'
import { TaskCard } from '@/components/tasks/task-card'
import { UnifiedCreateButton } from '@/components/unified-create-button'
import { HabitCard } from '@/components/habits/habit-card'
import { HealthSummary } from '@/components/health/health-summary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'
import { getTodayHabits, calculateStreak } from '@/lib/habit-utils'

export default function Dashboard() {
  const { user, tasks, habits } = useAppStore()

  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter((t: any) => t.dueDate === today)
  const completedTasks = todayTasks.filter((t: any) => t.completed)
  const taskPercent =
    todayTasks.length === 0 ? 0 : Math.round((completedTasks.length / todayTasks.length) * 100)
  const todayHabits = getTodayHabits(habits)
  const completedHabits = todayHabits.filter((h: any) => h.completions.includes(today))
  const habitPercent =
    todayHabits.length === 0 ? 0 : Math.round((completedHabits.length / todayHabits.length) * 100)
  const maxStreak = Math.max(0, ...habits.map((h: any) => calculateStreak(h.completions)))

  const quotes = [
    'Pequenos passos todos os dias.',
    'O progresso é mais importante que a perfeição.',
    'Respire fundo e foque no agora.',
    'Construa a vida que você deseja, um hábito de cada vez.',
  ]
  const quote = quotes[new Date().getDate() % quotes.length]

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Bom dia, {user.name}</h1>
          <p className="text-muted-foreground mt-1 font-semibold">Pronto para evoluir hoje?</p>
        </div>
        <UnifiedCreateButton />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm">
          <h3 className="text-lg font-extrabold mb-4 text-[#1CB0F6]">Tarefas</h3>
          <div className="[--ring:199_92%_54%] [--primary:199_92%_54%]">
            <CircularProgress value={taskPercent} size={140} strokeWidth={12}>
              <span className="text-3xl font-extrabold tracking-tighter">{taskPercent}%</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                {completedTasks.length}/{todayTasks.length}
              </span>
            </CircularProgress>
          </div>
        </div>
        <div className="bg-card border rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm">
          <h3 className="text-lg font-extrabold mb-4 text-[#FFC800]">Hábitos</h3>
          <div className="[--ring:47_100%_50%] [--primary:47_100%_50%]">
            <CircularProgress value={habitPercent} size={140} strokeWidth={12}>
              <span className="text-3xl font-extrabold tracking-tighter">{habitPercent}%</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                {completedHabits.length}/{todayHabits.length}
              </span>
            </CircularProgress>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-1 text-[#374151] bg-[#FFC800] px-4 py-2 rounded-full text-sm font-extrabold shadow-sm">
          <Flame className="w-4 h-4" /> Sequência: {maxStreak} dias
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#58CC02]/15 to-[#1CB0F6]/15 border-transparent rounded-3xl p-6 flex flex-col justify-center text-center">
        <p className="text-lg md:text-xl font-bold leading-relaxed text-foreground/80 italic">
          "{quote}"
        </p>
      </div>

      <HealthSummary />

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto rounded-2xl p-1.5">
          <TabsTrigger
            value="tasks"
            className="rounded-xl font-bold data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white transition-all"
          >
            Tarefas Diárias
          </TabsTrigger>
          <TabsTrigger
            value="habits"
            className="rounded-xl font-bold data-[state=active]:bg-[#FFC800] data-[state=active]:text-[#374151] transition-all"
          >
            Hábitos do Dia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-3 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-extrabold">Foco de Hoje</h2>
            <Link
              to="/tasks"
              className="text-sm font-bold text-[#1CB0F6] flex items-center gap-1 hover:underline"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {todayTasks.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-3xl border border-dashed text-muted-foreground font-semibold">
              <p>Seu dia está livre.</p>
            </div>
          ) : (
            todayTasks.slice(0, 4).map((task: any) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="habits" className="space-y-3 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-extrabold">Hábitos de Hoje</h2>
            <Link
              to="/tasks"
              className="text-sm font-bold text-[#FFC800] flex items-center gap-1 hover:underline"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {todayHabits.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-3xl border border-dashed text-muted-foreground font-semibold">
              <p>Nenhum hábito para hoje.</p>
            </div>
          ) : (
            todayHabits.map((habit: any) => <HabitCard key={habit.id} habit={habit} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
