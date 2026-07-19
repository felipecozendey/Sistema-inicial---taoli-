import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BELT_STYLES, CAT_COLORS } from '@/components/health/jiu-constants'
import { JiuBeltModal } from '@/components/health/jiu-belt-modal'

export function JiuDashboard() {
  const jiuProfile = useAppStore((s) => s.jiuProfile)
  const jiuTechniques = useAppStore((s) => s.jiuTechniques)
  const jiuLogs = useAppStore((s) => s.jiuLogs)
  const fetchJiuProfile = useAppStore((s) => s.fetchJiuProfile)
  const fetchJiuTechniques = useAppStore((s) => s.fetchJiuTechniques)
  const fetchJiuLogs = useAppStore((s) => s.fetchJiuLogs)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchJiuProfile()
    fetchJiuTechniques()
    fetchJiuLogs()
  }, [fetchJiuProfile, fetchJiuTechniques, fetchJiuLogs])

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    jiuTechniques.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      fill: CAT_COLORS[name] || '#999',
    }))
  }, [jiuTechniques])

  const monthlyRolas = useMemo(() => {
    const m = new Date()
    m.setDate(1)
    m.setHours(0, 0, 0, 0)
    return jiuLogs.filter((l) => new Date(l.date) >= m).reduce((s, l) => s + l.sparringRounds, 0)
  }, [jiuLogs])

  const totalHours = useMemo(
    () => jiuLogs.reduce((s, l) => s + l.durationMinutes, 0) / 60,
    [jiuLogs],
  )

  const bs = BELT_STYLES[jiuProfile?.belt || 'White']
  const stripes = jiuProfile?.stripes || 0

  return (
    <div className="space-y-6">
      <div className={cn('rounded-3xl p-6 border-2 border-b-4', bs.bg)}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-bold opacity-80', bs.text)}>Faixa Atual</p>
            <p className={cn('text-3xl font-extrabold', bs.text)}>{bs.label}</p>
          </div>
          <span className="text-5xl">🥋</span>
        </div>
        <div className="mt-4 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn('w-8 h-3 rounded-full', i < stripes ? 'bg-[#FF4B4B]' : 'bg-black/20')}
            />
          ))}
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="mt-4 bg-white/20 hover:bg-white/30 text-white border-b-4 border-black/20 active:translate-y-1 active:border-b-0"
        >
          Atualizar Graduação
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-3xl p-5 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
          <p className="text-sm font-bold text-muted-foreground">Rolas no mês</p>
          <p className="text-3xl font-extrabold text-[#58CC02]">{monthlyRolas}</p>
        </div>
        <div className="bg-card rounded-3xl p-5 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
          <p className="text-sm font-bold text-muted-foreground">Horas de tatame</p>
          <p className="text-3xl font-extrabold text-[#1CB0F6]">{totalHours.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-card rounded-3xl p-6 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
        <h3 className="font-extrabold mb-4 text-lg">Distribuição de Técnicas</h3>
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
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Sem técnicas cadastradas
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

      <JiuBeltModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
