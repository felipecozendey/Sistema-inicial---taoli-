import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { MacroPieChart } from '@/components/health/macro-pie-chart'
import { MicroGoalsChecklist } from '@/components/health/micro-goals-checklist'
import { NewMealModal } from '@/components/health/new-meal-modal'
import { Plus } from 'lucide-react'

const PROTEIN_GOAL = 150
const CARBS_GOAL = 250
const FAT_GOAL = 65

export function NutritionOverview() {
  const mealLogs = useAppStore((s) => s.mealLogs)
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const { dietPlans, fetchDietPlans } = useNutritionStore()
  const [modalOpen, setModalOpen] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    fetchDietPlans()
  }, [fetchDietPlans])

  const todayMeals = useMemo(() => mealLogs.filter((l: any) => l.date === today), [mealLogs, today])

  const totals = useMemo(
    () => ({
      calories: todayMeals.reduce((s: number, m: any) => s + (m.calories || 0), 0),
      protein: todayMeals.reduce((s: number, m: any) => s + (m.protein || 0), 0),
      carbs: todayMeals.reduce((s: number, m: any) => s + (m.carbs || 0), 0),
      fat: todayMeals.reduce((s: number, m: any) => s + (m.fat || 0), 0),
    }),
    [todayMeals],
  )

  const sortedMetrics = useMemo(
    () => [...bodyMetrics].sort((a: any, b: any) => String(a.date).localeCompare(String(b.date))),
    [bodyMetrics],
  )
  const latest = sortedMetrics[sortedMetrics.length - 1]
  const ventaGoal = latest?.ventaTarget || latest?.get || 2000

  const planTotals = useMemo(
    () =>
      dietPlans.reduce(
        (acc, p) => {
          p.items.forEach((i) => {
            acc.calories += i.calories
            acc.carbsG += i.carbsG
            acc.proteinG += i.proteinG
            acc.fatG += i.fatG
          })
          return acc
        },
        { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 },
      ),
    [dietPlans],
  )

  const macroCalories = useMemo(
    () => ({
      carbs: planTotals.carbsG * 4,
      protein: planTotals.proteinG * 4,
      fat: planTotals.fatG * 9,
    }),
    [planTotals],
  )
  const macroTotal = macroCalories.carbs + macroCalories.protein + macroCalories.fat
  const macroPct = useMemo(
    () => ({
      carbs: macroTotal > 0 ? Math.round((macroCalories.carbs / macroTotal) * 100) : 0,
      protein: macroTotal > 0 ? Math.round((macroCalories.protein / macroTotal) * 100) : 0,
      fat: macroTotal > 0 ? Math.round((macroCalories.fat / macroTotal) * 100) : 0,
    }),
    [macroCalories, macroTotal],
  )

  const caloriePct = Math.min((totals.calories / ventaGoal) * 100, 100)
  const handleOpenModal = useCallback(() => setModalOpen(true), [])
  const handleCloseModal = useCallback((open: boolean) => setModalOpen(open), [])

  const macroBars = useMemo(
    () => [
      {
        emoji: '🥩',
        label: 'Proteínas',
        value: totals.protein,
        goal: PROTEIN_GOAL,
        color: '#FF4B4B',
      },
      {
        emoji: '🍞',
        label: 'Carboidratos',
        value: totals.carbs,
        goal: CARBS_GOAL,
        color: '#FFC800',
      },
      { emoji: '🥑', label: 'Gorduras', value: totals.fat, goal: FAT_GOAL, color: '#1CB0F6' },
    ],
    [totals],
  )

  return (
    <div className="space-y-6">
      <button
        onClick={handleOpenModal}
        className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-lg border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
      >
        <Plus className="w-6 h-6" strokeWidth={3} /> Adicionar Refeição
      </button>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">Painel Metabólico Diário</h3>
          <span className="text-xs font-bold text-muted-foreground">VENTA: {ventaGoal} kcal</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-4">
          <div className="flex items-center gap-4">
            <MacroPieChart
              carbsG={macroCalories.carbs}
              proteinG={macroCalories.protein}
              fatG={macroCalories.fat}
              size={110}
            />
            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold mb-1">Distribuição</h4>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FFC800]" />
                <span className="text-sm font-bold">Carbo: {macroPct.carbs}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF4B4B]" />
                <span className="text-sm font-bold">Prot: {macroPct.protein}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#1CB0F6]" />
                <span className="text-sm font-bold">Gord: {macroPct.fat}%</span>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-extrabold">Calorias</span>
                <span className="text-sm font-bold text-muted-foreground">
                  {Math.round(totals.calories)} / {ventaGoal} kcal
                </span>
              </div>
              <div className="w-full h-6 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF4B4B] to-[#FF8A4B] transition-all duration-500"
                  style={{ width: `${caloriePct}%` }}
                />
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                {caloriePct >= 100
                  ? '🔥 Meta atingida!'
                  : `${Math.round(ventaGoal - totals.calories)} kcal restantes`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t-2 border-muted pt-4">
          {macroBars.map((m) => {
            const pct = Math.min((m.value / m.goal) * 100, 100)
            return (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-extrabold flex items-center gap-1.5">
                    <span>{m.emoji}</span> {m.label}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {Math.round(m.value)}g / {m.goal}g
                  </span>
                </div>
                <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <MicroGoalsChecklist />
      <NewMealModal open={modalOpen} onOpenChange={handleCloseModal} />
    </div>
  )
}
