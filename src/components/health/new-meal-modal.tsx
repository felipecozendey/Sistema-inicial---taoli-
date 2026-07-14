import { useState, useEffect, useRef, useCallback } from 'react'
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
import { useAppStore } from '@/stores/useAppStore'
import { uploadImage } from '@/lib/image-upload'
import { cn } from '@/lib/utils'
import { Camera, X, Loader2, Flame } from 'lucide-react'
import { toast } from 'sonner'

const MEAL_TYPES = [
  { value: 'Café da Manhã', label: 'Café da Manhã', emoji: '☀️' },
  { value: 'Almoço', label: 'Almoço', emoji: '🍽️' },
  { value: 'Jantar', label: 'Jantar', emoji: '🌙' },
  { value: 'Lanche', label: 'Lanche', emoji: '🥪' },
]

const ADHERENCE_OPTIONS = [
  { value: 'perfect', label: 'No Plano', emoji: '🟢' },
  { value: 'adapted', label: 'Adaptado', emoji: '🟡' },
  { value: 'cheat', label: 'Livre', emoji: '🔴' },
]

interface NewMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewMealModal({ open, onOpenChange }: NewMealModalProps) {
  const addMealLog = useAppStore((s) => s.addMealLog)
  const [mealType, setMealType] = useState('Café da Manhã')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [adherence, setAdherence] = useState('perfect')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isSubmittingRef = useRef(false)

  const resetForm = useCallback(() => {
    setMealType('Café da Manhã')
    setDescription('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setAdherence('perfect')
    setPhotoUrl('')
    isSubmittingRef.current = false
  }, [])

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

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
    if (isSubmittingRef.current) return
    if (!description.trim()) {
      toast.error('Adicione uma descrição para a refeição')
      return
    }
    isSubmittingRef.current = true
    onOpenChange(false)
    addMealLog({
      mealType,
      description: description.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      adherence,
      photoUrl: photoUrl || undefined,
    })
    toast.success('Refeição registrada! 🎉')
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Registrar Refeição</DialogTitle>
          <DialogDescription>Adicione uma refeição ao seu diário</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Tipo de Refeição</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((meal) => (
                  <SelectItem key={meal.value} value={meal.value}>
                    {meal.emoji} {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Frango grelhado com arroz"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Nutrientes</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF4B4B]" />
                  <span className="text-xs font-extrabold">Calorias (kcal)</span>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-14 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🥩</span>
                  <span className="text-xs font-extrabold">Proteína (g)</span>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-14 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🍞</span>
                  <span className="text-xs font-extrabold">Carbo (g)</span>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-14 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🥑</span>
                  <span className="text-xs font-extrabold">Gordura (g)</span>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-14 border-2 border-b-4"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Adesão</Label>
            <div className="grid grid-cols-3 gap-2">
              {ADHERENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAdherence(opt.value)}
                  disabled={saving}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-b-4 text-xs font-bold transition-all duration-150 active:translate-y-1 active:border-b-2 disabled:opacity-50 disabled:cursor-not-allowed',
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
                  disabled={saving}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center disabled:opacity-50"
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
                  disabled={uploading || saving}
                />
              </label>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full py-6 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Fazendo upload...
              </>
            ) : (
              'Salvar Refeição'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
