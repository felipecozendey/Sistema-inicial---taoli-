import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNutritionStore, CustomFood } from '@/stores/use-nutrition-store'
import { FOOD_TAG_PRESETS } from '@/lib/nutrition-utils'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  food: CustomFood | null
}

export function FoodEditModal({ open, onOpenChange, food }: Props) {
  const { updateCustomFood } = useNutritionStore()
  const [name, setName] = useState('')
  const [baseUnit, setBaseUnit] = useState('100g')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (food) {
      setName(food.name)
      setBaseUnit(food.baseUnit)
      setCalories(String(food.calories))
      setCarbs(String(food.carbsG))
      setProtein(String(food.proteinG))
      setFat(String(food.fatG))
      setTags(food.tags || [])
    }
  }, [food])

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSubmit = async () => {
    if (!food || !name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    await updateCustomFood(food.id, {
      name: name.trim(),
      baseUnit: baseUnit.trim() || '100g',
      calories: parseFloat(calories) || 0,
      carbsG: parseFloat(carbs) || 0,
      proteinG: parseFloat(protein) || 0,
      fatG: parseFloat(fat) || 0,
      tags,
    })
    toast.success('Alimento atualizado! ✏️')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Editar Alimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Porção Base</Label>
              <Input
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Calorias (kcal)</Label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Carbo (g)</Label>
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Proteína (g)</Label>
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Gordura (g)</Label>
            <Input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-extrabold">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {FOOD_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold border-2 transition-all duration-150',
                    tags.includes(tag)
                      ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:border-[#1CB0F6]/50',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white font-extrabold border-b-4 border-[#1890D0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Check className="w-5 h-5 mr-2" strokeWidth={3} />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
