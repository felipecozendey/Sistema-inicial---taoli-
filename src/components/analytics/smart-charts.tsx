import { useMemo } from 'react'
import { Task, Habit } from '@/stores/useAppStore'
import { DailyFocusStats, FocusHistoryMap } from '@/components/focus-radar/focus-radar-provider'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { CheckCircle2, Flame, Radio, TrendingUp, Sparkles } from 'lucide-react'

interface SmartChartsProps {
  tasks: Task[]
  habits: Habit[]
  focusHistory: FocusHistoryMap
  todayStats?: DailyFocusStats
  todayStr: string
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function SmartCharts({
  tasks,
  habits,
  focusHistory,
  todayStats,
  todayStr,
}: SmartChartsProps) {
  // 1. Mini gráfico de tarefas concluídas nos últimos 7 dias
  const completedTasksTrend = useMemo(() => {
    const list: { day: string; count: number; date: string }[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = tasks.filter((t) => t.completed && t.dueDate === dateStr).length
      list.push({
        day: DAY_LABELS[d.getDay()],
        count,
        date: dateStr,
      })
    }
    return list
  }, [tasks])

  // 2. Mini gráfico de minutos de foco por dia na semana
  const focusTrend = useMemo(() => {
    const list: { day: string; minutes: number; date: string }[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      let minutes = focusHistory[dateStr]?.focusMinutes || 0
      if (dateStr === todayStr && todayStats && todayStats.date === todayStr) {
        minutes = Math.max(minutes, todayStats.focusMinutes)
      }
      list.push({
        day: DAY_LABELS[d.getDay()],
        minutes,
        date: dateStr,
      })
    }
    return list
  }, [focusHistory, todayStats, todayStr])

  // 3. Comparativo "Hoje vs Média dos últimos 7 dias"
  const comparison = useMemo(() => {
    // Tarefas hoje
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr && t.completed).length

    // Média de tarefas dos últimos 7 dias anteriores
    let pastTasksSum = 0
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      pastTasksSum += tasks.filter((t) => t.completed && t.dueDate === dateStr).length
    }
    const avgTasks = Math.round((pastTasksSum / 7) * 10) / 10

    // Hábitos hoje
    const todayHabits = habits.filter((h) => h.completions.includes(todayStr)).length
    let pastHabitsSum = 0
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      pastHabitsSum += habits.filter((h) => h.completions.includes(dateStr)).length
    }
    const avgHabits = Math.round((pastHabitsSum / 7) * 10) / 10

    // Foco hoje
    let todayFocusMin = todayStats?.focusMinutes || 0
    let pastFocusSum = 0
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      pastFocusSum += focusHistory[dateStr]?.focusMinutes || 0
    }
    const avgFocusMin = Math.round((pastFocusSum / 7) * 10) / 10

    return {
      tasks: { today: todayTasks, avg: avgTasks },
      habits: { today: todayHabits, avg: avgHabits },
      focus: { today: todayFocusMin, avg: avgFocusMin },
    }
  }, [tasks, habits, focusHistory, todayStats, todayStr])

  return (
    <div className="space-y-4">
      {/* Tira com 3 cards comparativos: Hoje vs Média 7d */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Tarefas */}
        <div className="bg-card border-2 border-b-4 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1CB0F6]" />
              Tarefas Concluídas
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1CB0F6]/15 text-[#1CB0F6]">
              Hoje
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{comparison.tasks.today}</span>
            <span className="text-xs font-bold text-muted-foreground">
              vs {comparison.tasks.avg} média/dia
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
            {comparison.tasks.today >= comparison.tasks.avg
              ? '✨ Acima da sua média recente!'
              : 'Mantenha o foco para bater sua média.'}
          </div>
        </div>

        {/* Card 2: Hábitos */}
        <div className="bg-card border-2 border-b-4 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#FFC800]" />
              Hábitos Feitos
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFC800]/20 text-[#D9A700]">
              Hoje
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{comparison.habits.today}</span>
            <span className="text-xs font-bold text-muted-foreground">
              vs {comparison.habits.avg} média/dia
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
            {comparison.habits.today >= comparison.habits.avg
              ? '🔥 Excelente consistência de hábitos!'
              : 'Ainda dá tempo de marcar seus hábitos hoje.'}
          </div>
        </div>

        {/* Card 3: Foco */}
        <div className="bg-card border-2 border-b-4 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#58CC02]" />
              Minutos de Foco
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#58CC02]/15 text-[#58CC02]">
              Hoje
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#58CC02]">{comparison.focus.today} min</span>
            <span className="text-xs font-bold text-muted-foreground">
              vs {comparison.focus.avg}m média/dia
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
            {comparison.focus.today >= comparison.focus.avg && comparison.focus.today > 0
              ? '⚡ Superou seu ritmo médio de foco!'
              : 'Abra um timer de foco e acelere.'}
          </div>
        </div>
      </div>

      {/* Grid com 2 mini gráficos compactos lado a lado (responsivo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mini Gráfico 1: Linha/Área de Tarefas Concluídas nos 7 dias */}
        <div className="bg-card border-2 border-b-4 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#1CB0F6]" />
              Ritmo de Tarefas (7 dias)
            </h4>
            <span className="text-[10px] font-extrabold text-[#1CB0F6] bg-[#1CB0F6]/10 px-2 py-0.5 rounded-full">
              Últimos 7d
            </span>
          </div>

          <div className="h-36 w-full pt-1">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={completedTasksTrend}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="taskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1CB0F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1CB0F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      const item = completedTasksTrend.find((d) => d.day === label)
                      return (
                        <div className="bg-popover border text-popover-foreground rounded-2xl p-2.5 shadow-md text-xs space-y-0.5">
                          <div className="font-extrabold text-foreground">{item?.date}</div>
                          <div className="text-muted-foreground font-semibold">
                            Tarefas concluídas:{' '}
                            <strong className="text-[#1CB0F6] font-black">{item?.count}</strong>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#1CB0F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#taskAreaGrad)"
                    dot={{ fill: '#1CB0F6', r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Mini Gráfico 2: Mini Barras de Minutos de Foco por Dia na Semana */}
        <div className="bg-card border-2 border-b-4 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#58CC02]" />
              Foco por Dia (7 dias)
            </h4>
            <span className="text-[10px] font-extrabold text-[#58CC02] bg-[#58CC02]/10 px-2 py-0.5 rounded-full">
              Minutos
            </span>
          </div>

          <div className="h-36 w-full pt-1">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      const item = focusTrend.find((d) => d.day === label)
                      return (
                        <div className="bg-popover border text-popover-foreground rounded-2xl p-2.5 shadow-md text-xs space-y-0.5">
                          <div className="font-extrabold text-foreground">{item?.date}</div>
                          <div className="text-muted-foreground font-semibold">
                            Foco total:{' '}
                            <strong className="text-[#58CC02] font-black">
                              {item?.minutes} min
                            </strong>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="minutes" fill="#58CC02" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
