import { useAppStore } from '@/stores/useAppStore'
import { CircularProgress } from '@/components/ui/circular-progress'
import { GameProgress } from '@/components/ui/game-progress'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskForm } from '@/components/tasks/task-form'
import { HabitCard } from '@/components/habits/habit-card'
import { HabitForm } from '@/components/habits/habit-form'
import { HealthSummary } from '@/components/health/health-summary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, CheckCircle2 } from 'lucide-react'
import { getTodayHabits, calculateStreak } from '@/lib/habit-utils'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user, tasks, habits } = useAppStore()

  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter((t: any) => t.dueDate === today)
  const completedTasks = todayTasks.filter((t: any) => t.completed)
  const progressPercent =
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
        <div className="hidden sm:block">
          <TaskForm />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[#374151] bg-[#FFC800] px-3 py-1 rounded-full text-sm font-extrabold shadow-sm">
            <Flame className="w-4 h-4" /> {maxStreak} dias
          </div>
          <CircularProgress value={progressPercent} size={160} strokeWidth={14}>
            <span className="text-4xl font-extrabold tracking-tighter">{progressPercent}%</span>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Concluído
            </span>
          </CircularProgress>
          <div className="w-full mt-6 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[#58CC02] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tarefas
                </span>
                <span className="text-muted-foreground">
                  {completedTasks.length}/{todayTasks.length}
                </span>
              </div>
              <GameProgress value={progressPercent} variant="success" height="md" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[#FFC800]">Hábitos</span>
                <span className="text-muted-foreground">
                  {completedHabits.length}/{todayHabits.length}
                </span>
              </div>
              <GameProgress value={habitPercent} variant="gold" height="md" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#58CC02]/15 to-[#1CB0F6]/15 border-transparent rounded-3xl p-8 flex flex-col justify-center text-center">
          <p className="text-xl md:text-2xl font-bold leading-relaxed text-foreground/80 italic">
            "{quote}"
          </p>
        </div>
      </div>

      <HealthSummary />

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto rounded-2xl p-1.5">
          <TabsTrigger
            value="tasks"
            className="rounded-xl font-bold data-[state=active]:bg-[#58CC02] data-[state=active]:text-white transition-all"
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
              <div className="mt-4 sm:hidden">
                <TaskForm />
              </div>
            </div>
          ) : (
            todayTasks.slice(0, 4).map((task: any) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="habits" className="space-y-3 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-extrabold">Hábitos de Hoje</h2>
            <HabitForm />
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
