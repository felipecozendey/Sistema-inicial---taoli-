import { useState, useMemo } from 'react'
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
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { FOOD_TAG_PRESETS, calcMacrosForAmount } from '@/lib/nutrition-utils'
import { Search, Plus, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type DraftIngredient = {
  foodId: string
  foodName: string
  foodBaseUnit: string
  amount: string
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function RecipeCreatorModal({ open, onOpenChange }: Props) {
  const { customFoods, addRecipe } = useNutritionStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    return customFoods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
  }, [customFoods, search])

  const showNotFound = search.trim().length > 0 && searchResults.length === 0

  const totals = useMemo(() => {
    return ingredients.reduce(
      (acc, ing) => {
        const food = customFoods.find((f) => f.id === ing.foodId)
        if (!food) return acc
        const macros = calcMacrosForAmount(food.baseUnit, ing.amount, {
          calories: food.calories,
          carbsG: food.carbsG,
          proteinG: food.proteinG,
          fatG: food.fatG,
        })
        return {
          calories: acc.calories + macros.calories,
          carbsG: +(acc.carbsG + macros.carbsG).toFixed(1),
          proteinG: +(acc.proteinG + macros.proteinG).toFixed(1),
          fatG: +(acc.fatG + macros.fatG).toFixed(1),
        }
      },
      { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 },
    )
  }, [ingredients, customFoods])

  const addIngredient = (foodId: string) => {
    const food = customFoods.find((f) => f.id === foodId)
    if (!food || ingredients.some((i) => i.foodId === foodId)) return
    setIngredients((prev) => [
      ...prev,
      { foodId, foodName: food.name, foodBaseUnit: food.baseUnit, amount: '' },
    ])
    setSearch('')
  }
  const updateAmount = (foodId: string, amount: string) => {
    setIngredients((prev) => prev.map((i) => (i.foodId === foodId ? { ...i, amount } : i)))
  }
  const removeIngredient = (foodId: string) => {
    setIngredients((prev) => prev.filter((i) => i.foodId !== foodId))
  }
  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Adicione um nome')
      return
    }
    if (ingredients.length === 0) {
      toast.error('Adicione pelo menos um ingrediente')
      return
    }
    onOpenChange(false)
    await addRecipe(
      name.trim(),
      description.trim(),
      instructions.trim(),
      tags,
      ingredients.map((i) => ({ foodId: i.foodId, amount: i.amount || '1' })),
    )
    toast.success('Receita criada! 🍳')
    setName('')
    setDescription('')
    setInstructions('')
    setTags([])
    setIngredients([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Nova Receita</DialogTitle>
          <DialogDescription>Combine alimentos do seu banco de alimentos</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bowl de Frango"
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Descrição (opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Modo de Preparo (opcional)</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="rounded-xl font-bold min-h-[60px]"
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
                      ? 'bg-[#CE82FF] text-white border-[#CE82FF]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-extrabold">Ingredientes</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar alimento..."
                className="rounded-xl pl-9 font-bold"
              />
            </div>
            {showNotFound && (
              <p className="text-xs font-bold text-[#FF4B4B] bg-[#FF4B4B]/10 rounded-xl p-3">
                Alimento não encontrado. Cadastre-o primeiro no banco individual para adicioná-lo à
                receita.
              </p>
            )}
            {searchResults.length > 0 && (
              <div className="max-h-[120px] overflow-y-auto space-y-1 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#3B4A55] p-1">
                {searchResults.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => addIngredient(f.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-extrabold">{f.name}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {f.baseUnit} · {f.calories} kcal
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-[#1CB0F6]" />
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {ingredients.map((ing) => {
                const food = customFoods.find((f) => f.id === ing.foodId)
                const macros = food
                  ? calcMacrosForAmount(food.baseUnit, ing.amount, {
                      calories: food.calories,
                      carbsG: food.carbsG,
                      proteinG: food.proteinG,
                      fatG: food.fatG,
                    })
                  : null
                return (
                  <div
                    key={ing.foodId}
                    className="flex items-center gap-2 bg-muted/30 rounded-2xl p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold truncate">{ing.foodName}</p>
                      {macros && (
                        <p className="text-xs font-bold text-muted-foreground">
                          {macros.calories} kcal · {macros.proteinG}g P · {macros.carbsG}g C ·{' '}
                          {macros.fatG}g G
                        </p>
                      )}
                    </div>
                    <Input
                      value={ing.amount}
                      onChange={(e) => updateAmount(ing.foodId, e.target.value)}
                      placeholder={ing.foodBaseUnit}
                      className="w-24 rounded-xl font-bold text-center text-sm h-9"
                    />
                    <button
                      onClick={() => removeIngredient(ing.foodId)}
                      className="p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4 text-[#FF4B4B]" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          {ingredients.length > 0 && (
            <div className="grid grid-cols-4 gap-2 bg-[#CE82FF]/10 rounded-2xl p-3">
              {[
                { l: 'kcal', v: totals.calories, c: '#FF4B4B' },
                { l: 'Carbo', v: `${totals.carbsG}g`, c: '#FFC800' },
                { l: 'Prot', v: `${totals.proteinG}g`, c: '#FF4B4B' },
                { l: 'Gord', v: `${totals.fatG}g`, c: '#1CB0F6' },
              ].map((m) => (
                <div key={m.l} className="text-center">
                  <p className="text-[10px] font-bold text-muted-foreground">{m.l}</p>
                  <p className="text-sm font-extrabold" style={{ color: m.c }}>
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={handleSubmit}
            className="w-full py-5 rounded-3xl bg-[#CE82FF] hover:bg-[#B36BD9] text-white font-extrabold border-b-4 border-[#9B54BA] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Check className="w-5 h-5 mr-2" strokeWidth={3} />
            Criar Receita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
