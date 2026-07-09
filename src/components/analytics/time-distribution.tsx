import { Task, useAppStore } from '@/stores/useAppStore'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { formatTime } from '@/lib/habit-utils'

export function TimeDistribution({ tasks }: { tasks: Task[] }) {
  const { tags } = useAppStore()

  const chartData = useMemo(() => {
    return tags
      .map((tag) => {
        const tagTasks = tasks.filter((t) => t.tagId === tag.id && t.completed)
        return {
          name: tag.name,
          time: tagTasks.reduce((s, t) => s + t.estimatedTime, 0),
          fill: tag.color,
        }
      })
      .filter((d) => d.time > 0)
  }, [tasks, tags])

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border">
      <h3 className="font-bold mb-6 text-lg">Tempo Investido por Tag</h3>
      <div className="h-56">
        {chartData.length > 0 ? (
          <ChartContainer config={{}} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => formatTime(v)}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  formatter={(v: number) => [formatTime(v), 'Tempo']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="time" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Conclua tarefas para ver seu tempo investido
          </div>
        )}
      </div>
    </div>
  )
}
