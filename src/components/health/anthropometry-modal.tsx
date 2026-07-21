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
import { useAppStore } from '@/stores/useAppStore'

interface AnthropometryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnthropometryModal({ open, onOpenChange }: AnthropometryModalProps) {
  const { addBodyMetric } = useAppStore()
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [chest, setChest] = useState('')
  const [arm, setArm] = useState('')
  const [thigh, setThigh] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setWeight('')
    setHeight('')
    setBodyFat('')
    setMuscleMass('')
    setWaist('')
    setHip('')
    setChest('')
    setArm('')
    setThigh('')
    setNotes('')
  }, [open])

  const handleSave = () => {
    onOpenChange(false)
    const measurements: Record<string, string> = {}
    if (waist) measurements.waist = waist
    if (hip) measurements.hip = hip
    if (chest) measurements.chest = chest
    if (arm) measurements.arm = arm
    if (thigh) measurements.thigh = thigh

    addBodyMetric?.({
      date: new Date().toISOString(),
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
      muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
      measurements,
      notes: notes || null,
    })
  }

  const hasData = weight || height || bodyFat || muscleMass || waist || hip || chest || arm || thigh

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
              <Label className="font-bold text-sm">% Gordura Corporal</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="ex: 18.5"
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
