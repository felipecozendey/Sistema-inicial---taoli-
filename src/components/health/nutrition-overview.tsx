import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { MacroPieChart } from '@/components/health/macro-pie-chart'
import { MicroGoalsChecklist } from '@/components/health/micro-goals-checklist'
import { NewMealModal } from '@/components/health/new-meal-modal'
import { Plus } from 'lucide-react'

const DAILY_CALORIE_GOAL = 2000
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
      calories: todayMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0),
      protein: todayMeals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0),
      carbs: todayMeals.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0),
      fat: todayMeals.reduce((sum: number, m: any) => sum + (m.fat || 0), 0),
    }),
    [todayMeals],
  )

  const percentages = useMemo(
    () => ({
      calories: Math.min((totals.calories / DAILY_CALORIE_GOAL) * 100, 100),
      protein: Math.min((totals.protein / PROTEIN_GOAL) * 100, 100),
      carbs: Math.min((totals.carbs / CARBS_GOAL) * 100, 100),
      fat: Math.min((totals.fat / FAT_GOAL) * 100, 100),
    }),
    [totals],
  )

  const sortedMetrics = useMemo(
    () => [...bodyMetrics].sort((a: any, b: any) => String(a.date).localeCompare(String(b.date))),
    [bodyMetrics],
  )
  const latest = sortedMetrics[sortedMetrics.length - 1]
  const tmb = latest?.tmb || 2000
  const get = latest?.get || 2500

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

  const planBars = useMemo(
    () => [
      {
        label: 'Calorias',
        value: planTotals.calories,
        target: get,
        color: '#FF4B4B',
        unit: 'kcal',
      },
      { label: 'Carboidratos', value: planTotals.carbsG, target: 250, color: '#FFC800', unit: 'g' },
      { label: 'Proteínas', value: planTotals.proteinG, target: 150, color: '#FF4B4B', unit: 'g' },
      { label: 'Gorduras', value: planTotals.fatG, target: 65, color: '#1CB0F6', unit: 'g' },
    ],
    [planTotals, get],
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

  const handleOpenModal = useCallback(() => setModalOpen(true), [])
  const handleCloseModal = useCallback((open: boolean) => setModalOpen(open), [])

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
          <h3 className="text-lg font-extrabold">Resumo do Plano</h3>
          <span className="text-xs font-bold text-muted-foreground">
            TMB: {tmb} · GET: {get}
          </span>
        </div>
        <div className="space-y-3 mb-4">
          {planBars.map((b) => {
            const pct = Math.min((b.value / b.target) * 100, 100)
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-extrabold">{b.label}</span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {Math.round(b.value)}
                    {b.unit} / {b.target}
                    {b.unit}
                  </span>
                </div>
                <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: b.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {macroTotal > 0 && (
          <div className="flex items-center gap-4 bg-muted/30 rounded-2xl p-4">
            <MacroPieChart
              carbsG={macroCalories.carbs}
              proteinG={macroCalories.protein}
              fatG={macroCalories.fat}
              size={100}
            />
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-extrabold mb-1">Distribuição Calórica</h4>
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
        )}
      </div>

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
        {[
          {
            emoji: '🥩',
            label: 'Proteínas',
            value: totals.protein,
            goal: PROTEIN_GOAL,
            pct: percentages.protein,
            color: '#FF4B4B',
          },
          {
            emoji: '🍞',
            label: 'Carboidratos',
            value: totals.carbs,
            goal: CARBS_GOAL,
            pct: percentages.carbs,
            color: '#FFC800',
          },
          {
            emoji: '🥑',
            label: 'Gorduras',
            value: totals.fat,
            goal: FAT_GOAL,
            pct: percentages.fat,
            color: '#1CB0F6',
          },
        ].map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1.5">
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
                style={{ width: `${m.pct}%`, backgroundColor: m.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <MicroGoalsChecklist />
      <NewMealModal open={modalOpen} onOpenChange={handleCloseModal} />
    </div>
  )
}
