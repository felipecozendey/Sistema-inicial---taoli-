import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

export function MindClinicalReport() {
  const { mentalHealthLogs } = useAppStore()

  const defaultEnd = new Date().toISOString().split('T')[0]
  const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)

  const filteredLogs = useMemo(() => {
    return mentalHealthLogs
      .filter((l) => l.date >= startDate && l.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [mentalHealthLogs, startDate, endDate])

  const moodData = useMemo(() => {
    return filteredLogs.map((l) => ({
      date: new Date(l.date + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      mood: l.mood || 3,
    }))
  }, [filteredLogs])

  const correlationData = useMemo(() => {
    return filteredLogs.map((l) => ({
      date: new Date(l.date + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      sleep: l.sleepQuality || 3,
      focus: l.focusLevel || 3,
    }))
  }, [filteredLogs])

  const dateInputClass =
    'w-full px-3 py-2.5 rounded-xl bg-muted/50 border-transparent font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
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
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
          <span className="text-4xl block mb-3">📊</span>
          <p className="text-sm font-bold text-muted-foreground">
            Sem dados no período selecionado.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-extrabold mb-4">Oscilação de Humor</h3>
            <div className="h-64">
              <ChartContainer
                config={{ mood: { label: 'Humor', color: '#CE82FF' } }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodData}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CE82FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#CE82FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="mood"
                      name="Humor"
                      stroke="#CE82FF"
                      strokeWidth={3}
                      fill="url(#moodGradient)"
                      dot={{ fill: '#CE82FF', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-extrabold mb-4">Sono vs. Foco (Correlação)</h3>
            <div className="h-64">
              <ChartContainer
                config={{
                  sleep: { label: 'Sono', color: '#1CB0F6' },
                  focus: { label: 'Foco', color: '#CE82FF' },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={correlationData}>
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
                      dataKey="focus"
                      name="Foco / TDAH"
                      stroke="#CE82FF"
                      strokeWidth={3}
                      dot={{ fill: '#CE82FF', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => window.print()}
        className="w-full py-3.5 rounded-2xl bg-[#1CB0F6] text-white font-extrabold border-b-4 border-[#0E8FC7] active:translate-y-1 active:border-b-0 transition-all duration-150 print:hidden"
      >
        📄 Gerar Relatório para Impressão / PDF
      </button>
    </div>
  )
}
