import { useAppStore } from '@/stores/useAppStore'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const HYDRATION_GOAL = 2000

export function HydrationConsistency() {
  const { getHealthRecord } = useAppStore()

  const chartData = useMemo(() => {
    const data: { day: string; ml: number; fill: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const record = getHealthRecord(dateStr)
      const hydration = record.hydration || 0
      data.push({
        day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
        ml: hydration,
        fill: hydration >= HYDRATION_GOAL ? '#58CC02' : '#1CB0F6',
      })
    }
    return data
  }, [getHealthRecord])

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
                tickFormatter={(v) => `${v}ml`}
              />
              <Tooltip
                formatter={(v: number) => [`${v} ml`, 'Hidratação']}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
              />
              <ReferenceLine
                y={HYDRATION_GOAL}
                stroke="#58CC02"
                strokeDasharray="4 4"
                label={{ value: 'Meta', fontSize: 10, fill: '#58CC02', position: 'right' }}
              />
              <Bar dataKey="ml" radius={[8, 8, 0, 0]} fill="#1CB0F6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
