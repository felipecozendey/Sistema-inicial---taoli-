import { useState, useMemo } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookOpen, Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCORE_METRICS } from '@/components/health/mind-constants'

type DialogState = { title: string; content: string; isHtml?: boolean } | null

export function MindClinicalReport() {
  const { mentalHealthLogs, journalEntries, mindEvents } = useAppStore()
  const defaultEnd = new Date().toISOString().split('T')[0]
  const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
    mood: true,
    stress: false,
    anxiety: false,
    sleep: false,
    sadness: false,
  })
  const [eventDate, setEventDate] = useState(defaultEnd)
  const [dialog, setDialog] = useState<DialogState>(null)

  const chartData = useMemo(() => {
    return mentalHealthLogs
      .filter((l) => l.date >= startDate && l.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({
        date: new Date(l.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        mood: l.mood || 3,
        stress: l.stressLevel || 3,
        anxiety: l.anxietyLevel || 3,
        sleep: l.sleepQuality || 3,
        sadness: l.sadnessLevel || 3,
      }))
  }, [mentalHealthLogs, startDate, endDate])

  const averages = useMemo(() => {
    if (chartData.length === 0) return null
    const sum = chartData.reduce(
      (acc, d) => ({
        mood: acc.mood + d.mood,
        stress: acc.stress + d.stress,
        anxiety: acc.anxiety + d.anxiety,
        sleep: acc.sleep + d.sleep,
        sadness: acc.sadness + d.sadness,
      }),
      { mood: 0, stress: 0, anxiety: 0, sleep: 0, sadness: 0 },
    )
    const n = chartData.length
    return {
      mood: (sum.mood / n).toFixed(1),
      stress: (sum.stress / n).toFixed(1),
      anxiety: (sum.anxiety / n).toFixed(1),
      sleep: (sum.sleep / n).toFixed(1),
      sadness: (sum.sadness / n).toFixed(1),
    }
  }, [chartData])

  const dayEvents = useMemo(
    () =>
      mindEvents
        .filter((e) => e.date === eventDate)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [mindEvents, eventDate],
  )

  const toggleMetric = (key: string) => setActiveMetrics((p) => ({ ...p, [key]: !p[key] }))
  const dateInputClass =
    'w-full px-3 py-2.5 rounded-xl bg-muted/50 border-transparent font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'
  const chartConfig = useMemo(
    () => Object.fromEntries(SCORE_METRICS.map((m) => [m.key, { label: m.label, color: m.color }])),
    [],
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#CE82FF]" />
            </div>
            <h3 className="text-lg font-extrabold">Médias de Humor & Performance</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={dateInputClass}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={dateInputClass}
              />
            </div>
          </div>
          {averages && (
            <div className="flex flex-wrap gap-2 mb-4">
              {SCORE_METRICS.map((m) => (
                <span
                  key={m.key}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.label}: {averages[m.key as keyof typeof averages]}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {SCORE_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-b-4 text-sm font-bold transition-all active:translate-y-0.5 active:border-b-2',
                  activeMetrics[m.key]
                    ? 'text-white'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:bg-muted/50',
                )}
                style={
                  activeMetrics[m.key]
                    ? { backgroundColor: m.color, borderColor: m.color }
                    : undefined
                }
              >
                {m.label}
              </button>
            ))}
          </div>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
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
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    {SCORE_METRICS.filter((m) => activeMetrics[m.key]).map((m) => (
                      <Line
                        key={m.key}
                        type="monotone"
                        dataKey={m.key}
                        name={m.label}
                        stroke={m.color}
                        strokeWidth={3}
                        dot={{ fill: m.color, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground font-bold text-sm">
              Sem dados no período.
            </div>
          )}
        </div>

        <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#58CC02]" />
            </div>
            <h3 className="text-lg font-extrabold">Diário Emocional</h3>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {journalEntries.length === 0 ? (
              <p className="text-sm font-bold text-muted-foreground text-center py-4">
                Nenhuma entrada.
              </p>
            ) : (
              journalEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() =>
                    setDialog({
                      title: new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      }),
                      content: entry.content,
                      isHtml: true,
                    })
                  }
                  className="w-full text-left flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-[#58CC02] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold">
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold truncate">
                      {entry.content.replace(/<[^>]*>/g, '').slice(0, 50) || 'Vazio'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#1CB0F6]" />
          </div>
          <h3 className="text-lg font-extrabold">O que aconteceu nesse dia?</h3>
        </div>
        <div className="mb-4">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={dateInputClass + ' max-w-xs'}
          />
        </div>
        {dayEvents.length === 0 ? (
          <p className="text-sm font-bold text-muted-foreground text-center py-4">
            Nenhum evento registrado neste dia.
          </p>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((event, i) => (
              <div
                key={event.id}
                className="flex items-start gap-3 bg-muted/40 rounded-xl px-3 py-2.5"
              >
                <span className="text-xs font-extrabold text-muted-foreground shrink-0 w-6">
                  {i + 1}.
                </span>
                <span className="text-sm font-semibold flex-1">{event.description}</span>
                <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                  {new Date(event.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => window.print()}
        className="w-full py-3.5 rounded-2xl bg-[#1CB0F6] text-white font-extrabold border-b-4 border-[#0E8FC7] active:translate-y-1 active:border-b-0 transition-all duration-150 print:hidden"
      >
        📄 Gerar Relatório para Impressão / PDF
      </button>

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">{dialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {dialog?.isHtml ? (
              <div
                className="text-sm font-semibold leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: dialog.content }}
              />
            ) : (
              <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                {dialog?.content}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
