import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

export function EvolutionChart() {
  const { bodyMetrics } = useAppStore()

  const chartData = useMemo(() => {
    return [...bodyMetrics]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        date: new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        weight: m.weight,
        bodyFat: m.bodyFatPercentage,
      }))
  }, [bodyMetrics])

  if (chartData.length === 0) return null

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-extrabold mb-4">Evolução Corporal</h3>
      <div className="h-64">
        <ChartContainer
          config={{
            weight: { label: 'Peso (kg)', color: '#1CB0F6' },
            bodyFat: { label: 'Gordura (%)', color: '#FF9600' },
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
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                name="Peso (kg)"
                stroke="#1CB0F6"
                strokeWidth={3}
                dot={{ fill: '#1CB0F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bodyFat"
                name="Gordura (%)"
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
