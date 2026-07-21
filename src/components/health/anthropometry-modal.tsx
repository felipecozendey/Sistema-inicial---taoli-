import { useState, useEffect } from 'react'
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
import { useAppStore } from '@/stores/useAppStore'
import {
  calculateBodyFat,
  type CalcProtocol,
  type Gender,
  type Skinfolds,
} from '@/lib/anthropometry-utils'
import { ACTIVITY_LABELS, type ActivityLevel } from '@/lib/metabolic-utils'
import {
  MeasurementInput,
  PhotoSlot,
  AttachmentUpload,
} from '@/components/health/anthropometry-fields'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

const activityOptions = Object.entries(ACTIVITY_LABELS)
  .filter(([key]) => key !== 'none')
  .map(([value, label]) => ({ value: value as ActivityLevel, label }))

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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnthropometryModal({ open, onOpenChange }: Props) {
  const { addBodyMetric } = useAppStore()
  const [date, setDate] = useState<Date>(new Date())
  const [form, setForm] = useState<FormState>(initialForm)
  const [photoFront, setPhotoFront] = useState('')
  const [photoBack, setPhotoBack] = useState('')
  const [photoRight, setPhotoRight] = useState('')
  const [photoLeft, setPhotoLeft] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setDate(new Date())
    setForm(initialForm)
    setPhotoFront('')
    setPhotoBack('')
    setPhotoRight('')
    setPhotoLeft('')
    setAttachments([])
  }, [open])

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const num = (v: string): number | undefined => (v ? parseFloat(v) : undefined)

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
    if (fat > 0) update('bodyFatPercentage', fat.toFixed(1))
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

    addBodyMetric?.({
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
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Avaliação Antropométrica</DialogTitle>
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
          <div className="space-y-2 col-span-2">
            <Label className="font-bold text-sm">Fator de Atividade (NAF)</Label>
            <Select value={form.activityLevel} onValueChange={(v) => update('activityLevel', v)}>
              <SelectTrigger className="rounded-2xl border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MeasurementInput
                      label="Bíceps (mm)"
                      value={form.skinfoldBiceps}
                      onChange={(v) => update('skinfoldBiceps', v)}
                    />
                    <MeasurementInput
                      label="Tríceps (mm)"
                      value={form.skinfoldTriceps}
                      onChange={(v) => update('skinfoldTriceps', v)}
                    />
                    <MeasurementInput
                      label="Subescap. (mm)"
                      value={form.skinfoldSubscapular}
                      onChange={(v) => update('skinfoldSubscapular', v)}
                    />
                    <MeasurementInput
                      label="Peitoral (mm)"
                      value={form.skinfoldChest}
                      onChange={(v) => update('skinfoldChest', v)}
                    />
                    <MeasurementInput
                      label="Axilar Méd. (mm)"
                      value={form.skinfoldMidaxillary}
                      onChange={(v) => update('skinfoldMidaxillary', v)}
                    />
                    <MeasurementInput
                      label="Suprailíaca (mm)"
                      value={form.skinfoldSuprailiac}
                      onChange={(v) => update('skinfoldSuprailiac', v)}
                    />
                    <MeasurementInput
                      label="Supraesp. (mm)"
                      value={form.skinfoldSupraspinal}
                      onChange={(v) => update('skinfoldSupraspinal', v)}
                    />
                    <MeasurementInput
                      label="Abdominal (mm)"
                      value={form.skinfoldAbdominal}
                      onChange={(v) => update('skinfoldAbdominal', v)}
                    />
                    <MeasurementInput
                      label="Coxa (mm)"
                      value={form.skinfoldThigh}
                      onChange={(v) => update('skinfoldThigh', v)}
                    />
                    <MeasurementInput
                      label="Panturrilha (mm)"
                      value={form.skinfoldCalf}
                      onChange={(v) => update('skinfoldCalf', v)}
                    />
                  </div>
                  {form.bodyFatPercentage && parseFloat(form.bodyFatPercentage) > 0 && (
                    <p className="text-xs font-bold text-[#58CC02]">
                      % Gordura calculada: {form.bodyFatPercentage}%
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
            Salvar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
