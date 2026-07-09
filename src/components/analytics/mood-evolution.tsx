import { useAppStore, MoodLevel } from '@/stores/useAppStore'
import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const MOOD_LABELS: Record<number, string> = {
  1: '😩',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export function MoodEvolution() {
  const { getHealthRecord } = useAppStore()

  const chartData = useMemo(() => {
    const data: { day: string; mood: number; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const record = getHealthRecord(dateStr)
      const level = record.mood?.level || 3
      data.push({
        day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
        mood: level,
        label: MOOD_LABELS[level] || '😐',
      })
    }
    return data
  }, [getHealthRecord])

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border">
      <h3 className="font-bold mb-6 text-lg">Evolução do Humor</h3>
      <div className="h-56">
        <ChartContainer
          config={{ mood: { label: 'Humor', color: 'hsl(280 70% 60%)' } }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                formatter={(v: number) => [`${MOOD_LABELS[v] || '😐'} Nível ${v}`, 'Humor']}
                cursor={{ stroke: 'hsl(var(--muted))' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="hsl(280 70% 60%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(280 70% 60%)', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
