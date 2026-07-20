import { useState, useMemo, useCallback } from 'react'
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
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { DEFAULT_FOODS } from '@/components/health/default-foods'
import { calcMacrosForAmount, parseBase } from '@/lib/nutrition-utils'
import { Search, Plus, Check, ChefHat } from 'lucide-react'
import { toast } from 'sonner'

type FoodOption = {
  id: string
  name: string
  baseUnit: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  fibersG: number
  sodiumMg: number
  allergens: string | null
  isRecipe: boolean
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  planId: string
}

export function FoodEntryModal({ open, onOpenChange, planId }: Props) {
  const { customFoods, nutritionRecipes, addDietPlanItem } = useNutritionStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<FoodOption | null>(null)
  const [quantity, setQuantity] = useState('100')

  const allFoods = useMemo<FoodOption[]>(() => {
    const foods: FoodOption[] = [
      ...DEFAULT_FOODS.map((f) => ({
        id: `default_${f.name}`,
        name: f.name,
        baseUnit: f.baseUnit,
        calories: f.calories,
        carbsG: f.carbsG,
        proteinG: f.proteinG,
        fatG: f.fatG,
        fibersG: 0,
        sodiumMg: 0,
        allergens: null,
        isRecipe: false,
      })),
      ...customFoods.map((f) => ({
        id: f.id,
        name: f.name,
        baseUnit: f.baseUnit,
        calories: f.calories,
        carbsG: f.carbsG,
        proteinG: f.proteinG,
        fatG: f.fatG,
        fibersG: f.fibersG,
        sodiumMg: f.sodiumMg,
        allergens: f.allergens,
        isRecipe: false,
      })),
      ...nutritionRecipes.map((r) => {
        const t = r.ingredients.reduce(
          (a, i) => ({
            calories: a.calories + i.calories,
            carbsG: a.carbsG + i.carbsG,
            proteinG: a.proteinG + i.proteinG,
            fatG: a.fatG + i.fatG,
            fibersG: a.fibersG + (i.fibersG || 0),
            sodiumMg: a.sodiumMg + (i.sodiumMg || 0),
          }),
          { calories: 0, carbsG: 0, proteinG: 0, fatG: 0, fibersG: 0, sodiumMg: 0 },
        )
        return {
          id: `recipe_${r.id}`,
          name: r.name,
          baseUnit: '1 porção',
          ...t,
          allergens: null,
          isRecipe: true,
        }
      }),
    ]
    return foods
  }, [customFoods, nutritionRecipes])

  const filtered = useMemo(() => {
    if (!search.trim()) return allFoods
    return allFoods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
  }, [allFoods, search])

  const calc = useMemo(() => {
    if (!selected) return null
    return calcMacrosForAmount(selected.baseUnit, quantity, {
      calories: selected.calories,
      carbsG: selected.carbsG,
      proteinG: selected.proteinG,
      fatG: selected.fatG,
      fibersG: selected.fibersG,
      sodiumMg: selected.sodiumMg,
    })
  }, [selected, quantity])

  const handleSelect = useCallback((f: FoodOption) => {
    setSelected(f)
    setQuantity(String(parseBase(f.baseUnit)))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!selected || !calc || !planId) {
      toast.error('Selecione um alimento')
      return
    }
    onOpenChange(false)
    const unitPart = selected.baseUnit.replace(/[\d.\s]+/g, '').trim()
    addDietPlanItem(planId, {
      description: selected.name,
      quantity: unitPart ? `${quantity}${unitPart}` : `${quantity}g`,
      calories: calc.calories,
      carbsG: calc.carbsG,
      proteinG: calc.proteinG,
      fatG: calc.fatG,
      fibersG: calc.fibersG,
      sodiumMg: calc.sodiumMg,
      allergens: selected.allergens,
    })
    toast.success('Alimento adicionado! 🎉')
    setSearch('')
    setSelected(null)
  }, [selected, calc, quantity, planId, addDietPlanItem, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Adicionar Alimento</DialogTitle>
          <DialogDescription>
            Busque alimentos ou receitas para adicionar à refeição
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!selected ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar alimento ou receita..."
                  className="rounded-xl pl-9 font-bold"
                  autoFocus
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-1 rounded-2xl">
                {filtered.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelect(f)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {f.isRecipe && <ChefHat className="w-4 h-4 text-[#CE82FF] shrink-0" />}
                      <div>
                        <p className="text-sm font-extrabold">{f.name}</p>
                        <p className="text-xs font-bold text-muted-foreground">
                          {f.baseUnit} · {f.calories} kcal{f.isRecipe ? ' · Receita' : ''}
                        </p>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-[#1CB0F6] shrink-0" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-center text-sm font-bold text-muted-foreground py-8">
                    Nenhum resultado encontrado
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1CB0F6]/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {selected.isRecipe && <ChefHat className="w-4 h-4 text-[#CE82FF]" />}
                    <h3 className="font-extrabold">{selected.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-xs font-bold text-[#1CB0F6]"
                  >
                    Trocar
                  </button>
                </div>
                <p className="text-xs font-bold text-muted-foreground">
                  Porção base: {selected.baseUnit} · {selected.calories} kcal
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-extrabold">
                  {selected.isRecipe ? 'Porções' : 'Quantidade'}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl text-center font-extrabold text-lg h-14 border-2 border-b-4"
                />
              </div>
              {calc && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { l: 'kcal', v: calc.calories, c: '#FF4B4B' },
                    { l: 'Carbo', v: `${calc.carbsG}g`, c: '#FFC800' },
                    { l: 'Prot', v: `${calc.proteinG}g`, c: '#FF4B4B' },
                    { l: 'Gord', v: `${calc.fatG}g`, c: '#1CB0F6' },
                  ].map((m) => (
                    <div key={m.l} className="bg-muted/30 rounded-xl p-2 text-center">
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
                className="w-full py-6 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150"
              >
                <Check className="w-5 h-5 mr-2" strokeWidth={3} /> Adicionar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
