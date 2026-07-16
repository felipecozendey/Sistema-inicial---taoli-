import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Heart } from 'lucide-react'

export function VitalSignsChart() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)

  const chartData = useMemo(() => {
    return [...bodyMetrics]
      .filter((m) => m.heartRateRest != null || m.stressLevel != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        date: new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        heartRate: m.heartRateRest,
        stress: m.stressLevel,
      }))
  }, [bodyMetrics])

  if (chartData.length === 0) {
    return (
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-[#FF4B4B]" />
          <h3 className="text-lg font-extrabold">Evolução dos Sinais Vitais</h3>
        </div>
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm font-bold text-muted-foreground">
            Registre suas avaliações para ver a evolução.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-[#FF4B4B]" />
        <h3 className="text-lg font-extrabold">Evolução dos Sinais Vitais</h3>
      </div>
      <div className="h-64">
        <ChartContainer
          config={{
            heartRate: { label: 'Freq. Cardíaca (bpm)', color: '#FF4B4B' },
            stress: { label: 'Nível de Estresse', color: '#FF9600' },
          }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                domain={[0, 5]}
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
                dataKey="heartRate"
                name="Freq. Cardíaca (bpm)"
                stroke="#FF4B4B"
                strokeWidth={3}
                dot={{ fill: '#FF4B4B', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="stress"
                name="Nível de Estresse"
                stroke="#FF9600"
                strokeWidth={3}
                dot={{ fill: '#FF9600', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
