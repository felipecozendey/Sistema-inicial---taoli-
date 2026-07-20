import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { FoodEditModal } from '@/components/health/food-edit-modal'
import { FoodCreateModal } from '@/components/health/food-create-modal'
import { RecipeSection } from '@/components/health/recipe-section'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FOOD_TAG_PRESETS } from '@/lib/nutrition-utils'
import { Search, Plus, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NutritionSettingsTab() {
  const { customFoods, fetchCustomFoods, deleteCustomFood } = useNutritionStore()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

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
    if (search.trim())
      result = result.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    if (selectedTags.length > 0)
      result = result.filter((f) => selectedTags.every((tag) => (f.tags || []).includes(tag)))
    return result
  }, [customFoods, search, selectedTags])

  const editingFood = useMemo(
    () => customFoods.find((f) => f.id === editingFoodId) || null,
    [customFoods, editingFoodId],
  )

  const toggleFilterTag = (tag: string) =>
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  return (
    <div className="space-y-6 pb-24">
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
          <ScrollArea className="h-[420px] rounded-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
              {filtered.map((f) => (
                <div
                  key={f.id}
                  className="bg-card border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3 relative"
                >
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setEditingFoodId(f.id)}
                      className="p-1 rounded-lg hover:bg-[#1CB0F6]/10 transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-[#1CB0F6]" />
                    </button>
                    <button
                      onClick={() => deleteCustomFood(f.id)}
                      className="p-1 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-[#FF4B4B]" />
                    </button>
                  </div>
                  <h4 className="font-extrabold text-xs pr-14">{f.name}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mb-1">{f.baseUnit}</p>
                  {(f.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mb-1.5">
                      {f.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#1CB0F6]/10 text-[#1CB0F6]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-5 gap-0.5">
                    <div className="text-center bg-[#FF4B4B]/10 rounded-md py-0.5">
                      <p className="text-[7px] font-bold text-muted-foreground">kcal</p>
                      <p className="text-[10px] font-extrabold text-[#FF4B4B]">{f.calories}</p>
                    </div>
                    <div className="text-center bg-[#FFC800]/10 rounded-md py-0.5">
                      <p className="text-[7px] font-bold text-muted-foreground">Carb</p>
                      <p className="text-[10px] font-extrabold text-[#FFC800]">{f.carbsG}g</p>
                    </div>
                    <div className="text-center bg-[#FF4B4B]/10 rounded-md py-0.5">
                      <p className="text-[7px] font-bold text-muted-foreground">Prot</p>
                      <p className="text-[10px] font-extrabold text-[#FF4B4B]">{f.proteinG}g</p>
                    </div>
                    <div className="text-center bg-[#1CB0F6]/10 rounded-md py-0.5">
                      <p className="text-[7px] font-bold text-muted-foreground">Gord</p>
                      <p className="text-[10px] font-extrabold text-[#1CB0F6]">{f.fatG}g</p>
                    </div>
                    <div className="text-center bg-[#58CC02]/10 rounded-md py-0.5">
                      <p className="text-[7px] font-bold text-muted-foreground">Fibr</p>
                      <p className="text-[10px] font-extrabold text-[#58CC02]">{f.fibersG}g</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <RecipeSection />

      <button
        onClick={() => setCreateModalOpen(true)}
        className="fixed bottom-20 right-4 z-50 py-3.5 px-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 shadow-lg flex items-center gap-2"
      >
        <Plus className="w-5 h-5" strokeWidth={3} /> Novo Alimento
      </button>

      <FoodCreateModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
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
