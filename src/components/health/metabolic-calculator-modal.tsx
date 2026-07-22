import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Flame, Zap } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  CALC_FORMULA_LABELS,
  PATIENT_PROFILE_LABELS,
  calculateBMR,
  calculateActivitiesTotal,
  calculateVENTA,
  calculateActivityBurn,
  type CalcFormula,
  type PatientProfile,
  type BMRInput,
  type MetActivityItem,
} from '@/lib/metabolic-math'
import {
  getActivityOptions,
  getActivityFactor,
  type Methodology,
  type ActivityLevel,
  type Gender,
} from '@/lib/metabolic-utils'
import { MetabolicActivityList } from '@/components/health/metabolic-activity-list'

const genId = () => Math.random().toString(36).substring(2, 11)

function formulaToMethodology(formula: CalcFormula): Methodology {
  if (formula.startsWith('harris')) return 'harris'
  if (formula === 'katch_mcardle' || formula === 'cunningham' || formula === 'tinsley_lean')
    return 'katch'
  return 'mifflin'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MetabolicCalculatorModal({ open, onOpenChange }: Props) {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const fetchBodyMetrics = useAppStore((s) => s.fetchBodyMetrics)

  const latest = useMemo(
    () => [...bodyMetrics].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0],
    [bodyMetrics],
  )

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [leanMass, setLeanMass] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [profile, setProfile] = useState<PatientProfile>('patient')
  const [formula, setFormula] = useState<CalcFormula>('mifflin')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary')
  const [injuryFactor, setInjuryFactor] = useState('1.0')
  const [activities, setActivities] = useState<MetActivityItem[]>([])

  useEffect(() => {
    if (!open) return
    setWeight(latest?.weight ? String(latest.weight) : '')
    setHeight(latest?.height ? String(latest.height) : '')
    setLeanMass(latest?.leanMass ? String(latest.leanMass) : '')
    setAge(latest?.age ? String(latest.age) : '')
    setGender((latest?.gender as Gender) || 'male')
    setProfile((latest?.patientProfile as PatientProfile) || 'patient')
    setFormula((latest?.calcFormula as CalcFormula) || 'mifflin')
    setActivityLevel((latest?.activityLevel as ActivityLevel) || 'sedentary')
    setInjuryFactor(latest?.injuryFactor ? String(latest.injuryFactor) : '1.0')
    setActivities(
      (latest?.metActivities || []).map((a: any) => ({
        id: a.id || genId(),
        item_name: a.item_name || a.name || '',
        met_value: a.met_value || a.met || 0,
        duration_min: a.duration_min || a.duration || 0,
        frequency: a.frequency || a.weeklyFrequency || 0,
        energy_kcal: a.energy_kcal || 0,
      })),
    )
  }, [open])

  const methodology = formulaToMethodology(formula)
  const actOptions = getActivityOptions(methodology).filter((o) => o.value !== 'none')
  const actFactor = getActivityFactor(methodology, activityLevel)
  const isEer = formula === 'eer_2005' || formula === 'eer_2023'
  const wNum = parseFloat(weight) || 0

  const result = useMemo(() => {
    const h = parseFloat(height)
    const a = parseInt(age)
    if (!wNum || !h || !a) return null
    const lm = leanMass ? parseFloat(leanMass) : undefined
    const inj = parseFloat(injuryFactor) || 1.0
    try {
      const bmrInput: BMRInput = {
        weight: wNum,
        height: h,
        age: a,
        gender,
        leanMass: lm,
        formula,
        paCoefficient: isEer ? 1.0 : undefined,
      }
      const tmb = calculateBMR(bmrInput)
      const actTotal = calculateActivitiesTotal(activities, wNum)
      const get = calculateVENTA(tmb, actFactor, inj, actTotal)
      return { tmb, get, actTotal }
    } catch {
      return null
    }
  }, [
    weight,
    height,
    age,
    leanMass,
    injuryFactor,
    gender,
    formula,
    isEer,
    activities,
    wNum,
    actFactor,
  ])

  const handleSubmit = async () => {
    if (!result) return
    onOpenChange(false)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const metJson = activities.map((a) => ({
      id: a.id,
      item_name: a.item_name,
      met_value: a.met_value,
      duration_min: a.duration_min,
      frequency: a.frequency,
      energy_kcal: calculateActivityBurn(a.met_value, wNum, a.duration_min),
    }))

    const payload = {
      weight: wNum,
      height: parseFloat(height) || null,
      lean_mass: leanMass ? parseFloat(leanMass) : null,
      age: parseInt(age) || null,
      gender,
      patient_profile: profile,
      calc_formula: formula,
      injury_factor: parseFloat(injuryFactor) || 1.0,
      met_activities: metJson,
      tmb: result.tmb,
      get: result.get,
      venta_target: result.get,
      methodology_used: methodology,
      activity_level: activityLevel,
    }

    let error
    if (latest?.id) {
      ;({ error } = await (supabase as any)
        .from('body_metrics')
        .update(payload)
        .eq('id', latest.id))
    } else {
      ;({ error } = await (supabase as any)
        .from('body_metrics')
        .insert({ ...payload, user_id: user.id }))
    }

    if (error) {
      toast.error('Erro ao salvar dados metabólicos.')
    } else {
      toast.success('VENTA calculada e salva com sucesso!')
      fetchBodyMetrics()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF9600]" /> Calculadora Metabólica Avançada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Label className="font-bold text-sm">Dados do Paciente</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Peso (kg)</Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.5"
                className="rounded-2xl border-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Altura (cm)</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="rounded-2xl border-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Massa Magra (kg) *</Label>
              <Input
                type="number"
                value={leanMass}
                onChange={(e) => setLeanMass(e.target.value)}
                placeholder="Opcional"
                className="rounded-2xl border-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Idade</Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
                className="rounded-2xl border-2"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Sexo</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger className="rounded-2xl border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-sm">Perfil Clínico</Label>
          <ToggleGroup
            type="single"
            value={profile}
            onValueChange={(v) => v && setProfile(v as PatientProfile)}
            className="grid grid-cols-4 gap-2"
          >
            {(Object.keys(PATIENT_PROFILE_LABELS) as PatientProfile[]).map((p) => (
              <ToggleGroupItem
                key={p}
                value={p}
                className="rounded-2xl border-2 font-bold text-xs data-[state=on]:bg-[#1CB0F6] data-[state=on]:text-white data-[state=on]:border-[#1CB0F6]"
              >
                {PATIENT_PROFILE_LABELS[p]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-3">
          <Label className="font-bold text-sm">Fórmula e Atividade</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Fórmula</Label>
              <Select value={formula} onValueChange={(v) => setFormula(v as CalcFormula)}>
                <SelectTrigger className="rounded-2xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CALC_FORMULA_LABELS) as CalcFormula[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {CALC_FORMULA_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Atividade (NAF)</Label>
              <Select
                value={activityLevel}
                onValueChange={(v) => setActivityLevel(v as ActivityLevel)}
              >
                <SelectTrigger className="rounded-2xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Fator de Lesão</Label>
            <Input
              type="number"
              step="0.1"
              value={injuryFactor}
              onChange={(e) => setInjuryFactor(e.target.value)}
              className="rounded-2xl border-2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-sm flex items-center gap-1">
            <Zap className="w-4 h-4 text-[#FF9600]" /> Atividades Físicas
          </Label>
          <MetabolicActivityList activities={activities} onChange={setActivities} weight={wNum} />
        </div>

        {result && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground">TMB</p>
              <p className="text-xl font-extrabold text-[#1CB0F6]">{result.tmb}</p>
              <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
            </div>
            <div className="bg-[#FF9600]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground">Atividades</p>
              <p className="text-xl font-extrabold text-[#FF9600]">{result.actTotal}</p>
              <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
            </div>
            <div className="bg-[#58CC02]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground">VENTA</p>
              <p className="text-xl font-extrabold text-[#58CC02]">{result.get}</p>
              <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!result}
            className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-extrabold disabled:opacity-50"
          >
            Calcular VENTA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
