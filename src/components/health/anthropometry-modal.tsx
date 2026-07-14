import { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GameButton } from '@/components/ui/game-button'
import { MetActivityTable } from '@/components/health/met-activity-table'
import { useAppStore } from '@/stores/useAppStore'
import { uploadImage } from '@/lib/image-upload'
import {
  calculateTMBByMethod,
  calculateGETAdvanced,
  calculateDailyMetExpenditure,
  calculateVENTA,
  calculateBolsoRange,
  INJURY_FACTORS,
  INJURY_LABELS,
  METHODOLOGY_LABELS,
  getActivityOptions,
  getActivityFactor,
  ActivityLevel,
  Methodology,
  InjuryFactorType,
  MetActivity,
} from '@/lib/metabolic-utils'
import {
  calculateIMC,
  calculateRCQ,
  getRCQStatus,
  getIMCStatus,
  calculateBodyDensity7,
  calculateFatFromDensity,
  calculateFatMass,
  calculateLeanMass,
  Gender,
} from '@/lib/anthropometry'
import { toast } from 'sonner'
import { Camera, X, Loader2, AlertTriangle, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const PERIMETERS = [
  { key: 'waist', label: 'Cintura', emoji: '📏' },
  { key: 'hip', label: 'Quadril', emoji: '📐' },
  { key: 'arm', label: 'Braço', emoji: '💪' },
  { key: 'thigh', label: 'Coxa', emoji: '🦵' },
  { key: 'calf', label: 'Panturrilha', emoji: '🦶' },
]

const SKINFOLDS = [
  { key: 'triceps', label: 'Tríceps' },
  { key: 'chest', label: 'Peitoral' },
  { key: 'subscapular', label: 'Subescapular' },
  { key: 'midaxillary', label: 'Axilar Média' },
  { key: 'suprailiac', label: 'Supra-ilíaca' },
  { key: 'abdominal', label: 'Abdominal' },
  { key: 'thigh', label: 'Coxa' },
]

const PRIMARY_GOALS = ['Hipertrofia', 'Emagrecimento', 'Manutenção']
const SLEEP_EMOJIS = ['😴', '😪', '😐', '🙂', '😄']
const STRESS_EMOJIS = ['😌', '🙂', '😐', '😟', '😰']
const METHODOLOGY_OPTIONS: Methodology[] = ['mifflin', 'harris', 'katch']
const INJURY_OPTIONS: InjuryFactorType[] = ['healthy', 'surgery', 'trauma', 'sepsis']

export function AnthropometryModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const addBodyMetric = useAppStore((s) => s.addBodyMetric)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [heartRate, setHeartRate] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [sleepQuality, setSleepQuality] = useState(3)
  const [stressLevel, setStressLevel] = useState(3)
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [perimeters, setPerimeters] = useState<Record<string, string>>({})
  const [skinfolds, setSkinfolds] = useState<Record<string, string>>({})
  const [compositionMode, setCompositionMode] = useState<'bioimpedance' | 'skinfolds'>(
    'bioimpedance',
  )
  const [bodyFat, setBodyFat] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [bodyWater, setBodyWater] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [methodology, setMethodology] = useState<Methodology>('mifflin')
  const [injuryFactorType, setInjuryFactorType] = useState<InjuryFactorType>('healthy')
  const [metActivities, setMetActivities] = useState<MetActivity[]>([])
  const [targetWeight, setTargetWeight] = useState('')
  const [daysForGoal, setDaysForGoal] = useState('')

  const w = parseFloat(weight) || 0
  const h = parseFloat(height) || 0
  const a = parseInt(age) || 0

  const sfValues: Record<string, number> = useMemo(() => {
    const vals: Record<string, number> = {}
    Object.entries(skinfolds).forEach(([k, v]) => {
      const n = parseFloat(v)
      if (!isNaN(n)) vals[k] = n
    })
    return vals
  }, [skinfolds])

  const calcBodyFat = useMemo(() => {
    if (compositionMode !== 'skinfolds' || a <= 0) return 0
    return calculateFatFromDensity(calculateBodyDensity7(gender, a, sfValues))
  }, [compositionMode, a, gender, sfValues])

  const currentBodyFat = compositionMode === 'skinfolds' ? calcBodyFat : parseFloat(bodyFat) || 0
  const fatMass = useMemo(() => calculateFatMass(w, currentBodyFat), [w, currentBodyFat])
  const leanMass = useMemo(() => calculateLeanMass(w, fatMass), [w, fatMass])
  const imc = useMemo(() => calculateIMC(w, h), [w, h])
  const rcq = useMemo(
    () => calculateRCQ(parseFloat(perimeters.waist) || 0, parseFloat(perimeters.hip) || 0),
    [perimeters.waist, perimeters.hip],
  )
  const rcqStatus = useMemo(() => getRCQStatus(rcq, gender), [rcq, gender])
  const imcStatus = useMemo(() => getIMCStatus(imc), [imc])

  const tmbLive = useMemo(() => {
    if (!w || !h || !a) return 0
    return calculateTMBByMethod(methodology, gender, w, h, a, leanMass)
  }, [methodology, gender, w, h, a, leanMass])

  const metDailyExpenditure = useMemo(
    () => calculateDailyMetExpenditure(metActivities, w),
    [metActivities, w],
  )

  const getLive = useMemo(() => {
    if (!tmbLive) return 0
    return calculateGETAdvanced(
      tmbLive,
      getActivityFactor(methodology, activityLevel),
      INJURY_FACTORS[injuryFactorType],
      metDailyExpenditure,
    )
  }, [tmbLive, activityLevel, methodology, injuryFactorType, metDailyExpenditure])

  const ventaLive = useMemo(
    () =>
      calculateVENTA(
        getLive,
        parseFloat(targetWeight) || undefined,
        w,
        parseInt(daysForGoal) || undefined,
      ),
    [getLive, targetWeight, w, daysForGoal],
  )
  const bolsoRange = useMemo(() => calculateBolsoRange(w, primaryGoal), [w, primaryGoal])

  const resetForm = useCallback(() => {
    setWeight('')
    setHeight('')
    setAge('')
    setGender('male')
    setActivityLevel('moderate')
    setHeartRate('')
    setBloodPressure('')
    setSleepQuality(3)
    setStressLevel(3)
    setPrimaryGoal('')
    setPerimeters({})
    setSkinfolds({})
    setCompositionMode('bioimpedance')
    setBodyFat('')
    setMuscleMass('')
    setBodyWater('')
    setPhotos([])
    setMethodology('mifflin')
    setInjuryFactorType('healthy')
    setMetActivities([])
    setTargetWeight('')
    setDaysForGoal('')
  }, [])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        urls.push(await uploadImage(file))
      }
      setPhotos((p) => [...p, ...urls])
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSave = () => {
    onOpenChange(false)
    const numericMeasurements: Record<string, number> = {}
    Object.entries(perimeters).forEach(([k, v]) => {
      const n = parseFloat(v)
      if (!isNaN(n)) numericMeasurements[k] = n
    })
    Object.entries(skinfolds).forEach(([k, v]) => {
      const n = parseFloat(v)
      if (!isNaN(n)) numericMeasurements[`sf_${k}`] = n
    })
    if (compositionMode === 'bioimpedance' && bodyWater)
      numericMeasurements.bodyWater = parseFloat(bodyWater)

    const tmb = h > 0 && a > 0 ? calculateTMBByMethod(methodology, gender, w, h, a, leanMass) : 0
    const metDaily = calculateDailyMetExpenditure(metActivities, w)
    const get =
      tmb > 0
        ? calculateGETAdvanced(
            tmb,
            getActivityFactor(methodology, activityLevel),
            INJURY_FACTORS[injuryFactorType],
            metDaily,
          )
        : 0
    const tw = parseFloat(targetWeight) || undefined
    const dg = parseInt(daysForGoal) || undefined
    const venta = calculateVENTA(get, tw, w, dg)

    addBodyMetric({
      date,
      weight: w,
      bodyFatPercentage: currentBodyFat,
      muscleMass: compositionMode === 'skinfolds' ? leanMass : parseFloat(muscleMass) || 0,
      measurements: numericMeasurements,
      photoUrls: photos,
      heartRateRest: parseInt(heartRate) || undefined,
      bloodPressure: bloodPressure || undefined,
      sleepQuality,
      stressLevel,
      primaryGoal: primaryGoal || undefined,
      gender,
      age: a,
      height: h,
      activityLevel,
      tmb,
      get,
      leanMass,
      fatMass,
      metActivities,
      methodologyUsed: methodology,
      injuryFactor: INJURY_FACTORS[injuryFactorType],
      ventaTarget: venta,
      targetWeight: tw,
      daysForGoal: dg,
    })
    resetForm()
    toast.success('Avaliação registrada!')
  }

  const inputCls = 'rounded-xl bg-muted/50 border-transparent font-semibold text-sm h-9'
  const labelCls = 'font-bold text-xs'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Nova Avaliação Física</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="vitals" className="mt-2">
          <TabsList className="grid grid-cols-3 rounded-2xl h-auto p-1">
            <TabsTrigger value="vitals" className="rounded-xl text-xs font-bold py-2">
              Básico & Vitais
            </TabsTrigger>
            <TabsTrigger value="body" className="rounded-xl text-xs font-bold py-2">
              Medidas
            </TabsTrigger>
            <TabsTrigger value="energy" className="rounded-xl text-xs font-bold py-2">
              Gasto Energético
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vitals" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelCls}>Data</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={inputCls}
                  placeholder="81.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelCls}>Altura (cm)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={inputCls}
                  placeholder="175"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Idade</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={inputCls}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelCls}>Sexo</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Objetivo Principal</Label>
                <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_GOALS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelCls}>Freq. Cardíaca (bpm)</Label>
                <Input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className={inputCls}
                  placeholder="65"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Pressão Arterial</Label>
                <Input
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className={inputCls}
                  placeholder="120/80"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Qualidade do Sono (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSleepQuality(n)}
                    className={cn(
                      'flex-1 py-2 rounded-xl border-2 border-b-4 font-extrabold text-sm transition-all active:translate-y-0.5',
                      sleepQuality === n
                        ? 'border-[#1CB0F6] bg-[#1CB0F6]/10'
                        : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                    )}
                  >
                    {SLEEP_EMOJIS[n - 1]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Nível de Estresse (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setStressLevel(n)}
                    className={cn(
                      'flex-1 py-2 rounded-xl border-2 border-b-4 font-extrabold text-sm transition-all active:translate-y-0.5',
                      stressLevel === n
                        ? 'border-[#FF9600] bg-[#FF9600]/10'
                        : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                    )}
                  >
                    {STRESS_EMOJIS[n - 1]}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="body" className="space-y-3 mt-3">
            <p className="text-xs font-extrabold text-muted-foreground">Perímetros Corporais</p>
            <div className="grid grid-cols-2 gap-3">
              {PERIMETERS.map((m) => (
                <div key={m.key} className="flex items-center gap-2">
                  <span className="text-lg shrink-0">{m.emoji}</span>
                  <div className="flex-1 space-y-1">
                    <Label className={labelCls}>{m.label} (cm)</Label>
                    <Input
                      type="number"
                      value={perimeters[m.key] || ''}
                      onChange={(e) => setPerimeters((p) => ({ ...p, [m.key]: e.target.value }))}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            {rcq > 0 && (
              <div
                className={cn(
                  'rounded-xl p-3 flex items-center gap-2',
                  rcqStatus.isRisk ? 'bg-[#FF4B4B]/10' : 'bg-[#58CC02]/10',
                )}
              >
                <AlertTriangle
                  className={cn('w-5 h-5', rcqStatus.isRisk ? 'text-[#FF4B4B]' : 'text-[#58CC02]')}
                />
                <div>
                  <p className="text-xs font-extrabold">RCQ: {rcq}</p>
                  <p
                    className={cn(
                      'text-[10px] font-bold',
                      rcqStatus.isRisk ? 'text-[#FF4B4B]' : 'text-[#58CC02]',
                    )}
                  >
                    {rcqStatus.label}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t-2 border-muted pt-3">
              <p className="text-xs font-extrabold text-muted-foreground mb-2">
                Composição Corporal
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setCompositionMode('bioimpedance')}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border-2 border-b-4 font-extrabold text-sm transition-all active:translate-y-0.5',
                    compositionMode === 'bioimpedance'
                      ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#1CB0F6]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                >
                  🔬 Bioimpedância
                </button>
                <button
                  onClick={() => setCompositionMode('skinfolds')}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border-2 border-b-4 font-extrabold text-sm transition-all active:translate-y-0.5',
                    compositionMode === 'skinfolds'
                      ? 'border-[#FF9600] bg-[#FF9600]/10 text-[#FF9600]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                >
                  📏 Dobras Cutâneas
                </button>
              </div>
              {compositionMode === 'bioimpedance' ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Gordura Corporal (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      className={inputCls}
                      placeholder="18.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Massa Muscular (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={muscleMass}
                      onChange={(e) => setMuscleMass(e.target.value)}
                      className={inputCls}
                      placeholder="64"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Água Corporal (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={bodyWater}
                      onChange={(e) => setBodyWater(e.target.value)}
                      className={inputCls}
                      placeholder="55"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {SKINFOLDS.map((s) => (
                    <div key={s.key} className="space-y-1">
                      <Label className={labelCls}>{s.label} (mm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={skinfolds[s.key] || ''}
                        onChange={(e) => setSkinfolds((p) => ({ ...p, [s.key]: e.target.value }))}
                        className={inputCls}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              )}
              {compositionMode === 'skinfolds' && calcBodyFat > 0 && (
                <div className="bg-[#FF9600]/10 rounded-xl p-3 text-center mt-3">
                  <p className="text-[10px] font-bold text-muted-foreground">
                    % Gordura Calculada (Jackson-Pollock 7 + Siri)
                  </p>
                  <p className="text-2xl font-extrabold text-[#FF9600]">{calcBodyFat}%</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="energy" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Nível de Atividade Física</Label>
              <Select
                value={activityLevel}
                onValueChange={(v) => setActivityLevel(v as ActivityLevel)}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getActivityOptions(methodology).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Metodologia de Cálculo</Label>
              <Select value={methodology} onValueChange={(v) => setMethodology(v as Methodology)}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODOLOGY_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {METHODOLOGY_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {methodology === 'katch' && leanMass <= 0 && (
              <div className="bg-[#FF4B4B]/10 rounded-xl p-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF4B4B] shrink-0" />
                <p className="text-xs font-bold text-[#FF4B4B]">
                  Katch-McArdle requer massa magra. Preencha composição corporal na aba anterior.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className={labelCls}>Fator de Lesão (Clinical Multiplier)</Label>
              <Select
                value={injuryFactorType}
                onValueChange={(v) => setInjuryFactorType(v as InjuryFactorType)}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INJURY_OPTIONS.map((inj) => (
                    <SelectItem key={inj} value={inj}>
                      {INJURY_LABELS[inj]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t-2 border-muted pt-3">
              <Label className={cn(labelCls, 'mb-2 block')}>Atividades Físicas (MET)</Label>
              <MetActivityTable activities={metActivities} onChange={setMetActivities} weight={w} />
            </div>

            <div className="border-t-2 border-muted pt-3 space-y-3">
              <div>
                <Label className={cn(labelCls, 'mb-2 block')}>Regra de Bolso</Label>
                {w > 0 ? (
                  <div className="bg-[#58CC02]/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {bolsoRange.label} · Peso: {w} kg
                    </p>
                    <p className="text-2xl font-extrabold text-[#58CC02]">
                      {bolsoRange.min} - {bolsoRange.max} kcal/dia
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-muted-foreground text-center py-2">
                    Informe o peso para calcular.
                  </p>
                )}
              </div>
              <div>
                <Label className={cn(labelCls, 'mb-2 block')}>
                  VENTA (Valor Energético do Alvo)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelCls}>Peso Alvo (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      className={inputCls}
                      placeholder="75"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelCls}>Prazo (dias)</Label>
                    <Input
                      type="number"
                      value={daysForGoal}
                      onChange={(e) => setDaysForGoal(e.target.value)}
                      className={inputCls}
                      placeholder="90"
                    />
                  </div>
                </div>
                {getLive > 0 && (
                  <div className="bg-[#1CB0F6]/10 rounded-xl p-3 text-center mt-2">
                    <p className="text-[10px] font-bold text-muted-foreground">VENTA Calculada</p>
                    <p className="text-2xl font-extrabold text-[#1CB0F6]">{ventaLive} kcal/dia</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {(imc > 0 || fatMass > 0) && (
          <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-extrabold">📊 Resultados Calculados</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#1CB0F6]/10 rounded-xl p-2 text-center">
                <p className="text-[10px] font-bold text-muted-foreground">IMC</p>
                <p className="text-lg font-extrabold text-[#1CB0F6]">{imc || '—'}</p>
                {imc > 0 && (
                  <p className="text-[9px] font-bold" style={{ color: imcStatus.color }}>
                    {imcStatus.label}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'rounded-xl p-2 text-center',
                  rcqStatus.isRisk ? 'bg-[#FF4B4B]/10' : 'bg-[#58CC02]/10',
                )}
              >
                <p className="text-[10px] font-bold text-muted-foreground">RCQ</p>
                <p
                  className={cn(
                    'text-lg font-extrabold',
                    rcqStatus.isRisk ? 'text-[#FF4B4B]' : 'text-[#58CC02]',
                  )}
                >
                  {rcq || '—'}
                </p>
                {rcq > 0 && <p className="text-[9px] font-bold">{rcqStatus.label}</p>}
              </div>
              <div className="bg-[#FF9600]/10 rounded-xl p-2 text-center">
                <p className="text-[10px] font-bold text-muted-foreground">Massa Gorda</p>
                <p className="text-lg font-extrabold text-[#FF9600]">{fatMass || '—'} kg</p>
              </div>
              <div className="bg-[#58CC02]/10 rounded-xl p-2 text-center">
                <p className="text-[10px] font-bold text-muted-foreground">Massa Magra</p>
                <p className="text-lg font-extrabold text-[#58CC02]">{leanMass || '—'} kg</p>
              </div>
            </div>
          </div>
        )}

        {(tmbLive > 0 || getLive > 0) && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" /> TMB
              </p>
              <p className="text-xl font-extrabold text-[#1CB0F6]">{tmbLive || '—'}</p>
              <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
            </div>
            <div className="bg-[#FF9600]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" /> GET
              </p>
              <p className="text-xl font-extrabold text-[#FF9600]">{getLive || '—'}</p>
              <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
            </div>
            <div className="bg-[#58CC02]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" /> VENTA
              </p>
              <p className="text-xl font-extrabold text-[#58CC02]">{ventaLive || '—'}</p>
              <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
            </div>
          </div>
        )}

        <div>
          <Label className="font-bold mb-2 block text-xs">Fotos (Antes/Depois)</Label>
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div key={i} className="relative">
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <button
                  onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" strokeWidth={3} />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
              <Camera className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotos}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <GameButton
          onClick={handleSave}
          variant="primary"
          size="lg"
          className="w-full"
          disabled={uploading}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Fazendo upload...
            </span>
          ) : (
            'Salvar Avaliação'
          )}
        </GameButton>
      </DialogContent>
    </Dialog>
  )
}
