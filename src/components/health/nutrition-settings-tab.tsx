import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { FoodEditModal } from '@/components/health/food-edit-modal'
import { FoodCreateModal } from '@/components/health/food-create-modal'
import { FoodDetailDialog } from '@/components/health/food-detail-dialog'
import { RecipeSection } from '@/components/health/recipe-section'
import { FOOD_TAG_PRESETS } from '@/lib/nutrition-utils'
import { Search, Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

export function NutritionSettingsTab() {
  const { customFoods, fetchCustomFoods } = useNutritionStore()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null)
  const [detailFoodId, setDetailFoodId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [page, setPage] = useState(0)

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages - 1)
  const paginated = filtered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)

  const editingFood = useMemo(
    () => customFoods.find((f) => f.id === editingFoodId) || null,
    [customFoods, editingFoodId],
  )

  const detailFood = useMemo(
    () => customFoods.find((f) => f.id === detailFoodId) || null,
    [customFoods, detailFoodId],
  )

  const toggleFilterTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    setPage(0)
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
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
            <p className="font-bold text-muted-foreground">Nenhum alimento encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((f) => (
              <div
                key={f.id}
                onClick={() => setDetailFoodId(f.id)}
                className="bg-card border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#1CB0F6]/50 transition-colors duration-150"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold truncate">{f.name}</h4>
                  <p className="font-bold text-muted-foreground">{f.baseUnit}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="font-bold text-[#FF4B4B]">{f.calories} kcal</span>
                    <span className="font-bold text-[#FFC800]">{f.carbsG}g</span>
                    <span className="font-bold text-[#FF4B4B]">{f.proteinG}g P</span>
                    <span className="font-bold text-[#1CB0F6]">{f.fatG}g G</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingFoodId(f.id)
                  }}
                  className="p-2 rounded-xl hover:bg-[#1CB0F6]/10 transition-colors shrink-0"
                >
                  <Pencil className="w-4 h-4 text-[#1CB0F6]" />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 px-1">
              <span className="font-bold text-muted-foreground">
                {currentPage * ITEMS_PER_PAGE + 1}–
                {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl font-bold disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded-xl font-bold disabled:opacity-40"
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
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
      <FoodDetailDialog
        open={!!detailFoodId}
        onOpenChange={(o) => {
          if (!o) setDetailFoodId(null)
        }}
        food={detailFood}
        onEdit={() => {
          if (detailFoodId) {
            setEditingFoodId(detailFoodId)
            setDetailFoodId(null)
          }
        }}
      />
    </div>
  )
}
