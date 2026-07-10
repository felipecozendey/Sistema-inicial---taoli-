import { useAppStore } from '@/stores/useAppStore'
import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

export function HydrationConsistency() {
  const { user, getHealthRecord } = useAppStore()
  const waterGoal = user.waterGoal || 2000

  const chartData = useMemo(() => {
    const data: { day: string; ml: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const record = getHealthRecord(dateStr)
      data.push({
        day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
        ml: record.hydration || 0,
      })
    }
    return data
  }, [getHealthRecord])

  const yMax = Math.max(...chartData.map((d) => d.ml), waterGoal)

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border">
      <h3 className="font-bold mb-6 text-lg">Hidratação (7 dias)</h3>
      <div className="h-56">
        <ChartContainer config={{ ml: { label: 'ml', color: '#1CB0F6' } }} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={45}
                domain={[0, yMax]}
                tickFormatter={(v) => `${v}ml`}
              />
              <Tooltip
                formatter={(v: number) => [`${v} ml`, 'Hidratação']}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
              />
              <ReferenceLine
                y={waterGoal}
                stroke="#1CB0F6"
                strokeDasharray="4 4"
                label={{ value: 'Meta', fontSize: 10, fill: '#1CB0F6', position: 'right' }}
              />
              <Bar dataKey="ml" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.ml >= waterGoal ? '#58CC02' : '#1CB0F6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
