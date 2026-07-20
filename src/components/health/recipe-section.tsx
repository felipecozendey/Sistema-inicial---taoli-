import { useState, useEffect, useMemo } from 'react'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { RecipeCreatorModal } from '@/components/health/recipe-creator-modal'
import { Plus, Trash2, ChefHat } from 'lucide-react'

export function RecipeSection() {
  const { nutritionRecipes, fetchRecipes, deleteRecipe } = useNutritionStore()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  const recipeStats = useMemo(() => {
    return nutritionRecipes.map((r) => ({
      id: r.id,
      calories: r.ingredients.reduce((s, i) => s + i.calories, 0),
      protein: r.ingredients.reduce((s, i) => s + i.proteinG, 0),
      ingredientCount: r.ingredients.length,
    }))
  }, [nutritionRecipes])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-[#CE82FF]" /> Minhas Receitas
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-2xl bg-[#CE82FF] hover:bg-[#B36BD9] text-white font-extrabold text-sm border-b-4 border-[#9B54BA] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" strokeWidth={3} /> Nova Receita
        </button>
      </div>

      {nutritionRecipes.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-muted-foreground">Nenhuma receita criada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nutritionRecipes.map((recipe) => {
            const stats = recipeStats.find((s) => s.id === recipe.id)
            return (
              <div
                key={recipe.id}
                className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4 relative"
              >
                <button
                  onClick={() => deleteRecipe(recipe.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#FF4B4B]" />
                </button>
                <h4 className="font-extrabold text-sm pr-8">{recipe.name}</h4>
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 mb-2">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#CE82FF]/15 text-[#CE82FF]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs font-bold text-muted-foreground mb-1">
                  {stats?.ingredientCount || 0} ingredientes · {Math.round(stats?.calories || 0)}{' '}
                  kcal · {Math.round(stats?.protein || 0)}g prot
                </p>
                <div className="text-xs text-muted-foreground">
                  {recipe.ingredients.map((ing, i) => (
                    <span key={ing.id}>
                      {i > 0 && ' · '}
                      {ing.foodName} ({ing.amount})
                    </span>
                  ))}
                </div>
                {recipe.instructions && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{recipe.instructions}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <RecipeCreatorModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
