import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { MetActivityTable } from '@/components/health/met-activity-table'
import { calculateDailyMetExpenditure, MetActivity } from '@/lib/metabolic-utils'
import {
  CALC_FORMULA_LABELS,
  PATIENT_PROFILE_LABELS,
  type CalcFormula,
  type PatientProfile,
} from '@/lib/metabolic-math'
import { Flame, Save, Plus, AlertTriangle, User, Calculator } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

const LEAN_MASS_FORMULAS: string[] = ['katch_mcardle', 'cunningham', 'tinsley_lean']

const chartConfig = {
  bmr: { label: 'Metabolismo Basal', color: '#1CB0F6' },
  met: { label: 'Exercício (MET)', color: '#FF9600' },
} satisfies ChartConfig

interface Props {
  selectedDate: Date
}

export function MetabolicDashboard({ selectedDate }: Props) {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const fetchBodyMetrics = useAppStore((s) => s.fetchBodyMetrics)

  const selectedDateStr = selectedDate.toISOString().split('T')[0]

  const metric = useMemo(() => {
    if (!bodyMetrics?.length) return null
    const sorted = [...bodyMetrics].sort((a, b) => String(b.date).localeCompare(String(a.date)))
    return sorted.find((m) => m.date <= selectedDateStr) || null
  }, [bodyMetrics, selectedDateStr])

  const [metActivities, setMetActivities] = useState<MetActivity[]>([])
  const [caloricAdj, setCaloricAdj] = useState(-500)
  const [calcOpen, setCalcOpen] = useState(false)

  useEffect(() => {
    if (metric?.metActivities) setMetActivities(metric.metActivities as MetActivity[])
    if (metric?.ventaTarget && metric?.get) setCaloricAdj(metric.ventaTarget - metric.get)
  }, [metric?.id])

  const metExp = useMemo(
    () => calculateDailyMetExpenditure(metActivities, metric?.weight || 0),
    [metActivities, metric?.weight],
  )

  const venta = useMemo(
    () => Math.max(0, Math.round((metric?.get || 0) + caloricAdj)),
    [metric?.get, caloricAdj],
  )

  const macros = useMemo(() => {
    const w = metric?.weight || 70
    const proteinG = Math.round(w * 2)
    const fatG = Math.round((venta * 0.25) / 9)
    const carbsG = Math.max(0, Math.round((venta - proteinG * 4 - fatG * 9) / 4))
    return { proteinG, fatG, carbsG }
  }, [venta, metric?.weight])

  const needsLeanMass = metric?.calcFormula
    ? LEAN_MASS_FORMULAS.includes(metric.calcFormula)
    : false
  const hasLeanMass = !!(metric?.leanMass && metric.leanMass > 0)

  const formulaLabel = metric?.calcFormula
    ? CALC_FORMULA_LABELS[metric.calcFormula as CalcFormula] || metric.calcFormula
    : 'Mifflin-St Jeor (1990)'

  const profileLabel = metric?.patientProfile
    ? PATIENT_PROFILE_LABELS[metric.patientProfile as PatientProfile] || metric.patientProfile
    : 'Paciente'

  if (!metric || !metric.tmb || !metric.get) {
    return (
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF9600]" /> Metabolismo e Gasto Energético
        </h3>
        <p className="text-sm font-bold text-muted-foreground text-center py-4">
          {bodyMetrics?.length
            ? 'Nenhum dado metabólico para a data selecionada.'
            : 'Registre uma avaliação com dados metabólicos para ver seu gasto energético.'}
        </p>
        <Button
          onClick={() => setCalcOpen(true)}
          className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold"
        >
          <Plus className="w-4 h-4" /> Novo Gasto Energético
        </Button>
        <MetabolicCalculatorModal open={calcOpen} onOpenChange={setCalcOpen} />
      </div>
    )
  }

  const pieData = [
    { name: 'Metabolismo Basal', value: metric.tmb, fill: '#1CB0F6' },
    { name: 'Exercício (MET)', value: Math.round(metExp), fill: '#FF9600' },
  ].filter((d) => d.value > 0)

  const handleSave = async () => {
    if (!metric?.id) return
    const { error } = await (supabase as any)
      .from('body_metrics')
      .update({ met_activities: metActivities, venta_target: venta })
      .eq('id', metric.id)
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
          className="bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold text-xs"
        >
          <Plus className="w-4 h-4" /> Novo Gasto Energético
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#1CB0F6]/10 rounded-full px-3 py-1">
          <User className="w-3.5 h-3.5 text-[#1CB0F6]" />
          <span className="text-xs font-bold text-[#1CB0F6]">{profileLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/30 rounded-full px-3 py-1">
          <Calculator className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">{formulaLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/30 rounded-full px-3 py-1">
          <span className="text-xs font-bold text-muted-foreground">
            NAF: {metric.activityLevel || '—'}
          </span>
        </div>
      </div>

      {needsLeanMass && !hasLeanMass && (
        <Alert className="border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
            A fórmula {formulaLabel} requer Massa Magra, que não foi informada nesta avaliação. Abra
            a calculadora para inserir esse dado.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">TMB</p>
          <p className="text-xl font-extrabold text-[#1CB0F6]">{metric.tmb}</p>
          <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
        </div>
        <div className="bg-[#FF9600]/10 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">GET</p>
          <p className="text-xl font-extrabold text-[#FF9600]">{metric.get}</p>
          <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
        </div>
        <div className="bg-[#58CC02]/10 rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-bold text-muted-foreground">VENTA</p>
          <Badge className="text-base font-extrabold bg-[#58CC02] text-white hover:bg-[#58CC02] px-3 py-1">
            {venta}
          </Badge>
          <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
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
          weight={metric.weight || 0}
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
