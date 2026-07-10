import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { MicroGoalsChecklist } from '@/components/health/micro-goals-checklist'
import { NewMealModal } from '@/components/health/new-meal-modal'
import { Plus } from 'lucide-react'

const DAILY_CALORIE_GOAL = 2000
const PROTEIN_GOAL = 150
const CARBS_GOAL = 250
const FAT_GOAL = 65

export function NutritionOverview() {
  const { mealLogs } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = mealLogs.filter((l) => l.date === today)

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0)
  const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0)
  const totalFat = todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)

  const caloriePct = Math.min((totalCalories / DAILY_CALORIE_GOAL) * 100, 100)
  const proteinPct = Math.min((totalProtein / PROTEIN_GOAL) * 100, 100)
  const carbsPct = Math.min((totalCarbs / CARBS_GOAL) * 100, 100)
  const fatPct = Math.min((totalFat / FAT_GOAL) * 100, 100)

  return (
    <div className="space-y-6">
      <button
        onClick={() => setModalOpen(true)}
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
              {Math.round(totalCalories)}
            </span>
            <span className="text-sm font-bold text-muted-foreground"> / {DAILY_CALORIE_GOAL}</span>
          </div>
        </div>
        <div className="w-full h-6 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF4B4B] to-[#FF8A4B] transition-all duration-500"
            style={{ width: `${caloriePct}%` }}
          />
        </div>
        <p className="text-xs font-bold text-muted-foreground mt-2">
          {caloriePct >= 100
            ? '🔥 Meta atingida!'
            : `${Math.round(DAILY_CALORIE_GOAL - totalCalories)} kcal restantes`}
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
              {Math.round(totalProtein)}g / {PROTEIN_GOAL}g
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF4B4B] transition-all duration-500"
              style={{ width: `${proteinPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-extrabold flex items-center gap-1.5">
              <span>🍞</span> Carboidratos
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              {Math.round(totalCarbs)}g / {CARBS_GOAL}g
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FFC800] transition-all duration-500"
              style={{ width: `${carbsPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-extrabold flex items-center gap-1.5">
              <span>🥑</span> Gorduras
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              {Math.round(totalFat)}g / {FAT_GOAL}g
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1CB0F6] transition-all duration-500"
              style={{ width: `${fatPct}%` }}
            />
          </div>
        </div>
      </div>

      <MicroGoalsChecklist />
      <NewMealModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
