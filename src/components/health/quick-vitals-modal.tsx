import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameButton } from '@/components/ui/game-button'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'
import { Heart, Activity, Droplet, Scale, Ruler, Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialWeight?: number | null
  initialHeight?: number | null
}

export function QuickVitalsModal({ open, onOpenChange, initialWeight, initialHeight }: Props) {
  const addQuickVitals = useAppStore((s) => s.addQuickVitals)
  const [date, setDate] = useState<Date>(new Date())
  const [bpm, setBpm] = useState('')
  const [pressure, setPressure] = useState('')
  const [glucose, setGlucose] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')

  const resetForm = useCallback(() => {
    setDate(new Date())
    setBpm('')
    setPressure('')
    setGlucose('')
    setWeight(initialWeight && initialWeight > 0 ? String(initialWeight) : '')
    setHeight(initialHeight && initialHeight > 0 ? String(initialHeight) : '')
  }, [initialWeight, initialHeight])

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open, resetForm])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    // Zero Lag: instant modal close before any async operation
    onOpenChange(false)

    const parsedWeight = weight ? parseFloat(weight.replace(',', '.')) : undefined
    const parsedHeight = height ? parseFloat(height.replace(',', '.')) : undefined
    const parsedBpm = bpm ? parseInt(bpm, 10) : undefined
    const parsedGlucose = glucose ? parseFloat(glucose.replace(',', '.')) : undefined

    const dateStr = date.toISOString().split('T')[0]

    // Synchronous optimistic update in Zustand
    addQuickVitals({
      date: dateStr,
      heartRateRest: parsedBpm && !isNaN(parsedBpm) ? parsedBpm : undefined,
      bloodPressure: pressure.trim() || undefined,
      glucose: parsedGlucose && !isNaN(parsedGlucose) ? parsedGlucose : undefined,
      weight: parsedWeight && !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined,
      height: parsedHeight && !isNaN(parsedHeight) && parsedHeight > 0 ? parsedHeight : undefined,
    })

    toast.success('Avaliação rápida registrada! 🩺')
  }

  const hasAnyData =
    Boolean(bpm.trim()) ||
    Boolean(pressure.trim()) ||
    Boolean(glucose.trim()) ||
    Boolean(weight.trim()) ||
    Boolean(height.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            ⚡ Registrar Avaliação Rápida
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Data do Registro */}
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Data do Registro</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl font-bold h-11"
                >
                  <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                  {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
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

          {/* Medidas Corporais Básicas: Peso e Altura */}
          <div className="bg-muted/40 p-3.5 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#3B4A55] space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>📏</span> Medidas Básicas
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#58CC02]" /> Peso (kg)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="ex: 75.5"
                  className="rounded-xl font-bold border-2"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#1CB0F6]" /> Altura (cm)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="ex: 175"
                  className="rounded-xl font-bold border-2"
                />
              </div>
            </div>
          </div>

          {/* Sinais Vitais Clínicos */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>🩺</span> Sinais Vitais
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#FF4B4B]" /> Frequência Cardíaca (BPM)
                </Label>
                <Input
                  type="number"
                  min="30"
                  max="250"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="ex: 68"
                  className="rounded-xl font-bold border-2"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#1CB0F6]" /> Pressão Arterial (mmHg)
                </Label>
                <Input
                  value={pressure}
                  onChange={(e) => setPressure(e.target.value)}
                  placeholder="ex: 120/80"
                  className="rounded-xl font-bold border-2"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-[#FF9600]" /> Glicose (mg/dL)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  placeholder="ex: 92"
                  className="rounded-xl font-bold border-2"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <GameButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full rounded-2xl"
              disabled={!hasAnyData}
            >
              Salvar Avaliação
            </GameButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
