import { useAppStore } from '@/stores/useAppStore'
import {
  calculateCaloricGoals,
  calculateDailyMetExpenditure,
  calculateMetExpenditure,
  getActivityFactor,
  MetActivity,
  Methodology,
  ActivityLevel,
} from '@/lib/metabolic-utils'
import { Flame, TrendingDown, Scale, TrendingUp, Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'

const chartConfig = {
  bmr: { label: 'Metabolismo Basal', color: '#1CB0F6' },
  met: { label: 'Exercício (MET)', color: '#FF9600' },
} satisfies ChartConfig

export function MetabolicDashboard() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const sorted = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]

  if (!latest || !latest.tmb || !latest.get) {
    return (
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-[#FF9600]" /> Metabolismo e Gasto Energético
        </h3>
        <p className="text-sm font-bold text-muted-foreground text-center py-4">
          Registre uma avaliação com dados metabólicos para ver seu gasto energético.
        </p>
      </div>
    )
  }

  const goals = calculateCaloricGoals(latest.get)
  const currentGoal = latest.primaryGoal || ''
  const metActivities: MetActivity[] = latest.metActivities || []
  const metExpenditure = calculateDailyMetExpenditure(metActivities, latest.weight || 0)
  const venta = latest.ventaTarget || latest.get
  const methodologyLabel = latest.methodologyUsed
    ? { mifflin: 'Mifflin-St Jeor', harris: 'Harris-Benedict', katch: 'Katch-McArdle' }[
        latest.methodologyUsed
      ] || 'Mifflin-St Jeor'
    : 'Mifflin-St Jeor'

  const pieData = [
    { name: 'Metabolismo Basal', value: latest.tmb, fill: '#1CB0F6' },
    { name: 'Exercício (MET)', value: Math.round(metExpenditure), fill: '#FF9600' },
  ].filter((d) => d.value > 0)

  const bars = [
    {
      label: 'Perda de Peso',
      value: goals.deficit,
      icon: TrendingDown,
      color: '#FF4B4B',
      match: currentGoal === 'Emagrecimento',
    },
    {
      label: 'Manutenção',
      value: goals.maintenance,
      icon: Scale,
      color: '#1CB0F6',
      match: currentGoal === 'Manutenção',
    },
    {
      label: 'Ganho de Massa',
      value: goals.surplus,
      icon: TrendingUp,
      color: '#58CC02',
      match: currentGoal === 'Hipertrofia',
    },
  ]

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-extrabold flex items-center gap-2 mb-1">
        <Flame className="w-5 h-5 text-[#FF9600]" /> Metabolismo e Gasto Energético
      </h3>
      <p className="text-[10px] font-bold text-muted-foreground mb-4">
        Método: {methodologyLabel} · Fator de Atividade:{' '}
        {getActivityFactor(
          (latest.methodologyUsed as Methodology) || 'mifflin',
          (latest.activityLevel as ActivityLevel) || 'none',
        )}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">TMB</p>
          <p className="text-xl font-extrabold text-[#1CB0F6]">{latest.tmb}</p>
          <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
        </div>
        <div className="bg-[#FF9600]/10 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">GET</p>
          <p className="text-xl font-extrabold text-[#FF9600]">{latest.get}</p>
          <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
        </div>
        <div className="bg-[#58CC02]/10 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">VENTA</p>
          <p className="text-xl font-extrabold text-[#58CC02]">{venta}</p>
          <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
                strokeWidth={2}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="flex justify-center gap-4 mt-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-[10px] font-bold">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {bars.map((bar) => {
            const Icon = bar.icon
            return (
              <div
                key={bar.label}
                className={cn(
                  'flex items-center justify-between p-3 rounded-2xl border-2 border-b-4 transition-all',
                  bar.match ? 'bg-muted/30' : 'border-transparent bg-muted/20',
                )}
                style={
                  bar.match ? { borderColor: bar.color, borderBottomColor: bar.color } : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: bar.color }} />
                  <span className="text-xs font-extrabold">{bar.label}</span>
                </div>
                <span className="text-base font-extrabold" style={{ color: bar.color }}>
                  {bar.value} kcal
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {metActivities.length > 0 && (
        <div className="border-t-2 border-muted pt-4">
          <h4 className="text-sm font-extrabold flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#FF9600]" />
            Linha do Tempo de Atividades
          </h4>
          <div className="space-y-2">
            {metActivities.map((act, i) => {
              const dailyKcal =
                (calculateMetExpenditure(act.met, latest.weight || 0, act.duration) *
                  act.weeklyFrequency) /
                7
              return (
                <div
                  key={act.id || i}
                  className="flex items-center gap-3 bg-muted/30 rounded-2xl p-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FF9600]/10 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-[#FF9600]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold truncate">{act.name || 'Atividade'}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                      <span>{act.met} MET</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {act.duration}min
                      </span>
                      <span>{act.weeklyFrequency}x/sem</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-[#FF9600]">
                      {Math.round(dailyKcal)}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
