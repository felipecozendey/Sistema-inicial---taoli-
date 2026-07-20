import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { Search, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function NutritionSettingsTab() {
  const { customFoods, fetchCustomFoods, addCustomFood, deleteCustomFood } = useNutritionStore()
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [baseUnit, setBaseUnit] = useState('100g')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')

  useEffect(() => {
    fetchCustomFoods()
  }, [fetchCustomFoods])

  const filtered = useMemo(() => {
    if (!search.trim()) return customFoods
    return customFoods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
  }, [customFoods, search])

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error('Adicione um nome')
      return
    }
    if (!calories) {
      toast.error('Adicione as calorias')
      return
    }
    await addCustomFood({
      name: name.trim(),
      baseUnit: baseUnit.trim() || '100g',
      calories: parseFloat(calories) || 0,
      carbsG: parseFloat(carbs) || 0,
      proteinG: parseFloat(protein) || 0,
      fatG: parseFloat(fat) || 0,
    })
    toast.success('Alimento cadastrado! 🎉')
    setName('')
    setBaseUnit('100g')
    setCalories('')
    setCarbs('')
    setProtein('')
    setFat('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-extrabold flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#58CC02]" /> Cadastrar Alimento
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs font-extrabold">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tofu"
              className="rounded-xl font-bold"
            />
          </div>
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
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs font-extrabold">Gordura (g)</Label>
            <Input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
              className="rounded-xl font-bold"
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150"
        >
          <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
          Cadastrar
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alimentos..."
            className="rounded-xl pl-9 font-bold"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-8 text-center">
            <p className="text-sm font-bold text-muted-foreground">Nenhum alimento cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4 relative"
              >
                <button
                  onClick={() => deleteCustomFood(f.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#FF4B4B]" />
                </button>
                <h4 className="font-extrabold text-sm pr-8">{f.name}</h4>
                <p className="text-xs font-bold text-muted-foreground mb-2">{f.baseUnit}</p>
                <div className="grid grid-cols-4 gap-1">
                  <div className="text-center bg-[#FF4B4B]/10 rounded-lg py-1">
                    <p className="text-[9px] font-bold text-muted-foreground">kcal</p>
                    <p className="text-xs font-extrabold text-[#FF4B4B]">{f.calories}</p>
                  </div>
                  <div className="text-center bg-[#FFC800]/10 rounded-lg py-1">
                    <p className="text-[9px] font-bold text-muted-foreground">Carb</p>
                    <p className="text-xs font-extrabold text-[#FFC800]">{f.carbsG}g</p>
                  </div>
                  <div className="text-center bg-[#FF4B4B]/10 rounded-lg py-1">
                    <p className="text-[9px] font-bold text-muted-foreground">Prot</p>
                    <p className="text-xs font-extrabold text-[#FF4B4B]">{f.proteinG}g</p>
                  </div>
                  <div className="text-center bg-[#1CB0F6]/10 rounded-lg py-1">
                    <p className="text-[9px] font-bold text-muted-foreground">Gord</p>
                    <p className="text-xs font-extrabold text-[#1CB0F6]">{f.fatG}g</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
