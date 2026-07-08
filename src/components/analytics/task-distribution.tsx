import { Task, useAppStore } from '@/stores/useAppStore'
import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export function TaskDistribution({ tasks }: { tasks: Task[] }) {
  const { tags } = useAppStore()

  const chartData = useMemo(() => {
    return tags
      .map((tag) => {
        const tagTasks = tasks.filter((t) => t.tagId === tag.id)
        return { name: tag.name, count: tagTasks.length, fill: tag.color }
      })
      .filter((d) => d.count > 0)
  }, [tasks, tags])

  return (
    <div className="bg-card rounded-[2rem] p-6 shadow-sm border">
      <h3 className="font-bold mb-6 text-lg">Distribuição de Tarefas</h3>
      <div className="h-56">
        {chartData.length > 0 ? (
          <ChartContainer config={{}} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Sem dados suficientes
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-medium">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
