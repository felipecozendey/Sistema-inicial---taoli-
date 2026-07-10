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
import { useAppStore, MealType, MealQuality } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const MEAL_TYPES: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Café da Manhã', emoji: '☀️' },
  { type: 'lunch', label: 'Almoço', emoji: '🍽️' },
  { type: 'snack', label: 'Lanche', emoji: '🥪' },
  { type: 'dinner', label: 'Jantar', emoji: '🌙' },
]

const QUALITIES: { value: MealQuality; label: string; color: string }[] = [
  { value: 'great', label: 'Ótima', color: 'bg-[#58CC02]' },
  { value: 'good', label: 'Boa', color: 'bg-[#1CB0F6]' },
  { value: 'okay', label: 'Razoável', color: 'bg-[#FFC800]' },
  { value: 'poor', label: 'Ruim', color: 'bg-[#FF4B4B]' },
]

interface NewMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewMealModal({ open, onOpenChange }: NewMealModalProps) {
  const { addMealLog } = useAppStore()
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [quality, setQuality] = useState<MealQuality>('good')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState('')

  useEffect(() => {
    if (!open) {
      setMealType('breakfast')
      setQuality('good')
      setDescription('')
      setItems('')
    }
  }, [open])

  const handleSubmit = () => {
    const parsedItems = items
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean)

    addMealLog({
      mealType,
      quality,
      description,
      items: parsedItems,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Registrar Refeição</DialogTitle>
          <DialogDescription>Adicione uma refeição ao seu diário de hoje</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Tipo de Refeição</Label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal.type}
                  onClick={() => setMealType(meal.type)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-2xl border-2 border-b-4 text-sm font-bold transition-all duration-150',
                    mealType === meal.type
                      ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#1CB0F6]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                >
                  <span className="text-lg">{meal.emoji}</span>
                  {meal.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Qualidade</Label>
            <div className="grid grid-cols-4 gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q.value}
                  onClick={() => setQuality(q.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-2xl border-2 text-xs font-bold transition-all duration-150',
                    quality === q.value
                      ? 'border-[#1CB0F6] bg-[#1CB0F6]/10'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                >
                  <span className={cn('w-4 h-4 rounded-full', q.color)} />
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="items" className="text-sm font-extrabold">
              Alimentos (separados por vírgula)
            </Label>
            <Input
              id="items"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="Arroz, feijão, frango grelhado..."
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-extrabold">
              Observações
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
