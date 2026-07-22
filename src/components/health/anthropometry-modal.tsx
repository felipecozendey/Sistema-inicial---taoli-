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
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAppStore, type BodyMetric } from '@/stores/useAppStore'
import {
  calculateBodyFat,
  getRequiredSkinfolds,
  type CalcProtocol,
  type Gender,
  type Skinfolds,
} from '@/lib/anthropometry-utils'
import {
  MeasurementInput,
  PhotoSlot,
  AttachmentUpload,
} from '@/components/health/anthropometry-fields'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

const protocolOptions: { value: CalcProtocol; label: string }[] = [
  { value: 'none', label: 'Nenhum' },
  { value: 'durnin', label: 'Durnin' },
  { value: 'pollock_7', label: 'Pollock 7' },
  { value: 'pollock_3', label: 'Pollock 3' },
  { value: 'petroski', label: 'Petroski' },
  { value: 'guedes', label: 'Guedes' },
  { value: 'faulkner', label: 'Faulkner' },
]

type FormState = Record<string, string>

const initialForm: FormState = {
  weight: '',
  height: '',
  sittingHeight: '',
  kneeHeight: '',
  gender: 'male',
  age: '',
  activityLevel: 'sedentary',
  armRelaxedLeft: '',
  armRelaxedRight: '',
  armContractedLeft: '',
  armContractedRight: '',
  forearmLeft: '',
  forearmRight: '',
  wristCircLeft: '',
  wristCircRight: '',
  neckCirc: '',
  shoulderCirc: '',
  chestCirc: '',
  waistCirc: '',
  abdomenCirc: '',
  hipCirc: '',
  calfLeft: '',
  calfRight: '',
  thighLeft: '',
  thighRight: '',
  proximalThighLeft: '',
  proximalThighRight: '',
  wristDiameter: '',
  femurDiameter: '',
  humerusDiameter: '',
  compositionMethod: 'skinfolds',
  calcProtocol: 'none',
  bodyFatPercentage: '',
  leanMass: '',
  muscleMass: '',
  skinfoldBiceps: '',
  skinfoldTriceps: '',
  skinfoldSubscapular: '',
  skinfoldChest: '',
  skinfoldMidaxillary: '',
  skinfoldSuprailiac: '',
  skinfoldSupraspinal: '',
  skinfoldAbdominal: '',
  skinfoldThigh: '',
  skinfoldCalf: '',
  observations: '',
}

function metricToForm(m: BodyMetric): FormState {
  const s = (v: any) => (v !== undefined && v !== null && v !== 0 ? String(v) : '')
  return {
    ...initialForm,
    weight: s(m.weight),
    height: s(m.height),
    sittingHeight: s(m.sittingHeight),
    kneeHeight: s(m.kneeHeight),
    gender: m.gender || 'male',
    age: s(m.age),
    activityLevel: m.activityLevel || 'sedentary',
    armRelaxedLeft: s(m.armRelaxedLeft),
    armRelaxedRight: s(m.armRelaxedRight),
    armContractedLeft: s(m.armContractedLeft),
    armContractedRight: s(m.armContractedRight),
    forearmLeft: s(m.forearmLeft),
    forearmRight: s(m.forearmRight),
    wristCircLeft: s(m.wristCircLeft),
    wristCircRight: s(m.wristCircRight),
    neckCirc: s(m.neckCirc),
    shoulderCirc: s(m.shoulderCirc),
    chestCirc: s(m.chestCirc),
    waistCirc: s(m.waistCirc),
    abdomenCirc: s(m.abdomenCirc),
    hipCirc: s(m.hipCirc),
    calfLeft: s(m.calfLeft),
    calfRight: s(m.calfRight),
    thighLeft: s(m.thighLeft),
    thighRight: s(m.thighRight),
    proximalThighLeft: s(m.proximalThighLeft),
    proximalThighRight: s(m.proximalThighRight),
    wristDiameter: s(m.wristDiameter),
    femurDiameter: s(m.femurDiameter),
    humerusDiameter: s(m.humerusDiameter),
    compositionMethod: m.compositionMethod || 'skinfolds',
    calcProtocol: m.calcProtocol || 'none',
    bodyFatPercentage: s(m.bodyFatPercentage),
    leanMass: s(m.leanMass),
    muscleMass: s(m.muscleMass),
    skinfoldBiceps: s(m.skinfoldBiceps),
    skinfoldTriceps: s(m.skinfoldTriceps),
    skinfoldSubscapular: s(m.skinfoldSubscapular),
    skinfoldChest: s(m.skinfoldChest),
    skinfoldMidaxillary: s(m.skinfoldMidaxillary),
    skinfoldSuprailiac: s(m.skinfoldSuprailiac),
    skinfoldSupraspinal: s(m.skinfoldSupraspinal),
    skinfoldAbdominal: s(m.skinfoldAbdominal),
    skinfoldThigh: s(m.skinfoldThigh),
    skinfoldCalf: s(m.skinfoldCalf),
    observations: m.observations || '',
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMetric?: BodyMetric | null
}

export function AnthropometryModal({ open, onOpenChange, editMetric }: Props) {
  const { addBodyMetric, updateAnthropometryLog } = useAppStore()
  const [date, setDate] = useState<Date>(new Date())
  const [form, setForm] = useState<FormState>(initialForm)
  const [photoFront, setPhotoFront] = useState('')
  const [photoBack, setPhotoBack] = useState('')
  const [photoRight, setPhotoRight] = useState('')
  const [photoLeft, setPhotoLeft] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    if (editMetric) {
      setDate(new Date(editMetric.date + 'T12:00:00'))
      setForm(metricToForm(editMetric))
      setPhotoFront(editMetric.photoFront || '')
      setPhotoBack(editMetric.photoBack || '')
      setPhotoRight(editMetric.photoRight || '')
      setPhotoLeft(editMetric.photoLeft || '')
      setAttachments(editMetric.attachments || [])
    } else {
      setDate(new Date())
      setForm(initialForm)
      setPhotoFront('')
      setPhotoBack('')
      setPhotoRight('')
      setPhotoLeft('')
      setAttachments([])
    }
  }, [open, editMetric])

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))
  const num = (v: string): number | undefined => (v ? parseFloat(v) : undefined)

  const requiredSkinfolds = useMemo(
    () => getRequiredSkinfolds(form.calcProtocol as CalcProtocol, form.gender as Gender),
    [form.calcProtocol, form.gender],
  )

  const allRequiredFilled = useMemo(() => {
    if (!requiredSkinfolds.length) return false
    return requiredSkinfolds.every((key) => {
      const val = parseFloat(form[key] || '0')
      return val > 0
    })
  }, [requiredSkinfolds, form])

  useEffect(() => {
    if (form.compositionMethod !== 'skinfolds' || form.calcProtocol === 'none') return
    if (!form.age || !form.gender) return
    const skinfolds: Skinfolds = {
      biceps: num(form.skinfoldBiceps),
      triceps: num(form.skinfoldTriceps),
      subscapular: num(form.skinfoldSubscapular),
      chest: num(form.skinfoldChest),
      midaxillary: num(form.skinfoldMidaxillary),
      suprailiac: num(form.skinfoldSuprailiac),
      supraspinal: num(form.skinfoldSupraspinal),
      abdominal: num(form.skinfoldAbdominal),
      thigh: num(form.skinfoldThigh),
      calf: num(form.skinfoldCalf),
    }
    const fat = calculateBodyFat(
      skinfolds,
      form.calcProtocol as CalcProtocol,
      parseInt(form.age),
      form.gender as Gender,
    )
    if (fat > 0) {
      update('bodyFatPercentage', fat.toFixed(1))
      const weightNum = parseFloat(form.weight)
      if (weightNum > 0) {
        const leanMass = Math.round((weightNum - weightNum * (fat / 100)) * 10) / 10
        update('leanMass', leanMass.toFixed(1))
      }
    }
  }, [
    form.calcProtocol,
    form.compositionMethod,
    form.age,
    form.gender,
    form.skinfoldBiceps,
    form.skinfoldTriceps,
    form.skinfoldSubscapular,
    form.skinfoldChest,
    form.skinfoldMidaxillary,
    form.skinfoldSuprailiac,
    form.skinfoldSupraspinal,
    form.skinfoldAbdominal,
    form.skinfoldThigh,
    form.skinfoldCalf,
    form.weight,
  ])

  const hasData = !!(
    form.weight ||
    form.height ||
    form.bodyFatPercentage ||
    form.muscleMass ||
    form.waistCirc ||
    form.hipCirc ||
    form.chestCirc ||
    form.armRelaxedLeft ||
    photoFront ||
    photoBack ||
    photoRight ||
    photoLeft ||
    form.observations ||
    attachments.length > 0
  )

  const handleSave = () => {
    onOpenChange(false)
    const weightNum = num(form.weight) || 0
    const fatPct = num(form.bodyFatPercentage) || 0
    const calculatedFatMass =
      weightNum && fatPct ? Math.round(weightNum * (fatPct / 100) * 10) / 10 : undefined
    const calculatedLeanMass =
      num(form.leanMass) ||
      (weightNum && calculatedFatMass
        ? Math.round((weightNum - calculatedFatMass) * 10) / 10
        : undefined)
    const measurements: Record<string, number> = {}
    if (form.waistCirc) measurements.waist = parseFloat(form.waistCirc)
    if (form.hipCirc) measurements.hip = parseFloat(form.hipCirc)
    if (form.chestCirc) measurements.chest = parseFloat(form.chestCirc)

    const metric = {
      date: date.toISOString(),
      weight: weightNum,
      height: num(form.height),
      sittingHeight: num(form.sittingHeight),
      kneeHeight: num(form.kneeHeight),
      gender: form.gender || undefined,
      age: form.age ? parseInt(form.age) : undefined,
      activityLevel: form.activityLevel || undefined,
      bodyFatPercentage: fatPct,
      muscleMass: num(form.muscleMass) || 0,
      leanMass: calculatedLeanMass,
      fatMass: calculatedFatMass,
      measurements,
      photoUrls: [photoFront, photoBack, photoRight, photoLeft].filter(Boolean),
      armRelaxedLeft: num(form.armRelaxedLeft),
      armRelaxedRight: num(form.armRelaxedRight),
      armContractedLeft: num(form.armContractedLeft),
      armContractedRight: num(form.armContractedRight),
      forearmLeft: num(form.forearmLeft),
      forearmRight: num(form.forearmRight),
      wristCircLeft: num(form.wristCircLeft),
      wristCircRight: num(form.wristCircRight),
      neckCirc: num(form.neckCirc),
      shoulderCirc: num(form.shoulderCirc),
      chestCirc: num(form.chestCirc),
      waistCirc: num(form.waistCirc),
      abdomenCirc: num(form.abdomenCirc),
      hipCirc: num(form.hipCirc),
      calfLeft: num(form.calfLeft),
      calfRight: num(form.calfRight),
      thighLeft: num(form.thighLeft),
      thighRight: num(form.thighRight),
      proximalThighLeft: num(form.proximalThighLeft),
      proximalThighRight: num(form.proximalThighRight),
      wristDiameter: num(form.wristDiameter),
      femurDiameter: num(form.femurDiameter),
      humerusDiameter: num(form.humerusDiameter),
      compositionMethod: form.compositionMethod,
      calcProtocol: form.calcProtocol,
      skinfoldBiceps: num(form.skinfoldBiceps),
      skinfoldTriceps: num(form.skinfoldTriceps),
      skinfoldSubscapular: num(form.skinfoldSubscapular),
      skinfoldChest: num(form.skinfoldChest),
      skinfoldMidaxillary: num(form.skinfoldMidaxillary),
      skinfoldSuprailiac: num(form.skinfoldSuprailiac),
      skinfoldSupraspinal: num(form.skinfoldSupraspinal),
      skinfoldAbdominal: num(form.skinfoldAbdominal),
      skinfoldThigh: num(form.skinfoldThigh),
      skinfoldCalf: num(form.skinfoldCalf),
      photoFront: photoFront || undefined,
      photoBack: photoBack || undefined,
      photoRight: photoRight || undefined,
      photoLeft: photoLeft || undefined,
      attachments,
      observations: form.observations || undefined,
    }

    if (editMetric) {
      updateAnthropometryLog(editMetric.id, metric)
    } else {
      addBodyMetric?.(metric)
    }
  }

  const sf = (key: string) => requiredSkinfolds.includes(key)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {editMetric ? '✏️ Editar Avaliação' : 'Avaliação Antropométrica'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="font-bold text-sm">Data da Avaliação</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start border-2 rounded-2xl font-bold"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="font-bold text-sm">Sexo</Label>
            <Select value={form.gender} onValueChange={(v) => update('gender', v)}>
              <SelectTrigger className="rounded-2xl border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-sm">Idade</Label>
            <Input
              type="number"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              placeholder="ex: 30"
              className="rounded-2xl border-2"
            />
          </div>
        </div>

        <Accordion type="multiple" defaultValue={['basic']} className="space-y-2">
          <AccordionItem
            value="basic"
            className="border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-4"
          >
            <AccordionTrigger className="font-bold text-sm">
              📏 Antropometria Básica
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <MeasurementInput
                  label="Peso (kg)"
                  value={form.weight}
                  onChange={(v) => update('weight', v)}
                  placeholder="ex: 75.5"
                />
                <MeasurementInput
                  label="Altura (cm)"
                  value={form.height}
                  onChange={(v) => update('height', v)}
                  placeholder="ex: 175"
                />
                <MeasurementInput
                  label="Altura Sentado (cm)"
                  value={form.sittingHeight}
                  onChange={(v) => update('sittingHeight', v)}
                />
                <MeasurementInput
                  label="Altura Joelho (cm)"
                  value={form.kneeHeight}
                  onChange={(v) => update('kneeHeight', v)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="circ"
            className="border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-4"
          >
            <AccordionTrigger className="font-bold text-sm">
              📐 Circunferências (cm)
            </AccordionTrigger>
            <AccordionContent>
              <Accordion type="multiple" className="space-y-2 pt-2">
                <AccordionItem value="upper" className="border rounded-xl px-3">
                  <AccordionTrigger className="font-bold text-xs">
                    Membros Superiores
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <MeasurementInput
                        label="Braço Rel. Esq."
                        value={form.armRelaxedLeft}
                        onChange={(v) => update('armRelaxedLeft', v)}
                      />
                      <MeasurementInput
                        label="Braço Rel. Dir."
                        value={form.armRelaxedRight}
                        onChange={(v) => update('armRelaxedRight', v)}
                      />
                      <MeasurementInput
                        label="Braço Cont. Esq."
                        value={form.armContractedLeft}
                        onChange={(v) => update('armContractedLeft', v)}
                      />
                      <MeasurementInput
                        label="Braço Cont. Dir."
                        value={form.armContractedRight}
                        onChange={(v) => update('armContractedRight', v)}
                      />
                      <MeasurementInput
                        label="Antebraço Esq."
                        value={form.forearmLeft}
                        onChange={(v) => update('forearmLeft', v)}
                      />
                      <MeasurementInput
                        label="Antebraço Dir."
                        value={form.forearmRight}
                        onChange={(v) => update('forearmRight', v)}
                      />
                      <MeasurementInput
                        label="Punho Esq."
                        value={form.wristCircLeft}
                        onChange={(v) => update('wristCircLeft', v)}
                      />
                      <MeasurementInput
                        label="Punho Dir."
                        value={form.wristCircRight}
                        onChange={(v) => update('wristCircRight', v)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="trunk" className="border rounded-xl px-3">
                  <AccordionTrigger className="font-bold text-xs">Tronco</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <MeasurementInput
                        label="Pescoço"
                        value={form.neckCirc}
                        onChange={(v) => update('neckCirc', v)}
                      />
                      <MeasurementInput
                        label="Ombro"
                        value={form.shoulderCirc}
                        onChange={(v) => update('shoulderCirc', v)}
                      />
                      <MeasurementInput
                        label="Tórax"
                        value={form.chestCirc}
                        onChange={(v) => update('chestCirc', v)}
                      />
                      <MeasurementInput
                        label="Cintura"
                        value={form.waistCirc}
                        onChange={(v) => update('waistCirc', v)}
                      />
                      <MeasurementInput
                        label="Abdômen"
                        value={form.abdomenCirc}
                        onChange={(v) => update('abdomenCirc', v)}
                      />
                      <MeasurementInput
                        label="Quadril"
                        value={form.hipCirc}
                        onChange={(v) => update('hipCirc', v)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="lower" className="border rounded-xl px-3">
                  <AccordionTrigger className="font-bold text-xs">
                    Membros Inferiores
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <MeasurementInput
                        label="Panturrilha Esq."
                        value={form.calfLeft}
                        onChange={(v) => update('calfLeft', v)}
                      />
                      <MeasurementInput
                        label="Panturrilha Dir."
                        value={form.calfRight}
                        onChange={(v) => update('calfRight', v)}
                      />
                      <MeasurementInput
                        label="Coxa Esq."
                        value={form.thighLeft}
                        onChange={(v) => update('thighLeft', v)}
                      />
                      <MeasurementInput
                        label="Coxa Dir."
                        value={form.thighRight}
                        onChange={(v) => update('thighRight', v)}
                      />
                      <MeasurementInput
                        label="Coxa Prox. Esq."
                        value={form.proximalThighLeft}
                        onChange={(v) => update('proximalThighLeft', v)}
                      />
                      <MeasurementInput
                        label="Coxa Prox. Dir."
                        value={form.proximalThighRight}
                        onChange={(v) => update('proximalThighRight', v)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="bones"
            className="border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-4"
          >
            <AccordionTrigger className="font-bold text-sm">
              🦴 Diâmetros Ósseos (cm)
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <MeasurementInput
                  label="Punho"
                  value={form.wristDiameter}
                  onChange={(v) => update('wristDiameter', v)}
                />
                <MeasurementInput
                  label="Fêmur"
                  value={form.femurDiameter}
                  onChange={(v) => update('femurDiameter', v)}
                />
                <MeasurementInput
                  label="Úmero"
                  value={form.humerusDiameter}
                  onChange={(v) => update('humerusDiameter', v)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="comp"
            className="border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-4"
          >
            <AccordionTrigger className="font-bold text-sm">
              🧬 Composição Corporal
            </AccordionTrigger>
            <AccordionContent>
              <Tabs
                value={form.compositionMethod}
                onValueChange={(v) => update('compositionMethod', v)}
              >
                <TabsList className="grid grid-cols-2 w-full rounded-xl">
                  <TabsTrigger value="skinfolds">Pregas Cutâneas</TabsTrigger>
                  <TabsTrigger value="bioimpedance">Bioimpedância</TabsTrigger>
                </TabsList>
                <TabsContent value="skinfolds" className="space-y-3 pt-3">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs">Protocolo de Cálculo</Label>
                    <Select
                      value={form.calcProtocol}
                      onValueChange={(v) => update('calcProtocol', v)}
                    >
                      <SelectTrigger className="rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {protocolOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {requiredSkinfolds.length > 0 && (
                    <p className="text-[10px] font-bold text-green-600 dark:text-green-400">
                      ⭐ Campos obrigatórios destacados para o protocolo selecionado.
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MeasurementInput
                      label="Bíceps (mm)"
                      value={form.skinfoldBiceps}
                      onChange={(v) => update('skinfoldBiceps', v)}
                      required={sf('skinfoldBiceps')}
                    />
                    <MeasurementInput
                      label="Tríceps (mm)"
                      value={form.skinfoldTriceps}
                      onChange={(v) => update('skinfoldTriceps', v)}
                      required={sf('skinfoldTriceps')}
                    />
                    <MeasurementInput
                      label="Subescap. (mm)"
                      value={form.skinfoldSubscapular}
                      onChange={(v) => update('skinfoldSubscapular', v)}
                      required={sf('skinfoldSubscapular')}
                    />
                    <MeasurementInput
                      label="Peitoral (mm)"
                      value={form.skinfoldChest}
                      onChange={(v) => update('skinfoldChest', v)}
                      required={sf('skinfoldChest')}
                    />
                    <MeasurementInput
                      label="Axilar Méd. (mm)"
                      value={form.skinfoldMidaxillary}
                      onChange={(v) => update('skinfoldMidaxillary', v)}
                      required={sf('skinfoldMidaxillary')}
                    />
                    <MeasurementInput
                      label="Suprailíaca (mm)"
                      value={form.skinfoldSuprailiac}
                      onChange={(v) => update('skinfoldSuprailiac', v)}
                      required={sf('skinfoldSuprailiac')}
                    />
                    <MeasurementInput
                      label="Supraesp. (mm)"
                      value={form.skinfoldSupraspinal}
                      onChange={(v) => update('skinfoldSupraspinal', v)}
                      required={sf('skinfoldSupraspinal')}
                    />
                    <MeasurementInput
                      label="Abdominal (mm)"
                      value={form.skinfoldAbdominal}
                      onChange={(v) => update('skinfoldAbdominal', v)}
                      required={sf('skinfoldAbdominal')}
                    />
                    <MeasurementInput
                      label="Coxa (mm)"
                      value={form.skinfoldThigh}
                      onChange={(v) => update('skinfoldThigh', v)}
                      required={sf('skinfoldThigh')}
                    />
                    <MeasurementInput
                      label="Panturrilha (mm)"
                      value={form.skinfoldCalf}
                      onChange={(v) => update('skinfoldCalf', v)}
                      required={sf('skinfoldCalf')}
                    />
                  </div>
                  {form.bodyFatPercentage && parseFloat(form.bodyFatPercentage) > 0 && (
                    <p className="text-xs font-bold text-[#58CC02]">
                      % Gordura calculada: {form.bodyFatPercentage}%
                      {allRequiredFilled && form.leanMass && ` | Massa Magra: ${form.leanMass} kg`}
                    </p>
                  )}
                  <MeasurementInput
                    label="Massa Muscular (kg)"
                    value={form.muscleMass}
                    onChange={(v) => update('muscleMass', v)}
                    placeholder="ex: 35.2"
                  />
                </TabsContent>
                <TabsContent value="bioimpedance" className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <MeasurementInput
                      label="% Gordura Corporal"
                      value={form.bodyFatPercentage}
                      onChange={(v) => update('bodyFatPercentage', v)}
                      placeholder="ex: 18.5"
                    />
                    <MeasurementInput
                      label="Massa Magra (kg)"
                      value={form.leanMass}
                      onChange={(v) => update('leanMass', v)}
                      placeholder="ex: 65.0"
                    />
                  </div>
                  <MeasurementInput
                    label="Massa Muscular (kg)"
                    value={form.muscleMass}
                    onChange={(v) => update('muscleMass', v)}
                    placeholder="ex: 35.2"
                  />
                </TabsContent>
              </Tabs>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="gallery"
            className="border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-4"
          >
            <AccordionTrigger className="font-bold text-sm">📸 Galeria e Anexos</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <PhotoSlot
                  label="Frontal"
                  photoUrl={photoFront}
                  onUpload={setPhotoFront}
                  onRemove={() => setPhotoFront('')}
                />
                <PhotoSlot
                  label="Costas"
                  photoUrl={photoBack}
                  onUpload={setPhotoBack}
                  onRemove={() => setPhotoBack('')}
                />
                <PhotoSlot
                  label="Direita"
                  photoUrl={photoRight}
                  onUpload={setPhotoRight}
                  onRemove={() => setPhotoRight('')}
                />
                <PhotoSlot
                  label="Esquerda"
                  photoUrl={photoLeft}
                  onUpload={setPhotoLeft}
                  onRemove={() => setPhotoLeft('')}
                />
              </div>
              <div className="mt-3">
                <AttachmentUpload
                  attachments={attachments}
                  onAdd={(url) => setAttachments((prev) => [...prev, url])}
                  onRemove={(url) => setAttachments((prev) => prev.filter((u) => u !== url))}
                />
              </div>
              <div className="mt-3 space-y-2">
                <Label className="font-bold text-sm">Observações</Label>
                <Textarea
                  value={form.observations}
                  onChange={(e) => update('observations', e.target.value)}
                  placeholder="Notas clínicas adicionais..."
                  className="rounded-2xl border-2 min-h-[80px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!hasData}
            className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold disabled:opacity-50"
          >
            {editMetric ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
