import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { MetActivityTable } from '@/components/health/met-activity-table'
import {
  calculateDailyMetExpenditure,
  getActivityFactor,
  MetActivity,
  Methodology,
  ActivityLevel,
} from '@/lib/metabolic-utils'
import { Flame, Save, Calculator } from 'lucide-react'
import { MetabolicCalculatorModal } from '@/components/health/metabolic-calculator-modal'
import { cn } from '@/lib/utils'
import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

const chartConfig = {
  bmr: { label: 'Metabolismo Basal', color: '#1CB0F6' },
  met: { label: 'Exercício (MET)', color: '#FF9600' },
} satisfies ChartConfig

export function MetabolicDashboard() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const fetchBodyMetrics = useAppStore((s) => s.fetchBodyMetrics)

  const sorted = useMemo(
    () => [...bodyMetrics].sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [bodyMetrics],
  )
  const latest = sorted[sorted.length - 1]

  const [metActivities, setMetActivities] = useState<MetActivity[]>([])
  const [caloricAdj, setCaloricAdj] = useState(-500)
  const [calcOpen, setCalcOpen] = useState(false)

  useEffect(() => {
    if (latest?.metActivities) setMetActivities(latest.metActivities as MetActivity[])
    if (latest?.ventaTarget && latest?.get) setCaloricAdj(latest.ventaTarget - latest.get)
  }, [latest?.id])

  const metExp = useMemo(
    () => calculateDailyMetExpenditure(metActivities, latest?.weight || 0),
    [metActivities, latest?.weight],
  )

  const venta = useMemo(
    () => Math.max(0, Math.round((latest?.get || 0) + caloricAdj)),
    [latest?.get, caloricAdj],
  )

  const macros = useMemo(() => {
    const w = latest?.weight || 70
    const proteinG = Math.round(w * 2)
    const fatG = Math.round((venta * 0.25) / 9)
    const carbsG = Math.max(0, Math.round((venta - proteinG * 4 - fatG * 9) / 4))
    return { proteinG, fatG, carbsG }
  }, [venta, latest?.weight])

  if (!latest || !latest.tmb || !latest.get) {
    return (
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-[#FF9600]" /> Metabolismo e Gasto Energético
        </h3>
        <p className="text-sm font-bold text-muted-foreground text-center py-4">
          Registre uma avaliação com dados metabólicos para ver seu gasto energético.
        </p>
        <Button
          onClick={() => setCalcOpen(true)}
          className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold"
        >
          <Calculator className="w-4 h-4" /> Abrir Calculadora
        </Button>
        <MetabolicCalculatorModal open={calcOpen} onOpenChange={setCalcOpen} />
      </div>
    )
  }

  const methodologyLabel = latest.methodologyUsed
    ? { mifflin: 'Mifflin-St Jeor', harris: 'Harris-Benedict', katch: 'Katch-McArdle' }[
        latest.methodologyUsed as Methodology
      ] || 'Mifflin-St Jeor'
    : 'Mifflin-St Jeor'

  const pieData = [
    { name: 'Metabolismo Basal', value: latest.tmb, fill: '#1CB0F6' },
    { name: 'Exercício (MET)', value: Math.round(metExp), fill: '#FF9600' },
  ].filter((d) => d.value > 0)

  const handleSave = async () => {
    if (!latest?.id) return
    const { error } = await (supabase as any)
      .from('body_metrics')
      .update({ met_activities: metActivities, venta_target: venta })
      .eq('id', latest.id)
    if (error) {
      toast.error('Erro ao salvar dados metabólicos.')
    } else {
      toast.success('Dados metabólicos salvos!')
      fetchBodyMetrics()
    }
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF9600]" /> Metabolismo e Gasto Energético
        </h3>
        <Button
          onClick={() => setCalcOpen(true)}
          variant="outline"
          className="rounded-2xl border-2 font-bold text-xs"
        >
          <Calculator className="w-4 h-4" /> Calculadora
        </Button>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground">
        Método: {methodologyLabel} · NAF:{' '}
        {getActivityFactor(
          (latest.methodologyUsed as Methodology) || 'mifflin',
          (latest.activityLevel as ActivityLevel) || 'sedentary',
        )}
      </p>

      <div className="grid grid-cols-3 gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold">Meta Déficit/Superávit</span>
              <span
                className={cn(
                  'text-sm font-extrabold',
                  caloricAdj < 0
                    ? 'text-[#FF4B4B]'
                    : caloricAdj > 0
                      ? 'text-[#58CC02]'
                      : 'text-[#1CB0F6]',
                )}
              >
                {caloricAdj > 0 ? '+' : ''}
                {caloricAdj} kcal
              </span>
            </div>
            <Slider
              value={[caloricAdj]}
              min={-1000}
              max={500}
              step={50}
              onValueChange={([v]) => setCaloricAdj(v)}
            />
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground mt-1">
              <span>-1000</span>
              <span>0</span>
              <span>+500</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-extrabold">Macros ({venta} kcal)</p>
            {[
              { label: 'Proteína', g: macros.proteinG, color: '#FF4B4B', emoji: '🥩' },
              { label: 'Carbo', g: macros.carbsG, color: '#FFC800', emoji: '🍞' },
              { label: 'Gordura', g: macros.fatG, color: '#1CB0F6', emoji: '🥑' },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between bg-muted/30 rounded-xl p-2"
              >
                <span className="text-xs font-bold flex items-center gap-1">
                  {m.emoji} {m.label}
                </span>
                <span className="text-sm font-extrabold" style={{ color: m.color }}>
                  {m.g}g
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t-2 border-muted pt-4">
        <h4 className="text-sm font-extrabold mb-3">🏃 Atividades (MET)</h4>
        <MetActivityTable
          activities={metActivities}
          onChange={setMetActivities}
          weight={latest.weight || 0}
        />
      </div>

      <Button
        onClick={handleSave}
        className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold"
      >
        <Save className="w-4 h-4" /> Salvar Dados Metabólicos
      </Button>
      <MetabolicCalculatorModal open={calcOpen} onOpenChange={setCalcOpen} />
    </div>
  )
}
