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
import { Flame, Zap, Target, Save } from 'lucide-react'
import { useAppStore, type MetabolicLog } from '@/stores/useAppStore'
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
  getFormulaGroup,
  getGroupActivities,
  CLINICAL_CONDITIONS,
  getClinicalCondition,
  inferClinicalCondition,
  type Gender,
} from '@/lib/metabolic-utils'
import { MetabolicActivityList } from '@/components/health/metabolic-activity-list'

const genId = () => Math.random().toString(36).substring(2, 11)

function formulaToMethodology(formula: CalcFormula): string {
  if (formula.startsWith('harris')) return 'harris'
  if (formula === 'katch_mcardle' || formula === 'cunningham' || formula === 'tinsley_lean')
    return 'katch'
  return 'mifflin'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editLog?: MetabolicLog | null
}

export function MetabolicCalculatorModal({ open, onOpenChange, editLog }: Props) {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const fetchBodyMetrics = useAppStore((s) => s.fetchBodyMetrics)
  const saveMetabolicLog = useAppStore((s) => s.saveMetabolicLog)

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
  const [activityLevel, setActivityLevel] = useState<string>('')
  const [clinicalCondition, setClinicalCondition] = useState<string>('healthy')
  const [injuryFactor, setInjuryFactor] = useState('1.0')
  const [weightVariation, setWeightVariation] = useState('')
  const [daysForGoal, setDaysForGoal] = useState('')
  const [activities, setActivities] = useState<MetActivityItem[]>([])

  const formulaGroup = getFormulaGroup(formula)
  const groupActivities = getGroupActivities(formulaGroup)
  const isEer = formula === 'eer_2005' || formula === 'eer_2023'
  const currentCondition = getClinicalCondition(clinicalCondition)
  const isFixedCondition = currentCondition?.type === 'fixed'
  const wNum = parseFloat(weight) || 0

  useEffect(() => {
    if (!open) return
    setWeight(latest?.weight ? String(latest.weight) : '')
    setHeight(latest?.height ? String(latest.height) : '')
    setLeanMass(latest?.leanMass ? String(latest.leanMass) : '')
    setAge(latest?.age ? String(latest.age) : '')
    setGender((latest?.gender as Gender) || 'male')
    setProfile((latest?.patientProfile as PatientProfile) || 'patient')
    setFormula((latest?.calcFormula as CalcFormula) || 'mifflin')
    const storedAct = latest?.activityLevel
    const isNumeric = storedAct && !isNaN(parseFloat(storedAct))
    setActivityLevel(isNumeric ? storedAct : '')
    const injVal = latest?.injuryFactor ? Number(latest.injuryFactor) : 1.0
    setInjuryFactor(String(injVal))
    setClinicalCondition(inferClinicalCondition(injVal))
    setWeightVariation(latest?.targetWeight ? String(latest.targetWeight) : '')
    setDaysForGoal(latest?.daysForGoal ? String(latest.daysForGoal) : '')
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

  useEffect(() => {
    if (!open || !editLog) return
    setFormula(editLog.formula as CalcFormula)
    setActivityLevel(editLog.naf)
    setInjuryFactor(String(editLog.injuryFactor))
    setWeightVariation(editLog.weightGoal ? String(editLog.weightGoal) : '')
    setDaysForGoal(editLog.goalDays ? String(editLog.goalDays) : '')
    setActivities(
      (editLog.extraActivities || []).map((a: any) => ({
        id: a.id || genId(),
        item_name: a.item_name || a.name || '',
        met_value: a.met_value || a.met || 0,
        duration_min: a.duration_min || a.duration || 0,
        frequency: a.frequency || a.weeklyFrequency || 0,
        energy_kcal: a.energy_kcal || 0,
      })),
    )
  }, [open, editLog])

  useEffect(() => {
    const condition = getClinicalCondition(clinicalCondition)
    if (!condition) return
    if (condition.type === 'fixed' && condition.value !== undefined) {
      setInjuryFactor(String(condition.value))
    } else if (condition.type === 'range' && condition.min !== undefined) {
      setInjuryFactor((prev) => {
        const current = parseFloat(prev)
        if (
          isNaN(current) ||
          current < condition.min! ||
          (condition.max !== undefined && current > condition.max)
        ) {
          return String(condition.min)
        }
        return prev
      })
    }
  }, [clinicalCondition])

  const handleFormulaChange = (v: string) => {
    setFormula(v as CalcFormula)
    setActivityLevel('')
  }

  const actFactor = useMemo(() => {
    const selected = groupActivities.find((a) => a.value === activityLevel)
    return selected?.factor ?? 0
  }, [groupActivities, activityLevel])

  const result = useMemo(() => {
    const h = parseFloat(height)
    const a = parseInt(age)
    if (!wNum || !h || !a || !actFactor) return null
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
        paCoefficient: isEer ? actFactor : undefined,
      }
      const tmb = calculateBMR(bmrInput)
      const actTotal = calculateActivitiesTotal(activities, wNum)
      const nafMultiplier = isEer ? 1.0 : actFactor
      const get = calculateVENTA(tmb, nafMultiplier, inj, actTotal)
      const wv = parseFloat(weightVariation) || 0
      const dfg = parseInt(daysForGoal) || 0
      const dailyAdjustment = dfg > 0 ? Math.round((wv * 7700) / dfg) : 0
      const ventaFinal = get + dailyAdjustment
      return { tmb, get, actTotal, dailyAdjustment, ventaFinal }
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
    weightVariation,
    daysForGoal,
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
      venta_target: result.ventaFinal,
      methodology_used: formulaToMethodology(formula),
      activity_level: activityLevel,
      target_weight: weightVariation ? parseFloat(weightVariation) : null,
      days_for_goal: parseInt(daysForGoal) || null,
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
      toast.success('Avaliação metabólica salva com sucesso!')
      fetchBodyMetrics()
    }

    saveMetabolicLog({
      formula,
      tmb: result.tmb,
      naf: activityLevel,
      injuryFactor: parseFloat(injuryFactor) || 1.0,
      ventaTarget: result.ventaFinal,
      extraActivities: metJson,
      weightGoal: weightVariation ? parseFloat(weightVariation) : null,
      goalDays: parseInt(daysForGoal) || null,
      date: editLog?.date,
    })
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
          <Label className="font-bold text-sm">Fórmula e Nível de Atividade (NAF)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Fórmula</Label>
              <Select value={formula} onValueChange={handleFormulaChange}>
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
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger className="rounded-2xl border-2">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {groupActivities.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="font-bold text-sm">Fator de Lesão/Stress Clínico</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Condição Clínica</Label>
              <Select value={clinicalCondition} onValueChange={setClinicalCondition}>
                <SelectTrigger className="rounded-2xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLINICAL_CONDITIONS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">
                {isFixedCondition
                  ? 'Fator (Fixo)'
                  : `Fator (${currentCondition?.min} - ${currentCondition?.max})`}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={injuryFactor}
                onChange={(e) => setInjuryFactor(e.target.value)}
                disabled={isFixedCondition}
                min={currentCondition?.min}
                max={currentCondition?.max}
                className="rounded-2xl border-2 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-sm flex items-center gap-1">
            <Zap className="w-4 h-4 text-[#FF9600]" /> Atividades Físicas
          </Label>
          <MetabolicActivityList activities={activities} onChange={setActivities} weight={wNum} />
        </div>

        <div className="space-y-3 bg-muted/30 rounded-2xl p-3">
          <Label className="font-bold text-sm flex items-center gap-1">
            <Target className="w-4 h-4 text-[#58CC02]" /> Meta e Planejamento de Peso
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">
                Variação de Peso (kg)
              </Label>
              <Input
                type="number"
                value={weightVariation}
                onChange={(e) => setWeightVariation(e.target.value)}
                placeholder="-5 (perda) ou +3 (ganho)"
                className="rounded-2xl border-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Prazo (dias)</Label>
              <Input
                type="number"
                value={daysForGoal}
                onChange={(e) => setDaysForGoal(e.target.value)}
                placeholder="90"
                className="rounded-2xl border-2"
              />
            </div>
          </div>
          {result && result.dailyAdjustment !== 0 && (
            <div className="flex items-center justify-between bg-[#FF9600]/10 rounded-xl px-3 py-2">
              <span className="text-xs font-bold text-muted-foreground">Ajuste Diário</span>
              <span
                className={
                  'text-sm font-extrabold ' +
                  (result.dailyAdjustment < 0 ? 'text-[#FF4B4B]' : 'text-[#58CC02]')
                }
              >
                {result.dailyAdjustment > 0 ? '+' : ''}
                {result.dailyAdjustment} kcal/dia
              </span>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-muted-foreground">TMB</p>
                <p className="text-xl font-extrabold text-[#1CB0F6]">{result.tmb}</p>
                <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
              </div>
              <div className="bg-[#FF9600]/10 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-muted-foreground">GET</p>
                <p className="text-xl font-extrabold text-[#FF9600]">{result.get}</p>
                <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
              </div>
              <div className="bg-[#58CC02]/10 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-muted-foreground">VENTA</p>
                <p className="text-xl font-extrabold text-[#58CC02]">{result.ventaFinal}</p>
                <p className="text-[9px] font-bold text-muted-foreground">kcal/dia</p>
              </div>
            </div>
            <div className="bg-[#58CC02]/10 rounded-2xl p-4 text-center border-2 border-[#58CC02]/30">
              <p className="text-xs font-bold text-muted-foreground mb-1">
                VENTA Final (Alvo Calórico)
              </p>
              <p className="text-4xl font-extrabold text-[#58CC02]">{result.ventaFinal}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">kcal/dia</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!result}
            className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-extrabold disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Salvar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
