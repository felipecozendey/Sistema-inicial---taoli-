import { useState, useMemo } from 'react'
import { useFocusRadar } from '@/components/focus-radar/focus-radar-provider'
import { useAppStore } from '@/stores/useAppStore'
import { FocusStudio } from '@/components/focus-radar/focus-studio'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import {
  Clock,
  Flame,
  Radio,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Play,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function FocusTab() {
  const {
    todayStats,
    focusHistory,
    taskSessionCounts,
    adaFocus,
    adaFocusActive,
    isRunning,
    timeRemaining,
  } = useFocusRadar()

  const { tasks } = useAppStore()
  const [studioOpen, setStudioOpen] = useState(false)
  const [studioTab, setStudioTab] = useState<'timer' | 'ada' | 'settings'>('timer')

  // Histórico dos últimos 7 dias (terminando hoje)
  const last7DaysData = useMemo(() => {
    const list: {
      date: string
      dayLabel: string
      focusMinutes: number
      sessions: number
      isToday: boolean
    }[] = []

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = DAY_LABELS[d.getDay()]

      // Histórico base
      let hist = focusHistory[dateStr] || { sessions: 0, focusMinutes: 0 }

      // Se for hoje, mesclar com o todayStats em tempo real
      if (dateStr === todayStr && todayStats && todayStats.date === todayStr) {
        hist = {
          sessions: Math.max(todayStats.sessions, hist.sessions),
          focusMinutes: Math.max(todayStats.focusMinutes, hist.focusMinutes),
        }
      }

      list.push({
        date: dateStr,
        dayLabel,
        focusMinutes: hist.focusMinutes,
        sessions: hist.sessions,
        isToday: dateStr === todayStr,
      })
    }
    return list
  }, [focusHistory, todayStats])

  // Cards resumo
  const summary = useMemo(() => {
    const totalMinutes = last7DaysData.reduce((acc, cur) => acc + cur.focusMinutes, 0)
    const totalSessions = last7DaysData.reduce((acc, cur) => acc + cur.sessions, 0)
    const avgDaily = Math.round(totalMinutes / 7)

    let best = { dayLabel: '-', minutes: 0 }
    last7DaysData.forEach((d) => {
      if (d.focusMinutes > best.minutes) {
        best = { dayLabel: d.dayLabel, minutes: d.focusMinutes }
      }
    })

    return { totalMinutes, totalSessions, avgDaily, best }
  }, [last7DaysData])

  // Ranking das 3 tarefas mais focadas da semana (a partir de vt_focus_task_counts)
  const topTasks = useMemo(() => {
    const entries = Object.entries(taskSessionCounts || {})
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    if (entries.length === 0) return []

    return entries
      .map(([taskId, count]) => {
        const task = tasks.find((t) => t.id === taskId)
        return {
          id: taskId,
          title: task ? task.title : 'Tarefa arquivada',
          completed: task?.completed || false,
          sessions: count,
        }
      })
      .filter((t) => Boolean(t.title))
  }, [taskSessionCounts, tasks])

  const openStudio = (tab: 'timer' | 'ada' | 'settings' = 'timer') => {
    setStudioTab(tab)
    setStudioOpen(true)
  }

  const formatMinToHours = (min: number) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Ada Focus se ativo */}
      {adaFocus.enabled && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => openStudio('ada')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openStudio('ada')
          }}
          className="bg-emerald-500/10 border-2 border-b-4 border-[#58CC02]/40 hover:border-[#58CC02] text-foreground rounded-3xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-all active:translate-y-[2px] active:border-b-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#58CC02] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase text-[#46A302] dark:text-[#58CC02] tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#58CC02] inline-block" />
                Ada Focus ativo
              </div>
              <p className="text-sm font-extrabold text-foreground truncate">
                Lembrete a cada {adaFocus.intervalMinutes} minutos: "{adaFocus.message}"
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#58CC02] shrink-0 flex items-center gap-1 hover:underline">
            Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* Card "Hoje" em destaque */}
      <div className="bg-card border-2 border-b-4 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-14 h-14 rounded-3xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0 text-3xl font-black">
            🍅
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
              Foco Hoje ({todayStats.date})
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
              <span>{todayStats.focusMinutes} min</span>
              <span className="text-sm font-bold text-muted-foreground">
                • {todayStats.sessions} {todayStats.sessions === 1 ? 'sessão' : 'sessões'}
              </span>
            </div>
            {isRunning && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#58CC02] animate-pulse mt-0.5">
                ● Timer Pomodoro em execução ({Math.floor(timeRemaining / 60)}:
                {String(timeRemaining % 60).padStart(2, '0')})
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => openStudio('timer')}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#58CC02] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Abrir Estúdio de Foco</span>
        </button>
      </div>

      {/* Cards-resumo da semana */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border-2 rounded-3xl p-4 text-center space-y-1 shadow-sm">
          <span className="text-2xl">⏳</span>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {formatMinToHours(summary.totalMinutes)}
          </div>
          <div className="text-[11px] font-bold text-muted-foreground uppercase">
            Total da Semana
          </div>
        </div>

        <div className="bg-card border-2 rounded-3xl p-4 text-center space-y-1 shadow-sm">
          <span className="text-2xl">🍅</span>
          <div className="text-xl sm:text-2xl font-black text-[#58CC02]">
            {summary.totalSessions}
          </div>
          <div className="text-[11px] font-bold text-muted-foreground uppercase">
            Sessões Pomodoro
          </div>
        </div>

        <div className="bg-card border-2 rounded-3xl p-4 text-center space-y-1 shadow-sm">
          <span className="text-2xl">⚡</span>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {summary.avgDaily} min
          </div>
          <div className="text-[11px] font-bold text-muted-foreground uppercase">Média Diária</div>
        </div>

        <div className="bg-card border-2 rounded-3xl p-4 text-center space-y-1 shadow-sm">
          <span className="text-2xl">🏆</span>
          <div className="text-base sm:text-lg font-black text-[#FFC800] truncate">
            {summary.best.dayLabel} ({summary.best.minutes}m)
          </div>
          <div className="text-[11px] font-bold text-muted-foreground uppercase">Melhor Dia</div>
        </div>
      </div>

      {/* Gráfico de BARRAS dos últimos 7 dias (minutos focados por dia, verde #58CC02) */}
      <div className="bg-card rounded-3xl p-5 sm:p-6 shadow-sm border-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#58CC02]" />
              Minutos de Foco (Últimos 7 dias)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tempo investido em blocos produtivos a cada dia.
            </p>
          </div>
          <span className="text-xs font-black text-[#58CC02] bg-[#58CC02]/10 px-3 py-1 rounded-full">
            7 Dias
          </span>
        </div>

        <div className="h-60 w-full pt-3">
          <ChartContainer config={{}} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={(v) => `${v}m`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null
                    const item = last7DaysData.find((d) => d.dayLabel === label)
                    return (
                      <div className="bg-popover border text-popover-foreground rounded-2xl p-3 shadow-md text-xs space-y-1">
                        <div className="font-extrabold text-foreground pb-1 border-b">
                          {item?.date} ({label})
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-muted-foreground">Minutos:</span>
                          <span className="font-black text-[#58CC02]">
                            {item?.focusMinutes} min
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-muted-foreground">Sessões:</span>
                          <span className="font-black">{item?.sessions} 🍅</span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="focusMinutes" name="Minutos" fill="#58CC02" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Sessões por tarefa (ranking simples das 3 tarefas mais focadas da semana) */}
      {topTasks.length > 0 && (
        <div className="bg-card rounded-3xl p-5 sm:p-6 shadow-sm border-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#58CC02]" />
              Tarefas Mais Focadas
            </h3>
            <span className="text-[11px] font-bold text-muted-foreground">Top 3</span>
          </div>

          <div className="space-y-2">
            {topTasks.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-muted/40 p-3 rounded-2xl border"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#58CC02]/20 text-[#58CC02] font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-semibold truncate',
                      t.completed && 'line-through text-muted-foreground',
                    )}
                  >
                    {t.title}
                  </span>
                </div>
                <span className="text-xs font-black text-[#58CC02] bg-[#58CC02]/10 px-2.5 py-1 rounded-xl shrink-0">
                  🍅 {t.sessions} {t.sessions === 1 ? 'sessão' : 'sessões'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FocusStudio Modal */}
      <FocusStudio open={studioOpen} onClose={() => setStudioOpen(false)} initialTab={studioTab} />
    </div>
  )
}
