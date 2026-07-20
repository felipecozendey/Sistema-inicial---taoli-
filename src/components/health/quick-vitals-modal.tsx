import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameButton } from '@/components/ui/game-button'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'
import { Heart, Activity, Droplet } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function QuickVitalsModal({ open, onOpenChange }: Props) {
  const addQuickVitals = useAppStore((s) => s.addQuickVitals)
  const [bpm, setBpm] = useState('')
  const [pressure, setPressure] = useState('')
  const [glucose, setGlucose] = useState('')

  const resetForm = useCallback(() => {
    setBpm('')
    setPressure('')
    setGlucose('')
  }, [])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  const handleSubmit = () => {
    onOpenChange(false)
    addQuickVitals({
      heartRateRest: parseInt(bpm) || undefined,
      bloodPressure: pressure || undefined,
      glucose: parseFloat(glucose) || undefined,
    })
    toast.success('Sinais vitais registrados! 🩺')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Registrar Sinais Vitais</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#FF4B4B]" /> Frequência Cardíaca (bpm)
            </Label>
            <Input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="65"
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#1CB0F6]" /> Pressão Arterial (mmHg)
            </Label>
            <Input
              value={pressure}
              onChange={(e) => setPressure(e.target.value)}
              placeholder="120/80"
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-[#FFC800]" /> Glicose (mg/dL)
            </Label>
            <Input
              type="number"
              value={glucose}
              onChange={(e) => setGlucose(e.target.value)}
              placeholder="90"
              className="rounded-xl font-bold"
            />
          </div>
          <GameButton onClick={handleSubmit} variant="primary" size="lg" className="w-full">
            Salvar
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
