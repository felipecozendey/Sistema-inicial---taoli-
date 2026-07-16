import { useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { ChartContainer } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Printer, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { ANXIETY_LEVELS } from '@/components/health/mind-evaluation'

export function MindClinicalReport() {
  const { mentalHealthLogs, bodyMetrics } = useAppStore()

  const chartData = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return [...bodyMetrics]
      .filter((m) => {
        const metricDate = new Date(m.date + 'T00:00:00')
        return metricDate >= thirtyDaysAgo && (m.sleepQuality || m.stressLevel)
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        date: new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        sleep: m.sleepQuality || 0,
        stress: m.stressLevel || 0,
      }))
  }, [bodyMetrics])

  const weeklyFocusAverage = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentLogs = mentalHealthLogs.filter(
      (l) => new Date(l.date + 'T00:00:00') >= sevenDaysAgo,
    )
    if (recentLogs.length === 0) return 0
    return recentLogs.reduce((sum, l) => sum + l.focusLevel, 0) / recentLogs.length
  }, [mentalHealthLogs])

  const recordedTriggers = useMemo(() => {
    return mentalHealthLogs
      .filter((l) => l.mentalTriggers && l.mentalTriggers.trim().length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
  }, [mentalHealthLogs])

  const handleExport = useCallback(() => {
    toast.success('Relatório clínico gerado! Preparando para impressão... 📄')
    setTimeout(() => window.print(), 500)
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold mb-4">Correlação: Sono vs. Estresse</h3>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ChartContainer
              config={{
                sleep: { label: 'Qualidade do Sono', color: '#1CB0F6' },
                stress: { label: 'Nível de Estresse', color: '#FF4B4B' },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    name="Qualidade do Sono"
                    stroke="#1CB0F6"
                    strokeWidth={3}
                    dot={{ fill: '#1CB0F6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    name="Nível de Estresse"
                    stroke="#FF4B4B"
                    strokeWidth={3}
                    dot={{ fill: '#FF4B4B', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm font-bold text-muted-foreground">
              Sem dados suficientes para o gráfico.
            </p>
          </div>
        )}
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-[#1CB0F6]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-extrabold">Média de Foco Semanal</h3>
            <p className="text-3xl font-extrabold text-[#1CB0F6]">
              {weeklyFocusAverage > 0 ? weeklyFocusAverage.toFixed(1) : '—'}
              <span className="text-sm text-muted-foreground"> / 5.0</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold mb-3">Gatilhos Registrados</h3>
        {recordedTriggers.length > 0 ? (
          <div className="space-y-2">
            {recordedTriggers.map((log) => (
              <div key={log.id} className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs font-bold text-muted-foreground mb-1">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                  {' • 🎯 Foco: '}
                  {log.focusLevel}/5
                  {' • '}
                  {ANXIETY_LEVELS[log.anxietyLevel - 1]?.emoji}{' '}
                  {ANXIETY_LEVELS[log.anxietyLevel - 1]?.label}
                </p>
                <p className="text-sm font-semibold italic">"{log.mentalTriggers}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-bold text-muted-foreground">
            Nenhum gatilho registrado ainda.
          </p>
        )}
      </div>

      <button
        onClick={handleExport}
        className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#0EA4DB] text-white font-extrabold text-lg border-b-4 border-[#0E8FBE] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
      >
        <Printer className="w-6 h-6" strokeWidth={3} />
        Gerar Relatório para Impressão / PDF
      </button>
    </div>
  )
}
