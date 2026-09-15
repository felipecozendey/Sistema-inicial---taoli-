import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useFocusRadar } from '@/components/focus-radar/focus-radar-provider'
import { CircularProgress } from '@/components/ui/circular-progress'
import { TaskCard } from '@/components/tasks/task-card'
import { UnifiedCreateButton } from '@/components/unified-create-button'
import { HabitCard } from '@/components/habits/habit-card'
import { HealthSummary } from '@/components/health/health-summary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Clock, Radio, Sparkles } from 'lucide-react'
import { getTodayHabits, calculateStreak } from '@/lib/habit-utils'
import { EvolutionTab } from '@/components/analytics/evolution-tab'
import { FocusTab } from '@/components/focus-radar/focus-tab'
import { UnifiedReportModal } from '@/components/analytics/unified-report-modal'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user, tasks, habits } = useAppStore()
  const { todayStats, adaFocus, isRunning } = useFocusRadar()

  // Aba principal da Dashboard: 'hoje' | 'evolucao' | 'foco'
  const [mainTab, setMainTab] = useState<'hoje' | 'evolucao' | 'foco'>('hoje')

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

  // Condição para tira compacta "Resumo do dia": se houver dados de foco hoje
  const hasFocusDataToday =
    (todayStats && (todayStats.focusMinutes > 0 || todayStats.sessions > 0)) || isRunning

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header Duolingo compacto */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Bom dia, {user.name}
          </h1>
          <p className="text-muted-foreground mt-0.5 font-bold text-xs sm:text-sm">
            Pronto para evoluir hoje?
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Atalho de relatório no header */}
          <UnifiedReportModal />
          <UnifiedCreateButton />
        </div>
      </header>

      {/* Segmented Control Duolingo Unificado (Hoje · Evolução · Foco) rolável em 360px */}
      <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        <div className="inline-flex items-center gap-2 p-1.5 rounded-3xl bg-muted/60 border-2 border-border min-w-full sm:min-w-0">
          <button
            type="button"
            onClick={() => setMainTab('hoje')}
            className={cn(
              'flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer border-b-4',
              mainTab === 'hoje'
                ? 'bg-[#58CC02] text-white border-[#46A302] shadow-sm translate-y-[-1px]'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground active:border-b-0 active:translate-y-1',
            )}
          >
            <span>☀️</span>
            <span>Hoje</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('evolucao')}
            className={cn(
              'flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer border-b-4',
              mainTab === 'evolucao'
                ? 'bg-[#1CB0F6] text-white border-[#1899D6] shadow-sm translate-y-[-1px]'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground active:border-b-0 active:translate-y-1',
            )}
          >
            <span>📈</span>
            <span>Evolução</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('foco')}
            className={cn(
              'flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer border-b-4',
              mainTab === 'foco'
                ? 'bg-[#FFC800] text-black border-[#E5B400] shadow-sm translate-y-[-1px]'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground active:border-b-0 active:translate-y-1',
            )}
          >
            <span>🍅</span>
            <span>Foco</span>
            {adaFocus.enabled && (
              <span className="w-2 h-2 rounded-full bg-[#58CC02] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: HOJE (Dashboard original preservada) */}
      {/* ======================================================== */}
      {mainTab === 'hoje' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tira compacta "Resumo do dia" apenas se houver dados de foco hoje */}
          {hasFocusDataToday && (
            <div className="bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/30 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs font-bold">
              <div className="flex items-center gap-2 text-foreground">
                <span className="text-base">🍅</span>
                <span>
                  Resumo de foco hoje:{' '}
                  <strong className="text-[#58CC02] font-black">
                    {todayStats.focusMinutes} min
                  </strong>{' '}
                  em {todayStats.sessions} {todayStats.sessions === 1 ? 'sessão' : 'sessões'}
                  {isRunning && ' • Timer ativo agora'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMainTab('foco')}
                className="text-[#58CC02] hover:underline font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Ver Foco <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Anéis de progresso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border-2 border-b-4 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm">
              <h3 className="text-lg font-extrabold mb-4 text-[#1CB0F6]">Hábitos e Tarefas</h3>
              <div className="[--ring:199_92%_54%] [--primary:199_92%_54%]">
                <CircularProgress value={taskPercent} size={140} strokeWidth={12}>
                  <span className="text-3xl font-extrabold tracking-tighter">{taskPercent}%</span>
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                    {completedTasks.length}/{todayTasks.length}
                  </span>
                </CircularProgress>
              </div>
            </div>

            <div className="bg-card border-2 border-b-4 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm">
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

          {/* Chip de Sequência */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-[#374151] bg-[#FFC800] px-4 py-2 rounded-full text-sm font-extrabold shadow-sm border-b-2 border-[#D9A700]">
              <Flame className="w-4 h-4 fill-[#374151]" /> Sequência: {maxStreak} dias
            </div>
          </div>

          {/* Frase motivacional diária */}
          <div className="bg-gradient-to-br from-[#58CC02]/15 to-[#1CB0F6]/15 border-2 border-transparent rounded-3xl p-5 flex flex-col justify-center text-center">
            <p className="text-base sm:text-lg font-bold leading-relaxed text-foreground/80 italic">
              "{quote}"
            </p>
          </div>

          {/* HealthSummary */}
          <HealthSummary />

          {/* Tabs internas de hoje: Tarefas e Hábitos */}
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto rounded-2xl p-1.5 border">
              <TabsTrigger
                value="tasks"
                className="rounded-xl font-bold data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white transition-all text-xs sm:text-sm"
              >
                Hábitos e Tarefas Diárias
              </TabsTrigger>
              <TabsTrigger
                value="habits"
                className="rounded-xl font-bold data-[state=active]:bg-[#FFC800] data-[state=active]:text-[#374151] transition-all text-xs sm:text-sm"
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
                <div className="text-center py-12 bg-card rounded-3xl border-2 border-dashed text-muted-foreground font-semibold">
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
                <div className="text-center py-12 bg-card rounded-3xl border-2 border-dashed text-muted-foreground font-semibold">
                  <p>Nenhum hábito para hoje.</p>
                </div>
              ) : (
                todayHabits.map((habit: any) => <HabitCard key={habit.id} habit={habit} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: EVOLUÇÃO (Absorve os relatórios anteriores + Mente) */}
      {/* ======================================================== */}
      {mainTab === 'evolucao' && <EvolutionTab />}

      {/* ======================================================== */}
      {/* ABA 3: FOCO (Histórico de 7 dias, ranking e atalhos) */}
      {/* ======================================================== */}
      {mainTab === 'foco' && <FocusTab />}
    </div>
  )
}
