import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { FoodEditModal } from '@/components/health/food-edit-modal'
import { RecipeSection } from '@/components/health/recipe-section'
import { FOOD_TAG_PRESETS } from '@/lib/nutrition-utils'
import { Search, Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function NutritionSettingsTab() {
  const { customFoods, fetchCustomFoods, addCustomFood, deleteCustomFood } = useNutritionStore()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [baseUnit, setBaseUnit] = useState('100g')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])

  useEffect(() => {
    fetchCustomFoods()
  }, [fetchCustomFoods])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>(FOOD_TAG_PRESETS)
    customFoods.forEach((f) => (f.tags || []).forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [customFoods])

  const filtered = useMemo(() => {
    let result = customFoods
    if (search.trim()) {
      result = result.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (selectedTags.length > 0) {
      result = result.filter((f) => selectedTags.every((tag) => (f.tags || []).includes(tag)))
    }
    return result
  }, [customFoods, search, selectedTags])

  const editingFood = useMemo(
    () => customFoods.find((f) => f.id === editingFoodId) || null,
    [customFoods, editingFoodId],
  )

  const toggleFilterTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }
  const toggleFormTag = (tag: string) => {
    setFormTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

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
      tags: formTags,
    })
    toast.success('Alimento cadastrado! 🎉')
    setName('')
    setBaseUnit('100g')
    setCalories('')
    setCarbs('')
    setProtein('')
    setFat('')
    setFormTags([])
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
          <div className="space-y-2 col-span-2">
            <Label className="text-xs font-extrabold">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {FOOD_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFormTag(tag)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold border-2 transition-all duration-150',
                    formTags.includes(tag)
                      ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150"
        >
          <Plus className="w-5 h-5 mr-2" strokeWidth={3} /> Cadastrar
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
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleFilterTag(tag)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-bold border-2 transition-all duration-150',
                selectedTags.includes(tag)
                  ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground',
              )}
            >
              {tag}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-8 text-center">
            <p className="text-sm font-bold text-muted-foreground">Nenhum alimento encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4 relative"
              >
                <div className="absolute top-3 right-3 flex gap-1">
                  <button
                    onClick={() => setEditingFoodId(f.id)}
                    className="p-1.5 rounded-lg hover:bg-[#1CB0F6]/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#1CB0F6]" />
                  </button>
                  <button
                    onClick={() => deleteCustomFood(f.id)}
                    className="p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#FF4B4B]" />
                  </button>
                </div>
                <h4 className="font-extrabold text-sm pr-16">{f.name}</h4>
                <p className="text-xs font-bold text-muted-foreground mb-1">{f.baseUnit}</p>
                {(f.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {f.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1CB0F6]/10 text-[#1CB0F6]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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

      <RecipeSection />
      <FoodEditModal
        open={!!editingFoodId}
        onOpenChange={(o) => {
          if (!o) setEditingFoodId(null)
        }}
        food={editingFood}
      />
    </div>
  )
}
