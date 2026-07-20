import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNutritionStore, DietPlanItem } from '@/stores/use-nutrition-store'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  planId: string
  item: DietPlanItem | null
}

export function DietItemEditModal({ open, onOpenChange, planId, item }: Props) {
  const { updateDietPlanItem } = useNutritionStore()
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [fibers, setFibers] = useState('')
  const [sodium, setSodium] = useState('')
  const [allergens, setAllergens] = useState('')

  useEffect(() => {
    if (item) {
      setDescription(item.description)
      setQuantity(item.quantity)
      setCalories(String(item.calories))
      setCarbs(String(item.carbsG))
      setProtein(String(item.proteinG))
      setFat(String(item.fatG))
      setFibers(String(item.fibersG))
      setSodium(String(item.sodiumMg))
      setAllergens(item.allergens || '')
    }
  }, [item])

  const handleSubmit = () => {
    if (!item || !planId) return
    if (!description.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    onOpenChange(false)
    updateDietPlanItem(planId, item.id, {
      description: description.trim(),
      quantity: quantity.trim(),
      calories: parseFloat(calories) || 0,
      carbsG: parseFloat(carbs) || 0,
      proteinG: parseFloat(protein) || 0,
      fatG: parseFloat(fat) || 0,
      fibersG: parseFloat(fibers) || 0,
      sodiumMg: parseFloat(sodium) || 0,
      allergens: allergens.trim() || null,
    })
    toast.success('Item atualizado! ✏️')
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Editar Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome do Item</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl font-bold"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Porção</Label>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 150g"
              className="rounded-xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Calorias</Label>
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
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Gordura (g)</Label>
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Fibras (g)</Label>
              <Input
                type="number"
                value={fibers}
                onChange={(e) => setFibers(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Sódio (mg)</Label>
              <Input
                type="number"
                value={sodium}
                onChange={(e) => setSodium(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Alérgenos</Label>
            <Input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="Ex: leite, glúten"
              className="rounded-xl font-bold"
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white font-extrabold border-b-4 border-[#1890D0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Check className="w-5 h-5 mr-2" strokeWidth={3} /> Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
