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
import { useAppStore } from '@/stores/useAppStore'
import { calculateBodyDensity3, calculateFatFromDensity } from '@/lib/anthropometry'
import { ACTIVITY_LABELS, ActivityLevel } from '@/lib/metabolic-utils'

const activityOptions = Object.entries(ACTIVITY_LABELS)
  .filter(([key]) => key !== 'none')
  .map(([value, label]) => ({ value: value as ActivityLevel, label }))

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnthropometryModal({ open, onOpenChange }: Props) {
  const { addBodyMetric } = useAppStore()
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState('male')
  const [age, setAge] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [peitoral, setPeitoral] = useState('')
  const [abdominal, setAbdominal] = useState('')
  const [coxa, setCoxa] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [chest, setChest] = useState('')
  const [arm, setArm] = useState('')
  const [thigh, setThigh] = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setWeight('')
    setHeight('')
    setGender('male')
    setAge('')
    setBodyFat('')
    setMuscleMass('')
    setPeitoral('')
    setAbdominal('')
    setCoxa('')
    setWaist('')
    setHip('')
    setChest('')
    setArm('')
    setThigh('')
    setActivityLevel('sedentary')
    setNotes('')
  }, [open])

  useEffect(() => {
    if (gender && age && peitoral && abdominal && coxa) {
      const sum = parseFloat(peitoral) + parseFloat(abdominal) + parseFloat(coxa)
      const density = calculateBodyDensity3(gender as 'male' | 'female', parseInt(age), sum)
      const fat = calculateFatFromDensity(density)
      if (fat > 0) setBodyFat(fat.toFixed(1))
    }
  }, [gender, age, peitoral, abdominal, coxa])

  const handleSave = () => {
    onOpenChange(false)
    const measurements: Record<string, number> = {}
    if (waist) measurements.waist = parseFloat(waist)
    if (hip) measurements.hip = parseFloat(hip)
    if (chest) measurements.chest = parseFloat(chest)
    if (arm) measurements.arm = parseFloat(arm)
    if (thigh) measurements.thigh = parseFloat(thigh)
    if (peitoral) measurements.skf_peitoral = parseFloat(peitoral)
    if (abdominal) measurements.skf_abdominal = parseFloat(abdominal)
    if (coxa) measurements.skf_coxa = parseFloat(coxa)

    addBodyMetric?.({
      date: new Date().toISOString(),
      weight: weight ? parseFloat(weight) : 0,
      height: height ? parseFloat(height) : undefined,
      bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : 0,
      muscleMass: muscleMass ? parseFloat(muscleMass) : 0,
      measurements,
      photoUrls: [],
      gender: gender || undefined,
      age: age ? parseInt(age) : undefined,
      activityLevel: activityLevel || undefined,
      notes: notes || undefined,
    })
  }

  const hasData =
    weight ||
    height ||
    bodyFat ||
    muscleMass ||
    waist ||
    hip ||
    chest ||
    arm ||
    thigh ||
    peitoral ||
    abdominal ||
    coxa

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Avaliação Antropométrica</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="ex: 75.5"
                className="rounded-2xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Altura (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="ex: 175"
                className="rounded-2xl border-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Sexo</Label>
              <Select value={gender} onValueChange={setGender}>
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
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="ex: 30"
                className="rounded-2xl border-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-bold text-sm">% Gordura Corporal</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="Auto ou manual"
                className="rounded-2xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Massa Muscular (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                placeholder="ex: 35.2"
                className="rounded-2xl border-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-sm">Fator de Atividade (NAF)</Label>
            <Select
              value={activityLevel}
              onValueChange={(v) => setActivityLevel(v as ActivityLevel)}
            >
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
          <Accordion type="single" collapsible>
            <AccordionItem
              value="skinfolds"
              className="border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-4"
            >
              <AccordionTrigger className="font-bold text-sm">
                Dobras Cutâneas (mm)
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={peitoral}
                    onChange={(e) => setPeitoral(e.target.value)}
                    placeholder="Peitoral"
                    className="rounded-2xl border-2"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={abdominal}
                    onChange={(e) => setAbdominal(e.target.value)}
                    placeholder="Abdominal"
                    className="rounded-2xl border-2"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={coxa}
                    onChange={(e) => setCoxa(e.target.value)}
                    placeholder="Coxa"
                    className="rounded-2xl border-2"
                  />
                </div>
                {bodyFat && parseFloat(bodyFat) > 0 && (
                  <p className="text-xs font-bold text-[#58CC02] mt-2">
                    % Gordura calculada: {bodyFat}%
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="space-y-2">
            <Label className="font-bold text-sm">Medidas Circunferenciais (cm)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="Cintura"
                className="rounded-2xl border-2"
              />
              <Input
                value={hip}
                onChange={(e) => setHip(e.target.value)}
                placeholder="Quadril"
                className="rounded-2xl border-2"
              />
              <Input
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                placeholder="Tórax"
                className="rounded-2xl border-2"
              />
              <Input
                value={arm}
                onChange={(e) => setArm(e.target.value)}
                placeholder="Braço"
                className="rounded-2xl border-2"
              />
              <Input
                value={thigh}
                onChange={(e) => setThigh(e.target.value)}
                placeholder="Coxa"
                className="rounded-2xl border-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-sm">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              className="rounded-2xl border-2 min-h-[60px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!hasData}
            className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold disabled:opacity-50"
          >
            Salvar Medidas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
