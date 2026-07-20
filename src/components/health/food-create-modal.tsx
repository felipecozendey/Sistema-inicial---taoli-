import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { FOOD_TAG_PRESETS } from '@/lib/nutrition-utils'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function FoodCreateModal({ open, onOpenChange }: Props) {
  const { addCustomFood } = useNutritionStore()
  const [name, setName] = useState('')
  const [baseUnit, setBaseUnit] = useState('100g')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [fibers, setFibers] = useState('')
  const [sodium, setSodium] = useState('')
  const [allergens, setAllergens] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Adicione um nome')
      return
    }
    if (!calories) {
      toast.error('Adicione as calorias')
      return
    }
    onOpenChange(false)
    await addCustomFood({
      name: name.trim(),
      baseUnit: baseUnit.trim() || '100g',
      calories: parseFloat(calories) || 0,
      carbsG: parseFloat(carbs) || 0,
      proteinG: parseFloat(protein) || 0,
      fatG: parseFloat(fat) || 0,
      fibersG: parseFloat(fibers) || 0,
      sodiumMg: parseFloat(sodium) || 0,
      allergens: allergens.trim() || null,
      tags,
    })
    toast.success('Alimento cadastrado! 🎉')
    setName('')
    setBaseUnit('100g')
    setCalories('')
    setCarbs('')
    setProtein('')
    setFat('')
    setFibers('')
    setSodium('')
    setAllergens('')
    setTags([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Novo Alimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tofu"
              className="rounded-xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Porção Base</Label>
              <Input
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                placeholder="100g"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Calorias (kcal)</Label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Carbo (g)</Label>
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Proteína (g)</Label>
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Gordura (g)</Label>
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Fibras (g)</Label>
              <Input
                type="number"
                value={fibers}
                onChange={(e) => setFibers(e.target.value)}
                placeholder="0"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-extrabold">Sódio (mg)</Label>
              <Input
                type="number"
                value={sodium}
                onChange={(e) => setSodium(e.target.value)}
                placeholder="0"
                className="rounded-xl font-bold"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Alérgenos (opcional)</Label>
            <Input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="Ex: leite, glúten, soja"
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-extrabold">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {FOOD_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold border-2 transition-all duration-150',
                    tags.includes(tag)
                      ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Check className="w-5 h-5 mr-2" strokeWidth={3} /> Cadastrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
