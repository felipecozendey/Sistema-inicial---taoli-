import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, MealType } from '@/stores/useAppStore'
import { uploadImage } from '@/lib/image-upload'
import { cn } from '@/lib/utils'
import { Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const MEAL_TYPES: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Café da Manhã', emoji: '☀️' },
  { type: 'lunch', label: 'Almoço', emoji: '🍽️' },
  { type: 'snack', label: 'Lanche', emoji: '🥪' },
  { type: 'dinner', label: 'Jantar', emoji: '🌙' },
]

const ADHERENCE_OPTIONS = [
  { value: 'on_plan', label: 'No Plano', emoji: '🟢', color: '#58CC02' },
  { value: 'adapted', label: 'Adaptado', emoji: '🟡', color: '#FFC800' },
  { value: 'free', label: 'Livre', emoji: '🔴', color: '#FF4B4B' },
]

interface NewMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewMealModal({ open, onOpenChange }: NewMealModalProps) {
  const { addMealLog } = useAppStore()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [adherence, setAdherence] = useState('on_plan')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open) {
      const n = new Date()
      setDate(n.toISOString().split('T')[0])
      setTime(n.toTimeString().slice(0, 5))
    } else {
      setMealType('breakfast')
      setAdherence('on_plan')
      setNotes('')
      setPhotoUrl('')
    }
  }, [open])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setPhotoUrl(url)
    } catch {
      toast.error('Erro ao enviar foto')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSubmit = () => {
    addMealLog({
      date,
      time,
      mealType,
      quality: adherence,
      description: notes,
      photoUrl,
      items: [],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Registrar Refeição</DialogTitle>
          <DialogDescription>Adicione uma refeição ao seu diário</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Hora</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Tipo de Refeição</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((meal) => (
                  <SelectItem key={meal.type} value={meal.type}>
                    {meal.emoji} {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Adesão</Label>
            <div className="grid grid-cols-3 gap-2">
              {ADHERENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAdherence(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-b-4 text-xs font-bold transition-all duration-150 active:translate-y-1 active:border-b-2',
                    adherence === opt.value
                      ? 'border-[#1CB0F6] bg-[#1CB0F6]/10'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Foto</Label>
            {photoUrl ? (
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="Refeição"
                  className="w-full h-40 rounded-2xl object-cover"
                />
                <button
                  onClick={() => setPhotoUrl('')}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-2xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] cursor-pointer hover:bg-muted/30 transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
                    <span className="text-xs font-bold text-muted-foreground">Adicionar foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-extrabold">
              Observações
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como você se sentiu? Alguma observação..."
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full py-6 rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            Salvar Refeição
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
