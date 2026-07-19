import { useMemo } from 'react'
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
import { Heart, Brain } from 'lucide-react'

export function VitalsChart() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)

  const chartData = useMemo(() => {
    return [...bodyMetrics]
      .filter((m) => m.heartRateRest || m.stressLevel)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        date: new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        bpm: m.heartRateRest || null,
        stress: m.stressLevel || null,
      }))
  }, [bodyMetrics])

  const latest = useMemo(() => {
    const sorted = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date))
    return sorted[sorted.length - 1]
  }, [bodyMetrics])

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <h4 className="text-base font-extrabold flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-[#FF4B4B]" />
        Sinais Vitais & Bem-Estar
      </h4>
      {chartData.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-[#FF4B4B]/10 rounded-2xl p-3">
              <Heart className="w-5 h-5 text-[#FF4B4B] mx-auto mb-1 animate-pulse" />
              <p className="text-lg font-extrabold">{latest?.heartRateRest || '—'}</p>
              <p className="text-[10px] font-bold text-muted-foreground">FC Repouso (bpm)</p>
            </div>
            <div className="text-center bg-[#FF9600]/10 rounded-2xl p-3">
              <Brain className="w-5 h-5 text-[#FF9600] mx-auto mb-1" />
              <p className="text-lg font-extrabold">{latest?.stressLevel || '—'}</p>
              <p className="text-[10px] font-bold text-muted-foreground">Estresse (1-5)</p>
            </div>
            <div className="text-center bg-[#8B5CF6]/10 rounded-2xl p-3">
              <span className="text-base block mb-1">🩺</span>
              <p className="text-sm font-extrabold">{latest?.bloodPressure || '—'}</p>
              <p className="text-[10px] font-bold text-muted-foreground">Pressão</p>
            </div>
          </div>
          <div className="h-48">
            <ChartContainer
              config={{
                bpm: { label: 'FC Repouso (bpm)', color: '#FF4B4B' },
                stress: { label: 'Estresse (1-5)', color: '#FF9600' },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="bpm"
                    name="FC Repouso (bpm)"
                    stroke="#FF4B4B"
                    strokeWidth={3}
                    dot={{ fill: '#FF4B4B', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="stress"
                    name="Estresse (1-5)"
                    stroke="#FF9600"
                    strokeWidth={3}
                    dot={{ fill: '#FF9600', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground font-bold text-sm">
          Sem dados vitais registrados.
        </div>
      )}
    </div>
  )
}
