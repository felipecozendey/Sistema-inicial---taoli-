import { useAppStore } from '@/stores/main'
import { CircularProgress } from '@/components/ui/circular-progress'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskForm } from '@/components/tasks/task-form'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'

export default function Dashboard() {
  const { user, tasks } = useAppStore()

  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter((t) => t.date === today)
  const completedTasks = todayTasks.filter((t) => t.completed)

  const progressPercent =
    todayTasks.length === 0 ? 0 : Math.round((completedTasks.length / todayTasks.length) * 100)

  // Rotating quotes (mock based on day of month)
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
          <h1 className="text-3xl font-bold tracking-tight">Bom dia, {user.name}</h1>
          <p className="text-muted-foreground mt-1">Pronto para evoluir hoje?</p>
        </div>
        <div className="hidden sm:block">
          <TaskForm />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-1 text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full text-sm font-semibold">
            <Flame className="w-4 h-4" /> 5 dias
          </div>
          <CircularProgress value={progressPercent} size={160} strokeWidth={14}>
            <span className="text-4xl font-bold tracking-tighter">{progressPercent}%</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
              Concluído
            </span>
          </CircularProgress>
          <p className="mt-6 text-center font-medium text-muted-foreground">
            {completedTasks.length} de {todayTasks.length} tarefas hoje
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border-transparent rounded-3xl p-8 flex flex-col justify-center text-center">
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground/80 italic">
            "{quote}"
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Foco de Hoje</h2>
          <Link
            to="/tasks"
            className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
          >
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-3xl border border-dashed text-muted-foreground">
            <p>Seu dia está livre.</p>
            <div className="mt-4 sm:hidden">
              <TaskForm />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.slice(0, 4).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
