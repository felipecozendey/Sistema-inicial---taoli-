import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Flame, Zap, Target, Save, Stethoscope, Check } from 'lucide-react'
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
import { useProfessionalPatientWrite } from '@/hooks/use-professional-patient-write'

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
  patientName: string
  latestMetric?: any | null
  editLog?: any | null
  onSuccess?: () => void
}

export function ProfessionalMetabolicModal({
  open,
  onOpenChange,
  patientName,
  latestMetric,
  editLog,
  onSuccess,
}: Props) {
  const { createMetabolicLogForPatient, updateMetabolicLogForPatient } =
    useProfessionalPatientWrite()

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
  const [saving, setSaving] = useState(false)

  const formulaGroup = getFormulaGroup(formula)
  const groupActivities = getGroupActivities(formulaGroup)
  const isEer = formula === 'eer_2005' || formula === 'eer_2023'
  const currentCondition = getClinicalCondition(clinicalCondition)
  const isFixedCondition = currentCondition?.type === 'fixed'
  const wNum = parseFloat(weight) || 0

  useEffect(() => {
    if (!open) return
    if (editLog) {
      setFormula((editLog.formula || 'mifflin') as CalcFormula)
      setActivityLevel(editLog.naf || '')
      setInjuryFactor(String(editLog.injury_factor || editLog.injuryFactor || 1.0))
      setWeightVariation(String(editLog.weight_goal || editLog.weightGoal || ''))
      setDaysForGoal(String(editLog.goal_days || editLog.goalDays || ''))
      setActivities(
        (editLog.extra_activities || editLog.extraActivities || []).map((a: any) => ({
          id: a.id || genId(),
          item_name: a.item_name || a.name || '',
          met_value: a.met_value || a.met || 0,
          duration_min: a.duration_min || a.duration || 0,
          frequency: a.frequency || a.weeklyFrequency || 0,
          energy_kcal: a.energy_kcal || 0,
        })),
      )
    } else if (latestMetric) {
      setWeight(latestMetric?.weight ? String(latestMetric.weight) : '')
      setHeight(latestMetric?.height ? String(latestMetric.height) : '')
      setLeanMass(
        latestMetric?.lean_mass
          ? String(latestMetric.lean_mass)
          : latestMetric?.leanMass
            ? String(latestMetric.leanMass)
            : '',
      )
      setAge(latestMetric?.age ? String(latestMetric.age) : '')
      setGender((latestMetric?.gender as Gender) || 'male')
      setProfile(
        (latestMetric?.patient_profile ||
          latestMetric?.patientProfile ||
          'patient') as PatientProfile,
      )
      setFormula(
        (latestMetric?.calc_formula || latestMetric?.calcFormula || 'mifflin') as CalcFormula,
      )
      const storedAct = latestMetric?.activity_level || latestMetric?.activityLevel
      const isNumeric = storedAct && !isNaN(parseFloat(storedAct))
      setActivityLevel(isNumeric ? storedAct : '')
      const injVal =
        latestMetric?.injury_factor || latestMetric?.injuryFactor
          ? Number(latestMetric?.injury_factor || latestMetric?.injuryFactor)
          : 1.0
      setInjuryFactor(String(injVal))
      setClinicalCondition(inferClinicalCondition(injVal))
      setWeightVariation(latestMetric?.target_weight ? String(latestMetric.target_weight) : '')
      setDaysForGoal(latestMetric?.days_for_goal ? String(latestMetric.days_for_goal) : '')
    }
  }, [open, latestMetric, editLog])

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
    if (!result) {
      toast.error('Preencha os campos obrigatórios (peso, altura, idade e nível NAF).')
      return
    }

    const parsedWeight = parseFloat(weight)
    const parsedHeight = parseFloat(height)
    const parsedAge = parseInt(age, 10)

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      toast.error('Informe um peso válido maior que zero.')
      return
    }
    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      toast.error('Informe uma altura válida maior que zero.')
      return
    }
    if (isNaN(parsedAge) || parsedAge <= 0) {
      toast.error('Informe uma idade válida.')
      return
    }

    const metJson = activities.map((a) => ({
      id: a.id,
      item_name: a.item_name,
      met_value: a.met_value,
      duration_min: a.duration_min,
      frequency: a.frequency,
      energy_kcal: calculateActivityBurn(a.met_value, wNum, a.duration_min),
    }))

    const logPayload = {
      formula,
      tmb: result.tmb,
      naf: activityLevel,
      injury_factor: parseFloat(injuryFactor) || 1.0,
      venta_target: result.ventaFinal,
      extra_activities: metJson,
      weight_goal: weightVariation ? parseFloat(weightVariation) : null,
      goal_days: parseInt(daysForGoal) || null,
      date: new Date().toISOString().slice(0, 10),
    }

    setSaving(true)
    let res = null
    if (editLog?.id) {
      res = await updateMetabolicLogForPatient(editLog.id, logPayload)
    } else {
      res = await createMetabolicLogForPatient(logPayload)
    }
    setSaving(false)

    if (res) {
      toast.success(
        editLog
          ? `Cálculo energético atualizado para ${patientName}! 🔥`
          : `Cálculo energético registrado para ${patientName}! 🔥`,
      )
      onOpenChange(false)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white bg-[#1CB0F6]">
              <Stethoscope className="w-3 h-3" />
              Prescrição Clínica
            </span>
            <span className="text-xs font-bold text-muted-foreground truncate">
              Paciente: <strong>{patientName}</strong>
            </span>
          </div>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            {editLog
              ? 'Editar Cálculo Energético'
              : 'Registrar Cálculo Energético (Ato Energético)'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Calcule TMB, GET e VENTA personalizado para o paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="font-bold text-sm">Dados Antropométricos</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Peso (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="75.5"
                  className="rounded-2xl border-2 font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Altura (cm)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className="rounded-2xl border-2 font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Massa Magra (kg)</Label>
                <Input
                  type="number"
                  value={leanMass}
                  onChange={(e) => setLeanMass(e.target.value)}
                  placeholder="Opcional"
                  className="rounded-2xl border-2 font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Idade</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  className="rounded-2xl border-2 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Sexo Biológico</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger className="rounded-2xl border-2 font-bold">
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
            <Label className="font-bold text-sm">Fórmula e NAF</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Fórmula</Label>
                <Select value={formula} onValueChange={handleFormulaChange}>
                  <SelectTrigger className="rounded-2xl border-2 font-bold">
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
                <Label className="text-xs font-bold text-muted-foreground">NAF</Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger className="rounded-2xl border-2 font-bold">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groupActivities.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label} ({a.factor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-sm">Condição Clínica / Fator Injúria</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={clinicalCondition} onValueChange={setClinicalCondition}>
                <SelectTrigger className="rounded-2xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLINICAL_CONDITIONS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.05"
                value={injuryFactor}
                onChange={(e) => setInjuryFactor(e.target.value)}
                disabled={isFixedCondition}
                className="rounded-2xl border-2 font-bold"
                placeholder="Fator (ex: 1.2)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-sm">Meta de Peso e Prazo</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">
                  Variação de Peso (kg, negativo para perda)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  value={weightVariation}
                  onChange={(e) => setWeightVariation(e.target.value)}
                  placeholder="Ex: -5"
                  className="rounded-2xl border-2 font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Prazo (dias)</Label>
                <Input
                  type="number"
                  value={daysForGoal}
                  onChange={(e) => setDaysForGoal(e.target.value)}
                  placeholder="Ex: 60"
                  className="rounded-2xl border-2 font-bold"
                />
              </div>
            </div>
          </div>

          <MetabolicActivityList activities={activities} weightKg={wNum} onChange={setActivities} />

          {result && (
            <div className="p-4 rounded-3xl bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/40 space-y-2">
              <div className="text-xs font-extrabold uppercase text-[#1CB0F6] tracking-wider">
                Resultado do Planejamento
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-2xl bg-card border">
                  <div className="text-[10px] font-bold text-muted-foreground">TMB</div>
                  <div className="text-base font-black text-foreground">
                    {Math.round(result.tmb)} kcal
                  </div>
                </div>
                <div className="p-2 rounded-2xl bg-card border">
                  <div className="text-[10px] font-bold text-muted-foreground">GET</div>
                  <div className="text-base font-black text-[#58CC02]">
                    {Math.round(result.get)} kcal
                  </div>
                </div>
                <div className="p-2 rounded-2xl bg-card border">
                  <div className="text-[10px] font-bold text-muted-foreground">VENTA Final</div>
                  <div className="text-base font-black text-[#1CB0F6]">
                    {Math.round(result.ventaFinal)} kcal
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving || !result}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Check className="w-5 h-5 mr-2" strokeWidth={3} />
            {saving
              ? 'Salvando cálculo...'
              : editLog
                ? 'Atualizar Cálculo Energético'
                : 'Salvar Cálculo Energético'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
