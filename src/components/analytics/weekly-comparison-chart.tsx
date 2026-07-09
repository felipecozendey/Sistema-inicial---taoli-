import { Task, Habit } from '@/stores/useAppStore'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function WeeklyComparisonChart({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const chartData = useMemo(() => {
    const data: { day: string; tarefas: number; habitos: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const tarefas = tasks.filter((t) => t.completed && t.dueDate === dateStr).length
      const habitos = habits.filter((h) => h.completions.includes(dateStr)).length
      data.push({ day: DAY_LABELS[d.getDay()], tarefas, habitos })
    }
    return data
  }, [tasks, habits])

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border">
      <h3 className="font-bold mb-6 text-lg">Tarefas vs Hábitos (7 dias)</h3>
      <div className="h-64">
        <ChartContainer config={{}} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="tarefas"
                name="Tarefas Concluídas"
                fill="#1CB0F6"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="habitos"
                name="Hábitos Concluídos"
                fill="#58CC02"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
