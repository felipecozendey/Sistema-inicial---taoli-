import { useAppStore } from '@/stores/useAppStore'
import { calculateCaloricGoals } from '@/lib/metabolic-utils'
import { Flame, TrendingDown, Scale, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MetabolicDashboard() {
  const { bodyMetrics } = useAppStore()
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
      <h3 className="text-lg font-extrabold flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-[#FF9600]" /> Metabolismo e Gasto Energético
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="bg-[#1CB0F6]/10 rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground">TMB (Taxa Metabólica Basal)</p>
            <p className="text-3xl font-extrabold text-[#1CB0F6]">
              {latest.tmb} <span className="text-sm">kcal</span>
            </p>
          </div>
          <div className="bg-[#FF9600]/10 rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground">GET (Gasto Energético Total)</p>
            <p className="text-3xl font-extrabold text-[#FF9600]">
              {latest.get} <span className="text-sm">kcal</span>
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {bars.map((bar) => {
            const Icon = bar.icon
            return (
              <div
                key={bar.label}
                className={cn(
                  'flex items-center justify-between p-4 rounded-2xl border-2 border-b-4 transition-all',
                  bar.match ? 'bg-muted/30' : 'border-transparent bg-muted/20',
                )}
                style={
                  bar.match ? { borderColor: bar.color, borderBottomColor: bar.color } : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" style={{ color: bar.color }} />
                  <span className="text-sm font-extrabold">{bar.label}</span>
                </div>
                <span className="text-lg font-extrabold" style={{ color: bar.color }}>
                  {bar.value} kcal
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
