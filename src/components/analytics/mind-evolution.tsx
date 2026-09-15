import { useMemo, useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { safeFormatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Brain, TrendingUp, Sparkles, Activity, RefreshCw } from 'lucide-react'

const SCORE_METRICS = [
  { key: 'mood', label: 'Humor', color: '#58CC02' },
  { key: 'stress', label: 'Estresse', color: '#FF9600' },
  { key: 'anxiety', label: 'Ansiedade', color: '#FF4B4B' },
  { key: 'sleep', label: 'Sono', color: '#1CB0F6' },
  { key: 'sadness', label: 'Tristeza', color: '#CE82FF' },
] as const

const MOOD_EMOJIS: Record<number, string> = {
  1: '😩',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

const MOOD_TEXTS: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Neutro',
  4: 'Bom',
  5: 'Excelente',
}

export function MindEvolution() {
  const { mentalHealthLogs, fetchMentalHealthLogs } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
    mood: true,
    stress: true,
    anxiety: false,
    sleep: false,
    sadness: false,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      await fetchMentalHealthLogs()
    } catch {
      setError('Não foi possível carregar os registros da mente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Deduplicação por data (garante uma avaliação por dia) e ordenação cronológica
  const sortedLogs = useMemo(() => {
    if (!mentalHealthLogs || mentalHealthLogs.length === 0) return []
    const map = new Map<string, (typeof mentalHealthLogs)[0]>()
    mentalHealthLogs.forEach((l) => {
      const d = (l.date || '').split('T')[0]
      if (d && !map.has(d)) {
        map.set(d, l)
      }
    })
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [mentalHealthLogs])

  const latestLog = useMemo(() => {
    if (sortedLogs.length === 0) return null
    return sortedLogs[sortedLogs.length - 1]
  }, [sortedLogs])

  const chartData = useMemo(() => {
    return sortedLogs.map((l) => {
      const parts = l.date.split('-')
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : l.date
      return {
        date: shortDate,
        fullDate: l.date,
        mood: l.mood,
        stress: l.stressLevel,
        anxiety: l.anxietyLevel,
        sleep: l.sleepQuality,
        sadness: l.sadnessLevel,
      }
    })
  }, [sortedLogs])

  // Médias 7 dias e 30 dias
  const stats = useMemo(() => {
    if (sortedLogs.length === 0) return { avg7: null, avg30: null }

    const now = new Date()
    const d7 = new Date(now)
    d7.setDate(d7.getDate() - 7)
    const cut7 = d7.toISOString().split('T')[0]

    const d30 = new Date(now)
    d30.setDate(d30.getDate() - 30)
    const cut30 = d30.toISOString().split('T')[0]

    const logs7 = sortedLogs.filter((l) => l.date >= cut7)
    const logs30 = sortedLogs.filter((l) => l.date >= cut30)

    const calcAvg = (list: typeof sortedLogs) => {
      if (list.length === 0) return null
      const n = list.length
      const round = (val: number) => Math.round((val / n) * 10) / 10
      return {
        mood: round(list.reduce((s, l) => s + (l.mood || 0), 0)),
        stress: round(list.reduce((s, l) => s + (l.stressLevel || 0), 0)),
        anxiety: round(list.reduce((s, l) => s + (l.anxietyLevel || 0), 0)),
        sleep: round(list.reduce((s, l) => s + (l.sleepQuality || 0), 0)),
        sadness: round(list.reduce((s, l) => s + (l.sadnessLevel || 0), 0)),
      }
    }

    return {
      avg7: calcAvg(logs7),
      avg30: calcAvg(logs30),
    }
  }, [sortedLogs])

  const chartConfig = useMemo(
    () => Object.fromEntries(SCORE_METRICS.map((m) => [m.key, { label: m.label, color: m.color }])),
    [],
  )

  if (loading && sortedLogs.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-muted rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-28 bg-muted rounded-3xl" />
          <div className="h-28 bg-muted rounded-3xl" />
        </div>
        <div className="h-64 bg-muted rounded-3xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl border-2 border-dashed bg-card text-center space-y-3">
        <Brain className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-sm font-bold text-foreground">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#CE82FF] text-white font-extrabold border-b-4 border-[#A347DF] active:translate-y-1 active:border-b-0 transition-all text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar novamente</span>
        </button>
      </div>
    )
  }

  if (sortedLogs.length === 0) {
    return (
      <div className="p-8 rounded-3xl border-2 border-dashed bg-card text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#CE82FF]/15 text-[#CE82FF] flex items-center justify-center mx-auto text-2xl font-black">
          🧠
        </div>
        <h3 className="text-sm font-extrabold text-foreground">Como você tem se sentido?</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Complete sua primeira avaliação para ver sua evolução mental aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Última avaliação em destaque */}
      {latestLog && (
        <div className="p-5 rounded-3xl border-2 border-b-4 bg-card border-[#CE82FF]/30 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#CE82FF]/15 text-[#CE82FF] flex items-center justify-center shrink-0 text-2xl">
                {MOOD_EMOJIS[latestLog.mood] || '🧠'}
              </div>
              <div>
                <div className="text-[11px] font-black uppercase text-[#CE82FF] tracking-wider">
                  Como você tem se sentido recentemente
                </div>
                <div className="text-sm font-extrabold text-foreground">
                  {safeFormatDate(latestLog.date)} • Humor{' '}
                  {MOOD_TEXTS[latestLog.mood] || latestLog.mood}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {latestLog.date}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/20">
              <div className="text-[10px] font-bold text-[#58CC02]">Humor</div>
              <div className="text-sm font-black text-foreground">{latestLog.mood}/5</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#FF9600]/10 border border-[#FF9600]/20">
              <div className="text-[10px] font-bold text-[#FF9600]">Estresse</div>
              <div className="text-sm font-black text-foreground">{latestLog.stressLevel}/5</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#FF4B4B]/10 border border-[#FF4B4B]/20">
              <div className="text-[10px] font-bold text-[#FF4B4B]">Ansiedade</div>
              <div className="text-sm font-black text-foreground">{latestLog.anxietyLevel}/5</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20">
              <div className="text-[10px] font-bold text-[#1CB0F6]">Sono</div>
              <div className="text-sm font-black text-foreground">{latestLog.sleepQuality}/5</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#CE82FF]/10 border border-[#CE82FF]/20">
              <div className="text-[10px] font-bold text-[#CE82FF]">Tristeza</div>
              <div className="text-sm font-black text-foreground">{latestLog.sadnessLevel}/5</div>
            </div>
          </div>

          {latestLog.mentalTriggers && (
            <div className="p-3 rounded-2xl bg-muted/40 border text-xs">
              <div className="text-[10px] font-extrabold text-muted-foreground uppercase mb-0.5">
                Observações / Gatilhos registrados:
              </div>
              <p className="text-foreground leading-relaxed">{latestLog.mentalTriggers}</p>
            </div>
          )}
        </div>
      )}

      {/* Médias 7 e 30 dias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 7 dias */}
        <div className="p-4 rounded-3xl border-2 bg-card space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#CE82FF]" />
              Médias (Últimos 7 dias)
            </span>
            <span className="text-[10px] font-extrabold text-[#CE82FF] bg-[#CE82FF]/10 px-2.5 py-0.5 rounded-full">
              7d
            </span>
          </div>
          {stats.avg7 ? (
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Humor</div>
                <div className="text-xs font-black text-[#58CC02]">{stats.avg7.mood}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Estresse</div>
                <div className="text-xs font-black text-[#FF9600]">{stats.avg7.stress}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Ansiedade</div>
                <div className="text-xs font-black text-[#FF4B4B]">{stats.avg7.anxiety}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Sono</div>
                <div className="text-xs font-black text-[#1CB0F6]">{stats.avg7.sleep}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Tristeza</div>
                <div className="text-xs font-black text-[#CE82FF]">{stats.avg7.sadness}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-1">
              Sem registros nos últimos 7 dias.
            </p>
          )}
        </div>

        {/* 30 dias */}
        <div className="p-4 rounded-3xl border-2 bg-card space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#1CB0F6]" />
              Médias (Últimos 30 dias)
            </span>
            <span className="text-[10px] font-extrabold text-[#1CB0F6] bg-[#1CB0F6]/10 px-2.5 py-0.5 rounded-full">
              30d
            </span>
          </div>
          {stats.avg30 ? (
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Humor</div>
                <div className="text-xs font-black text-[#58CC02]">{stats.avg30.mood}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Estresse</div>
                <div className="text-xs font-black text-[#FF9600]">{stats.avg30.stress}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Ansiedade</div>
                <div className="text-xs font-black text-[#FF4B4B]">{stats.avg30.anxiety}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Sono</div>
                <div className="text-xs font-black text-[#1CB0F6]">{stats.avg30.sleep}</div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <div className="text-[9px] font-bold text-muted-foreground">Tristeza</div>
                <div className="text-xs font-black text-[#CE82FF]">{stats.avg30.sadness}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic py-1">
              Sem registros nos últimos 30 dias.
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de Linha */}
      <div className="p-5 rounded-3xl border-2 border-b-4 bg-card space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#CE82FF]" />
              Evolução Emocional ao Longo do Tempo
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Escala de 1 a 5. Clique nas métricas para alternar a exibição:
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SCORE_METRICS.map((m) => {
              const active = activeMetrics[m.key]
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggleMetric(m.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border',
                    active
                      ? 'text-white border-transparent shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border',
                  )}
                  style={active ? { backgroundColor: m.color } : undefined}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full pt-2">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      const current = chartData.find((d) => d.date === label)
                      return (
                        <div className="bg-popover border text-popover-foreground rounded-2xl p-3 shadow-md text-xs space-y-1">
                          <div className="font-extrabold text-foreground pb-1 border-b">
                            {current?.fullDate || label}
                          </div>
                          {payload.map((item: any) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="font-semibold flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: item.color }}
                                />
                                {chartConfig[item.name]?.label || item.name}
                              </span>
                              <span className="font-black">{item.value}/5</span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                  {activeMetrics.mood && (
                    <Line
                      type="monotone"
                      dataKey="mood"
                      name="mood"
                      stroke="#58CC02"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#58CC02' }}
                    />
                  )}
                  {activeMetrics.stress && (
                    <Line
                      type="monotone"
                      dataKey="stress"
                      name="stress"
                      stroke="#FF9600"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#FF9600' }}
                    />
                  )}
                  {activeMetrics.anxiety && (
                    <Line
                      type="monotone"
                      dataKey="anxiety"
                      name="anxiety"
                      stroke="#FF4B4B"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#FF4B4B' }}
                    />
                  )}
                  {activeMetrics.sleep && (
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      name="sleep"
                      stroke="#1CB0F6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#1CB0F6' }}
                    />
                  )}
                  {activeMetrics.sadness && (
                    <Line
                      type="monotone"
                      dataKey="sadness"
                      name="sadness"
                      stroke="#CE82FF"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#CE82FF' }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">
            Nenhum dado para o gráfico
          </div>
        )}
      </div>
    </div>
  )
}
