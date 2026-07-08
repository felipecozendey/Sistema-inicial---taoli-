import { useAppStore } from '@/stores/useAppStore'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Flame } from 'lucide-react'
import { useMemo } from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export default function Analytics() {
  const { tasks, categories } = useAppStore()

  const chartData = useMemo(() => {
    return categories
      .map((cat, index) => {
        const count = tasks.filter((t) => t.categoryId === cat.id).length
        return { name: cat.name, value: count, fill: `hsl(var(--chart-${(index % 5) + 1}))` }
      })
      .filter((d) => d.value > 0)
  }, [tasks, categories])

  // Mock heatmap data for 90 days to show consistency
  const heatmap = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 90 })
      .map((_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dTasks = tasks.filter((t) => t.date.startsWith(dateStr))

        let level = 0
        if (dTasks.length > 0) {
          const completed = dTasks.filter((t) => t.completed).length
          const ratio = completed / dTasks.length
          if (ratio > 0.7) level = 3
          else if (ratio > 0.4) level = 2
          else if (ratio > 0) level = 1
        } else {
          level = Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0 // Simulate past history
        }
        return { date: dateStr, level }
      })
      .reverse()
  }, [tasks])

  const routines = tasks
    .filter((t) => t.isRoutine)
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <header>
        <h2 className="text-3xl font-bold">Sua Evolução</h2>
        <p className="text-muted-foreground mt-1">Acompanhe seu progresso e mantenha o ritmo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-[2rem] p-6 shadow-sm border">
          <h3 className="font-bold mb-6 text-lg">Distribuição de Foco</h3>
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
                      dataKey="value"
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
        </div>

        <div className="bg-card rounded-[2rem] p-6 shadow-sm border">
          <h3 className="font-bold mb-6 text-lg">Rotinas em Alta</h3>
          <div className="space-y-4">
            {routines.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl"
              >
                <span className="text-sm font-medium truncate pr-4">{r.title}</span>
                <div className="flex items-center text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-full text-xs">
                  <Flame className="w-3.5 h-3.5 mr-1" /> {r.streak || 0} dias
                </div>
              </div>
            ))}
            {routines.length === 0 && (
              <div className="text-sm text-muted-foreground p-4 text-center">
                Nenhuma rotina ativa no momento.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2rem] p-8 shadow-sm border overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Consistência</h3>
          <span className="text-xs text-muted-foreground">Últimos 90 dias</span>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {heatmap.map((day, i) => (
            <div
              key={i}
              title={day.date}
              className={cn(
                'w-4 h-4 md:w-5 md:h-5 rounded-[4px] transition-colors duration-500 hover:scale-110',
                day.level === 0 && 'bg-muted',
                day.level === 1 && 'bg-primary/40',
                day.level === 2 && 'bg-primary/70',
                day.level === 3 && 'bg-primary',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
