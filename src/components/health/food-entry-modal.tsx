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
import { Search, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'

type FoodOption = {
  name: string
  baseUnit: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
}

function parseBase(unit: string): number {
  const m = unit.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : 1
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  planId: string
}

export function FoodEntryModal({ open, onOpenChange, planId }: Props) {
  const { customFoods, addDietPlanItem } = useNutritionStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<FoodOption | null>(null)
  const [quantity, setQuantity] = useState('100')

  const allFoods = useMemo<FoodOption[]>(
    () => [
      ...DEFAULT_FOODS,
      ...customFoods.map((f) => ({
        name: f.name,
        baseUnit: f.baseUnit,
        calories: f.calories,
        carbsG: f.carbsG,
        proteinG: f.proteinG,
        fatG: f.fatG,
      })),
    ],
    [customFoods],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return allFoods
    return allFoods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
  }, [allFoods, search])

  const calc = useMemo(() => {
    if (!selected) return null
    const qty = parseFloat(quantity) || 0
    const base = parseBase(selected.baseUnit)
    const factor = base > 0 ? qty / base : 0
    return {
      calories: Math.round(selected.calories * factor),
      carbsG: +(selected.carbsG * factor).toFixed(1),
      proteinG: +(selected.proteinG * factor).toFixed(1),
      fatG: +(selected.fatG * factor).toFixed(1),
    }
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
          <DialogDescription>Busque e adicione alimentos à refeição</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!selected ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar alimento..."
                  className="rounded-xl pl-9 font-bold"
                  autoFocus
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-1 rounded-2xl">
                {filtered.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(f)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors text-left"
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
                {filtered.length === 0 && (
                  <p className="text-center text-sm font-bold text-muted-foreground py-8">
                    Nenhum alimento encontrado
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1CB0F6]/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-extrabold">{selected.name}</h3>
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
                <Label className="text-sm font-extrabold">Quantidade</Label>
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
                <Check className="w-5 h-5 mr-2" strokeWidth={3} />
                Adicionar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
