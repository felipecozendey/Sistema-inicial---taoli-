import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useFocusRadar } from '@/components/focus-radar/focus-radar-provider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { safeFormatDate } from '@/lib/date-utils'
import {
  FileText,
  Printer,
  CheckSquare,
  HeartPulse,
  Brain,
  Clock,
  X,
  ChevronRight,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

type PeriodOption = '7d' | '30d' | 'month'

interface ReportConfig {
  period: PeriodOption
  sections: {
    tasksAndHabits: boolean
    health: boolean
    mind: boolean
    focus: boolean
  }
}

export function UnifiedReportModal({
  trigger,
  defaultOpen = false,
  onOpenChange,
}: {
  trigger?: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(defaultOpen)

  const [config, setConfig] = useState<ReportConfig>({
    period: '7d',
    sections: {
      tasksAndHabits: true,
      health: true,
      mind: true,
      focus: true,
    },
  })

  const { user, tasks, habits, getHealthRecord, mentalHealthLogs } = useAppStore()
  const { focusHistory, todayStats } = useFocusRadar()

  // Calcular datas do período
  const periodInfo = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    let startDate = new Date(today)

    if (config.period === '7d') {
      startDate.setDate(startDate.getDate() - 6)
    } else if (config.period === '30d') {
      startDate.setDate(startDate.getDate() - 29)
    } else if (config.period === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }

    const startStr = startDate.toISOString().split('T')[0]
    return {
      startStr,
      endStr: todayStr,
      label:
        config.period === '7d'
          ? 'Últimos 7 dias'
          : config.period === '30d'
            ? 'Últimos 30 dias'
            : 'Este mês',
    }
  }, [config.period])

  // Gerar dias do período
  const daysInPeriod = useMemo(() => {
    const list: string[] = []
    const start = new Date(periodInfo.startStr + 'T00:00:00')
    const end = new Date(periodInfo.endStr + 'T00:00:00')
    const curr = new Date(start)

    while (curr <= end) {
      list.push(curr.toISOString().split('T')[0])
      curr.setDate(curr.getDate() + 1)
    }
    return list
  }, [periodInfo])

  // Dados de Tarefas e Hábitos
  const taskHabitStats = useMemo(() => {
    const filteredTasks = tasks.filter(
      (t) => t.dueDate >= periodInfo.startStr && t.dueDate <= periodInfo.endStr,
    )
    const completedTasks = filteredTasks.filter((t) => t.completed)

    let totalHabitCompletions = 0
    habits.forEach((h) => {
      h.completions.forEach((d) => {
        if (d >= periodInfo.startStr && d <= periodInfo.endStr) {
          totalHabitCompletions++
        }
      })
    })

    const chart = daysInPeriod.map((day) => {
      const parts = day.split('-')
      const short = `${parts[2]}/${parts[1]}`
      const tDone = tasks.filter((t) => t.completed && t.dueDate === day).length
      const hDone = habits.filter((h) => h.completions.includes(day)).length
      return { day: short, tarefas: tDone, habitos: hDone }
    })

    return {
      totalTasks: filteredTasks.length,
      completedTasks: completedTasks.length,
      taskRate:
        filteredTasks.length > 0
          ? Math.round((completedTasks.length / filteredTasks.length) * 100)
          : 0,
      totalHabitCompletions,
      chart,
    }
  }, [tasks, habits, periodInfo, daysInPeriod])

  // Dados de Saúde (Humor e Hidratação)
  const healthStats = useMemo(() => {
    let totalWater = 0
    let validMoodDays = 0
    let sumMood = 0

    const chart = daysInPeriod.map((day) => {
      const parts = day.split('-')
      const short = `${parts[2]}/${parts[1]}`
      const record = getHealthRecord(day)
      const water = record?.hydration || 0
      const mood = record?.mood?.level || 0

      totalWater += water
      if (mood > 0) {
        sumMood += mood
        validMoodDays++
      }

      return { day: short, agua: water, humor: mood }
    })

    const avgWater = Math.round(totalWater / Math.max(1, daysInPeriod.length))
    const avgMood = validMoodDays > 0 ? (sumMood / validMoodDays).toFixed(1) : '-'

    return { totalWater, avgWater, avgMood, chart }
  }, [getHealthRecord, daysInPeriod])

  // Dados da Mente
  const mindStats = useMemo(() => {
    const filtered = (mentalHealthLogs || []).filter(
      (l) => l.date >= periodInfo.startStr && l.date <= periodInfo.endStr,
    )

    const map = new Map<string, (typeof mentalHealthLogs)[0]>()
    filtered.forEach((l) => {
      const d = (l.date || '').split('T')[0]
      if (d && !map.has(d)) map.set(d, l)
    })
    const unique = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))

    const count = unique.length
    const calcAvg = (getter: (l: (typeof mentalHealthLogs)[0]) => number) =>
      count > 0 ? (unique.reduce((s, l) => s + (getter(l) || 0), 0) / count).toFixed(1) : '-'

    const chart = unique.map((l) => {
      const parts = l.date.split('-')
      return {
        day: `${parts[2]}/${parts[1]}`,
        humor: l.mood,
        estresse: l.stressLevel,
        ansiedade: l.anxietyLevel,
        sono: l.sleepQuality,
      }
    })

    return {
      count,
      avgMood: calcAvg((l) => l.mood),
      avgStress: calcAvg((l) => l.stressLevel),
      avgAnxiety: calcAvg((l) => l.anxietyLevel),
      avgSleep: calcAvg((l) => l.sleepQuality),
      chart,
    }
  }, [mentalHealthLogs, periodInfo])

  // Dados de Foco
  const focusStats = useMemo(() => {
    const combinedHistory = { ...focusHistory }
    if (todayStats && todayStats.date) {
      combinedHistory[todayStats.date] = {
        sessions: Math.max(todayStats.sessions, combinedHistory[todayStats.date]?.sessions || 0),
        focusMinutes: Math.max(
          todayStats.focusMinutes,
          combinedHistory[todayStats.date]?.focusMinutes || 0,
        ),
      }
    }

    let totalMinutes = 0
    let totalSessions = 0
    let bestDay = { day: '-', minutes: 0 }

    const chart = daysInPeriod.map((day) => {
      const parts = day.split('-')
      const short = `${parts[2]}/${parts[1]}`
      const stat = combinedHistory[day] || { sessions: 0, focusMinutes: 0 }
      totalMinutes += stat.focusMinutes
      totalSessions += stat.sessions
      if (stat.focusMinutes > bestDay.minutes) {
        bestDay = { day: short, minutes: stat.focusMinutes }
      }
      return { day: short, minutos: stat.focusMinutes, sessoes: stat.sessions }
    })

    const avgDailyMinutes = Math.round(totalMinutes / Math.max(1, daysInPeriod.length))

    return { totalMinutes, totalSessions, bestDay, avgDailyMinutes, chart }
  }, [focusHistory, todayStats, daysInPeriod])

  const handlePrint = () => {
    const oldTitle = document.title
    const today = new Date().toISOString().split('T')[0]
    document.title = `relatorio-${today}`
    window.print()
    setTimeout(() => {
      document.title = oldTitle
    }, 1000)
  }

  const openPreview = () => {
    setPopoverOpen(false)
    setModalOpen(true)
    onOpenChange?.(true)
  }

  return (
    <>
      {/* Popover acionador com opções de período e seções */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {trigger || (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-[#1CB0F6] text-white font-extrabold text-xs sm:text-sm border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Gerar Relatório</span>
            </button>
          )}
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-80 p-4 rounded-3xl border-2 border-border shadow-xl space-y-4"
        >
          <div>
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1CB0F6]" />
              Personalizar Relatório
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha o período e os módulos a incluir.
            </p>
          </div>

          {/* Período */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Período
            </Label>
            <div className="grid grid-cols-3 gap-1.5 bg-muted/60 p-1 rounded-2xl border">
              {(
                [
                  { id: '7d', label: '7 Dias' },
                  { id: '30d', label: '30 Dias' },
                  { id: 'month', label: 'Este Mês' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, period: opt.id }))}
                  className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all ${
                    config.period === opt.id
                      ? 'bg-[#1CB0F6] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seções (FINANÇAS NÃO EXISTE) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Seções a incluir
            </Label>
            <div className="space-y-2 bg-muted/30 p-2.5 rounded-2xl border">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sec-tasks"
                  checked={config.sections.tasksAndHabits}
                  onCheckedChange={(checked) =>
                    setConfig((p) => ({
                      ...p,
                      sections: { ...p.sections, tasksAndHabits: !!checked },
                    }))
                  }
                />
                <label
                  htmlFor="sec-tasks"
                  className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#58CC02]" />
                  <span>Tarefas e Hábitos</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="sec-health"
                  checked={config.sections.health}
                  onCheckedChange={(checked) =>
                    setConfig((p) => ({
                      ...p,
                      sections: { ...p.sections, health: !!checked },
                    }))
                  }
                />
                <label
                  htmlFor="sec-health"
                  className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-[#FF4B4B]" />
                  <span>Saúde (Hidratação & Humor)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="sec-mind"
                  checked={config.sections.mind}
                  onCheckedChange={(checked) =>
                    setConfig((p) => ({
                      ...p,
                      sections: { ...p.sections, mind: !!checked },
                    }))
                  }
                />
                <label
                  htmlFor="sec-mind"
                  className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5 text-[#CE82FF]" />
                  <span>Mente & Emoções</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="sec-focus"
                  checked={config.sections.focus}
                  onCheckedChange={(checked) =>
                    setConfig((p) => ({
                      ...p,
                      sections: { ...p.sections, focus: !!checked },
                    }))
                  }
                />
                <label
                  htmlFor="sec-focus"
                  className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-[#FFC800]" />
                  <span>Estúdio de Foco (Pomodoro)</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openPreview}
            className="w-full py-2.5 rounded-2xl bg-[#58CC02] text-white font-extrabold text-xs sm:text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Visualizar Relatório</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </PopoverContent>
      </Popover>

      {/* Modal de Pré-visualização do Relatório (Print-Ready) */}
      <Dialog
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v)
          onOpenChange?.(v)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl print:p-0 print:max-w-none print:max-h-none print:overflow-visible print:border-none print:shadow-none">
          <DialogHeader className="print:hidden flex flex-row items-center justify-between border-b pb-3 gap-2">
            <div>
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1CB0F6]" />
                Pré-visualização do Relatório
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revise os dados antes de imprimir ou salvar em PDF.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-2xl bg-[#1CB0F6] text-white font-extrabold text-xs sm:text-sm border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </DialogHeader>

          {/* ÁREA DE IMPRESSÃO / CONTEÚDO DO RELATÓRIO */}
          <div className="report-print-container space-y-6 pt-2">
            {/* Cabeçalho do documento */}
            <div className="border-b-2 border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#58CC02] text-white flex items-center justify-center font-black text-sm">
                    Z
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    Relatório de Evolução Pessoal
                  </h1>
                </div>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
                  Usuário: <span className="text-foreground">{user?.name || 'Zenith User'}</span>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs space-y-0.5">
                <div className="inline-block px-3 py-1 rounded-full bg-muted font-black text-[#1CB0F6]">
                  {periodInfo.label}
                </div>
                <div className="text-muted-foreground font-semibold">
                  {safeFormatDate(periodInfo.startStr)} até {safeFormatDate(periodInfo.endStr)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Gerado em {safeFormatDate(new Date().toISOString().split('T')[0])}
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: TAREFAS E HÁBITOS */}
            {config.sections.tasksAndHabits && (
              <section className="space-y-3 border-b border-border/80 pb-5">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#58CC02]" />
                  <h2 className="text-base font-extrabold text-foreground">Tarefas e Hábitos</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">
                      Total de Tarefas
                    </div>
                    <div className="text-xl font-black text-foreground">
                      {taskHabitStats.totalTasks}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20 text-center">
                    <div className="text-[10px] font-bold text-[#1CB0F6] uppercase">Concluídas</div>
                    <div className="text-xl font-black text-[#1CB0F6]">
                      {taskHabitStats.completedTasks}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/20 text-center">
                    <div className="text-[10px] font-bold text-[#58CC02] uppercase">
                      Taxa de Conclusão
                    </div>
                    <div className="text-xl font-black text-[#58CC02]">
                      {taskHabitStats.taskRate}%
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FFC800]/10 border border-[#FFC800]/20 text-center">
                    <div className="text-[10px] font-bold text-[#E5B400] uppercase">
                      Hábitos Concluídos
                    </div>
                    <div className="text-xl font-black text-[#E5B400]">
                      {taskHabitStats.totalHabitCompletions}
                    </div>
                  </div>
                </div>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskHabitStats.chart}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={25} />
                      <Bar dataKey="tarefas" name="Tarefas" fill="#1CB0F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="habitos" name="Hábitos" fill="#58CC02" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* SEÇÃO 2: SAÚDE */}
            {config.sections.health && (
              <section className="space-y-3 border-b border-border/80 pb-5">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-[#FF4B4B]" />
                  <h2 className="text-base font-extrabold text-foreground">Saúde & Bem-Estar</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20 text-center">
                    <div className="text-[10px] font-bold text-[#1CB0F6] uppercase">
                      Total Hidratação
                    </div>
                    <div className="text-xl font-black text-foreground">
                      {(healthStats.totalWater / 1000).toFixed(1)} L
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20 text-center">
                    <div className="text-[10px] font-bold text-[#1CB0F6] uppercase">
                      Média Diária de Água
                    </div>
                    <div className="text-xl font-black text-[#1CB0F6]">
                      {healthStats.avgWater} ml
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#CE82FF]/10 border border-[#CE82FF]/20 text-center">
                    <div className="text-[10px] font-bold text-[#CE82FF] uppercase">
                      Média de Humor
                    </div>
                    <div className="text-xl font-black text-[#CE82FF]">
                      {healthStats.avgMood} / 5
                    </div>
                  </div>
                </div>

                <div className="h-40 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthStats.chart}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={35} />
                      <Bar dataKey="agua" name="Água (ml)" fill="#1CB0F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* SEÇÃO 3: MENTE */}
            {config.sections.mind && (
              <section className="space-y-3 border-b border-border/80 pb-5">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#CE82FF]" />
                  <h2 className="text-base font-extrabold text-foreground">Mente & Emoções</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/20 text-center">
                    <div className="text-[10px] font-bold text-[#58CC02] uppercase">
                      Humor Médio
                    </div>
                    <div className="text-xl font-black text-foreground">{mindStats.avgMood}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FF9600]/10 border border-[#FF9600]/20 text-center">
                    <div className="text-[10px] font-bold text-[#FF9600] uppercase">
                      Estresse Médio
                    </div>
                    <div className="text-xl font-black text-foreground">{mindStats.avgStress}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FF4B4B]/10 border border-[#FF4B4B]/20 text-center">
                    <div className="text-[10px] font-bold text-[#FF4B4B] uppercase">
                      Ansiedade Média
                    </div>
                    <div className="text-xl font-black text-foreground">{mindStats.avgAnxiety}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20 text-center">
                    <div className="text-[10px] font-bold text-[#1CB0F6] uppercase">Sono Médio</div>
                    <div className="text-xl font-black text-foreground">{mindStats.avgSleep}</div>
                  </div>
                </div>

                {mindStats.chart.length > 0 ? (
                  <div className="h-44 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mindStats.chart}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis
                          domain={[1, 5]}
                          ticks={[1, 2, 3, 4, 5]}
                          tick={{ fontSize: 10 }}
                          width={25}
                        />
                        <Line
                          type="monotone"
                          dataKey="humor"
                          stroke="#58CC02"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="estresse"
                          stroke="#FF9600"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="ansiedade"
                          stroke="#FF4B4B"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sono"
                          stroke="#1CB0F6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    Nenhum registro emocional no período selecionado.
                  </p>
                )}
              </section>
            )}

            {/* SEÇÃO 4: FOCO */}
            {config.sections.focus && (
              <section className="space-y-3 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#58CC02]" />
                  <h2 className="text-base font-extrabold text-foreground">Estúdio de Foco</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/20 text-center">
                    <div className="text-[10px] font-bold text-[#58CC02] uppercase">
                      Total Focado
                    </div>
                    <div className="text-xl font-black text-foreground">
                      {focusStats.totalMinutes} min
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/20 text-center">
                    <div className="text-[10px] font-bold text-[#58CC02] uppercase">
                      Total Sessões 🍅
                    </div>
                    <div className="text-xl font-black text-[#58CC02]">
                      {focusStats.totalSessions}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/40 border text-center">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">
                      Média Diária
                    </div>
                    <div className="text-xl font-black text-foreground">
                      {focusStats.avgDailyMinutes} min
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FFC800]/10 border border-[#FFC800]/20 text-center">
                    <div className="text-[10px] font-bold text-[#E5B400] uppercase">Melhor Dia</div>
                    <div className="text-xs font-black text-foreground mt-1">
                      {focusStats.bestDay.day} ({focusStats.bestDay.minutes} min)
                    </div>
                  </div>
                </div>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={focusStats.chart}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={30} />
                      <Bar
                        dataKey="minutos"
                        name="Minutos de Foco"
                        fill="#58CC02"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Rodapé confidencial do relatório */}
            <div className="pt-4 border-t text-center text-[10px] text-muted-foreground">
              VibeCoding Tarefas · Zenith Dashboard · Relatório gerado localmente pelo usuário.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
