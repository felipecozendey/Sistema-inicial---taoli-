import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNutritionStore, type CustomFood } from '@/stores/use-nutrition-store'
import { Pencil, Trash2, Flame } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  food: CustomFood | null
  onEdit: () => void
}

export function FoodDetailDialog({ open, onOpenChange, food, onEdit }: Props) {
  const { deleteCustomFood } = useNutritionStore()

  const handleDelete = () => {
    if (!food) return
    onOpenChange(false)
    deleteCustomFood(food.id)
    toast.success('Alimento excluído! 🗑️')
  }

  if (!food) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{food.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-muted-foreground">Porção base:</span>
            <span className="font-extrabold">{food.baseUnit}</span>
          </div>

          <div className="bg-[#FF4B4B]/10 rounded-2xl p-4 flex items-center justify-center gap-2">
            <Flame className="w-6 h-6 text-[#FF4B4B]" />
            <span className="text-2xl font-extrabold text-[#FF4B4B]">{food.calories}</span>
            <span className="font-bold text-muted-foreground">kcal</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#FFC800]/10 rounded-2xl p-3 text-center">
              <p className="font-bold text-muted-foreground">Carbo</p>
              <p className="text-xl font-extrabold text-[#FFC800]">{food.carbsG}g</p>
            </div>
            <div className="bg-[#FF4B4B]/10 rounded-2xl p-3 text-center">
              <p className="font-bold text-muted-foreground">Prot</p>
              <p className="text-xl font-extrabold text-[#FF4B4B]">{food.proteinG}g</p>
            </div>
            <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 text-center">
              <p className="font-bold text-muted-foreground">Gord</p>
              <p className="text-xl font-extrabold text-[#1CB0F6]">{food.fatG}g</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#58CC02]/10 rounded-2xl p-3 text-center">
              <p className="font-bold text-muted-foreground">Fibras</p>
              <p className="text-lg font-extrabold text-[#58CC02]">{food.fibersG}g</p>
            </div>
            <div className="bg-muted/30 rounded-2xl p-3 text-center">
              <p className="font-bold text-muted-foreground">Sódio</p>
              <p className="text-lg font-extrabold">{food.sodiumMg}mg</p>
            </div>
          </div>

          {food.allergens && (
            <div className="bg-[#FF4B4B]/5 border-2 border-[#FF4B4B]/20 rounded-2xl p-3">
              <p className="font-bold text-muted-foreground mb-1">Alérgenos / Contraindicações</p>
              <p className="font-extrabold text-[#FF4B4B]">{food.allergens}</p>
            </div>
          )}

          {food.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {food.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-[#1CB0F6]/10 text-[#1CB0F6] font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={onEdit}
              className="flex-1 py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white font-extrabold border-b-4 border-[#1890D0] active:translate-y-1 active:border-b-0 transition-all duration-150"
            >
              <Pencil className="w-5 h-5 mr-2" /> Editar
            </Button>
            <Button
              onClick={handleDelete}
              className="py-5 px-5 rounded-3xl bg-[#FF4B4B] hover:bg-[#E03E3E] text-white font-extrabold border-b-4 border-[#C73838] active:translate-y-1 active:border-b-0 transition-all duration-150"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
