import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { MicroGoalsChecklist } from '@/components/health/micro-goals-checklist'
import { NewMealModal } from '@/components/health/new-meal-modal'
import { Plus } from 'lucide-react'

const DAILY_CALORIE_GOAL = 2000
const PROTEIN_GOAL = 150
const CARBS_GOAL = 250
const FAT_GOAL = 65

export function NutritionOverview() {
  const mealLogs = useAppStore((s) => s.mealLogs)
  const [modalOpen, setModalOpen] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const todayMeals = useMemo(() => mealLogs.filter((l) => l.date === today), [mealLogs, today])

  const totals = useMemo(() => {
    return {
      calories: todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
      carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
      fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0),
    }
  }, [todayMeals])

  const percentages = useMemo(
    () => ({
      calories: Math.min((totals.calories / DAILY_CALORIE_GOAL) * 100, 100),
      protein: Math.min((totals.protein / PROTEIN_GOAL) * 100, 100),
      carbs: Math.min((totals.carbs / CARBS_GOAL) * 100, 100),
      fat: Math.min((totals.fat / FAT_GOAL) * 100, 100),
    }),
    [totals],
  )

  const handleOpenModal = useCallback(() => setModalOpen(true), [])
  const handleCloseModal = useCallback((open: boolean) => setModalOpen(open), [])

  return (
    <div className="space-y-6">
      <button
        onClick={handleOpenModal}
        className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-lg border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
        Adicionar Refeição
      </button>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-extrabold">Calorias de Hoje</h3>
            <p className="text-sm text-muted-foreground font-bold">
              Meta: {DAILY_CALORIE_GOAL} kcal
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-[#FF4B4B]">
              {Math.round(totals.calories)}
            </span>
            <span className="text-sm font-bold text-muted-foreground"> / {DAILY_CALORIE_GOAL}</span>
          </div>
        </div>
        <div className="w-full h-6 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF4B4B] to-[#FF8A4B] transition-all duration-500"
            style={{ width: `${percentages.calories}%` }}
          />
        </div>
        <p className="text-xs font-bold text-muted-foreground mt-2">
          {percentages.calories >= 100
            ? '🔥 Meta atingida!'
            : `${Math.round(DAILY_CALORIE_GOAL - totals.calories)} kcal restantes`}
        </p>
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-5">
        <h3 className="text-lg font-extrabold">Macronutrientes</h3>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-extrabold flex items-center gap-1.5">
              <span>🥩</span> Proteínas
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              {Math.round(totals.protein)}g / {PROTEIN_GOAL}g
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF4B4B] transition-all duration-500"
              style={{ width: `${percentages.protein}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-extrabold flex items-center gap-1.5">
              <span>🍞</span> Carboidratos
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              {Math.round(totals.carbs)}g / {CARBS_GOAL}g
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FFC800] transition-all duration-500"
              style={{ width: `${percentages.carbs}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-extrabold flex items-center gap-1.5">
              <span>🥑</span> Gorduras
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              {Math.round(totals.fat)}g / {FAT_GOAL}g
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1CB0F6] transition-all duration-500"
              style={{ width: `${percentages.fat}%` }}
            />
          </div>
        </div>
      </div>

      <MicroGoalsChecklist />
      <NewMealModal open={modalOpen} onOpenChange={handleCloseModal} />
    </div>
  )
}
