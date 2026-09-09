import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { MacroPieChart } from '@/components/health/macro-pie-chart'
import { MicroGoalsChecklist } from '@/components/health/micro-goals-checklist'
import { NewMealModal } from '@/components/health/new-meal-modal'
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
import { Plus, Settings2, Sparkles } from 'lucide-react'

export function NutritionOverview() {
  const mealLogs = useAppStore((s) => s.mealLogs)
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const {
    dietPlans,
    fetchDietPlans,
    macroGoalConfig,
    fetchMacroGoals,
    updateMacroGoalConfig,
    loadModelDietPlans,
  } = useNutritionStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [goalsModalOpen, setGoalsModalOpen] = useState(false)
  const [draftProteinPerKg, setDraftProteinPerKg] = useState('2.0')
  const [draftFatPct, setDraftFatPct] = useState('25')

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    fetchDietPlans()
    fetchMacroGoals()
  }, [fetchDietPlans, fetchMacroGoals])

  const todayMeals = useMemo(() => mealLogs.filter((l: any) => l.date === today), [mealLogs, today])

  const totals = useMemo(
    () => ({
      calories: todayMeals.reduce((s: number, m: any) => s + (m.calories || 0), 0),
      protein: todayMeals.reduce((s: number, m: any) => s + (m.protein || 0), 0),
      carbs: todayMeals.reduce((s: number, m: any) => s + (m.carbs || 0), 0),
      fat: todayMeals.reduce((s: number, m: any) => s + (m.fat || 0), 0),
      fibersG: todayMeals.reduce((s: number, m: any) => s + (m.fibersG || 0), 0),
      sodiumMg: todayMeals.reduce((s: number, m: any) => s + (m.sodiumMg || 0), 0),
    }),
    [todayMeals],
  )

  const sortedMetrics = useMemo(
    () => [...bodyMetrics].sort((a: any, b: any) => String(a.date).localeCompare(String(b.date))),
    [bodyMetrics],
  )
  const latest = sortedMetrics[sortedMetrics.length - 1]
  const ventaGoal = latest?.ventaTarget || latest?.get || 2000

  // Macro Goals calculation: user config or fallback formula
  const userProteinPerKg = macroGoalConfig?.proteinGPerKg ?? 2.0
  const userFatPct = macroGoalConfig?.fatPct ?? 25.0

  const macroGoals = useMemo(() => {
    const w = latest?.weight || 70
    const protein = Math.round(w * userProteinPerKg)
    const fat = Math.round((ventaGoal * (userFatPct / 100)) / 9)
    const carbs = Math.max(0, Math.round((ventaGoal - protein * 4 - fat * 9) / 4))
    return { protein, carbs, fat }
  }, [ventaGoal, latest?.weight, userProteinPerKg, userFatPct])

  // Plan totals (Diet Plan)
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

  // Plan distribution calories & %
  const planCalories = useMemo(
    () => ({
      carbs: planTotals.carbsG * 4,
      protein: planTotals.proteinG * 4,
      fat: planTotals.fatG * 9,
    }),
    [planTotals],
  )
  const planTotal = planCalories.carbs + planCalories.protein + planCalories.fat
  const planPct = useMemo(
    () => ({
      carbs: planTotal > 0 ? Math.round((planCalories.carbs / planTotal) * 100) : 0,
      protein: planTotal > 0 ? Math.round((planCalories.protein / planTotal) * 100) : 0,
      fat: planTotal > 0 ? Math.round((planCalories.fat / planTotal) * 100) : 0,
    }),
    [planCalories, planTotal],
  )

  // Consumed today distribution calories & %
  const consumedCalories = useMemo(
    () => ({
      carbs: totals.carbs * 4,
      protein: totals.protein * 4,
      fat: totals.fat * 9,
    }),
    [totals],
  )
  const consumedTotal = consumedCalories.carbs + consumedCalories.protein + consumedCalories.fat
  const consumedPct = useMemo(
    () => ({
      carbs: consumedTotal > 0 ? Math.round((consumedCalories.carbs / consumedTotal) * 100) : 0,
      protein: consumedTotal > 0 ? Math.round((consumedCalories.protein / consumedTotal) * 100) : 0,
      fat: consumedTotal > 0 ? Math.round((consumedCalories.fat / consumedTotal) * 100) : 0,
    }),
    [consumedCalories, consumedTotal],
  )

  const caloriePct = Math.min((totals.calories / ventaGoal) * 100, 100)
  const handleOpenModal = useCallback(() => setModalOpen(true), [])
  const handleCloseModal = useCallback((open: boolean) => setModalOpen(open), [])

  const handleOpenGoalsModal = () => {
    setDraftProteinPerKg(String(userProteinPerKg))
    setDraftFatPct(String(userFatPct))
    setGoalsModalOpen(true)
  }

  const handleSaveGoals = async () => {
    const p = parseFloat(draftProteinPerKg) || 2.0
    const f = parseFloat(draftFatPct) || 25.0
    await updateMacroGoalConfig({ proteinGPerKg: p, fatPct: f })
    setGoalsModalOpen(false)
  }

  const macroBars = useMemo(
    () => [
      {
        emoji: '🥩',
        label: 'Proteínas',
        value: totals.protein,
        goal: macroGoals.protein,
        color: '#FF4B4B',
      },
      {
        emoji: '🍞',
        label: 'Carboidratos',
        value: totals.carbs,
        goal: macroGoals.carbs,
        color: '#FFC800',
      },
      { emoji: '🥑', label: 'Gorduras', value: totals.fat, goal: macroGoals.fat, color: '#1CB0F6' },
    ],
    [totals, macroGoals],
  )

  return (
    <div className="space-y-6">
      {/* Top Banner if no diet plans configured */}
      {dietPlans.length === 0 && (
        <div className="bg-gradient-to-r from-[#1CB0F6]/10 to-[#58CC02]/10 border-2 border-dashed border-[#1CB0F6]/30 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm font-extrabold">Primeira vez por aqui?</p>
              <p className="text-xs font-bold text-muted-foreground">
                Comece rapidamente populando refeições e alimentos exemplo no seu plano.
              </p>
            </div>
          </div>
          <Button
            onClick={() => loadModelDietPlans()}
            className="rounded-2xl font-extrabold text-xs py-4 px-4 bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white border-b-4 border-[#1890D0] active:translate-y-1 active:border-b-0 shrink-0"
          >
            <Sparkles className="w-4 h-4 mr-1.5" /> Começar com modelo
          </Button>
        </div>
      )}

      <button
        onClick={handleOpenModal}
        className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-lg border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
      >
        <Plus className="w-6 h-6" strokeWidth={3} /> Adicionar Refeição
      </button>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold">Painel Metabólico Diário</h3>
            <button
              onClick={handleOpenGoalsModal}
              className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Ajustar metas de macronutrientes"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs font-bold text-muted-foreground">VENTA: {ventaGoal} kcal</span>
        </div>

        {/* Side-by-side distribution pizzas: Distribuição do Plano vs Consumido Hoje */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-2xl bg-muted/20 border border-muted/50">
          {/* Pizza 1: Distribuição do Plano */}
          <div className="flex items-center gap-3">
            <MacroPieChart
              carbsG={planCalories.carbs}
              proteinG={planCalories.protein}
              fatG={planCalories.fat}
              size={90}
            />
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-muted-foreground uppercase text-[11px] tracking-wider">
                Distribuição do Plano
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFC800]" />
                <span className="font-bold">Carbo: {planPct.carbs}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B]" />
                <span className="font-bold">Prot: {planPct.protein}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1CB0F6]" />
                <span className="font-bold">Gord: {planPct.fat}%</span>
              </div>
            </div>
          </div>

          {/* Pizza 2: Consumido Hoje */}
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-muted/50 pt-3 md:pt-0 md:pl-4">
            <MacroPieChart
              carbsG={consumedCalories.carbs}
              proteinG={consumedCalories.protein}
              fatG={consumedCalories.fat}
              size={90}
            />
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-muted-foreground uppercase text-[11px] tracking-wider">
                Consumido Hoje
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFC800]" />
                <span className="font-bold">Carbo: {consumedPct.carbs}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B]" />
                <span className="font-bold">Prot: {consumedPct.protein}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1CB0F6]" />
                <span className="font-bold">Gord: {consumedPct.fat}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calorie Bar */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-extrabold">Calorias Consumidas</span>
            <span className="text-sm font-bold text-muted-foreground">
              {Math.round(totals.calories)} / {ventaGoal} kcal
            </span>
          </div>
          <div className="w-full h-5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF4B4B] to-[#FF8A4B] transition-all duration-500"
              style={{ width: `${caloriePct}%` }}
            />
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            {caloriePct >= 100
              ? '🔥 Meta diária de calorias atingida!'
              : `${Math.round(ventaGoal - totals.calories)} kcal restantes`}
          </p>
        </div>

        {/* Macro Progress Bars */}
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
                <div className="w-full h-3.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Micro-nutrients row if any tracked today */}
        {(totals.fibersG > 0 || totals.sodiumMg > 0) && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-muted/50 text-xs">
            <div className="bg-muted/30 p-2.5 rounded-xl text-center">
              <span className="font-bold text-muted-foreground block">🌾 Fibras hoje</span>
              <span className="font-extrabold text-sm text-[#58CC02]">
                {Math.round(totals.fibersG)}g
              </span>
            </div>
            <div className="bg-muted/30 p-2.5 rounded-xl text-center">
              <span className="font-bold text-muted-foreground block">🧂 Sódio hoje</span>
              <span className="font-extrabold text-sm">{Math.round(totals.sodiumMg)}mg</span>
            </div>
          </div>
        )}
      </div>

      <MicroGoalsChecklist />
      <NewMealModal open={modalOpen} onOpenChange={handleCloseModal} />

      {/* Modal to configure custom macro goals */}
      <Dialog open={goalsModalOpen} onOpenChange={setGoalsModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Metas de Macros</DialogTitle>
            <DialogDescription>
              Configure seus parâmetros nutricionais personalizados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">🥩 Proteína por kg de peso (g/kg)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.8"
                max="4.0"
                value={draftProteinPerKg}
                onChange={(e) => setDraftProteinPerKg(e.target.value)}
                placeholder="2.0"
                className="rounded-xl font-extrabold text-base"
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Padrão hipertrofia/manutenção: 2.0g/kg
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">
                🥑 Gorduras (% do gasto energético total)
              </Label>
              <Input
                type="number"
                step="1"
                min="10"
                max="50"
                value={draftFatPct}
                onChange={(e) => setDraftFatPct(e.target.value)}
                placeholder="25"
                className="rounded-xl font-extrabold text-base"
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Padrão saudável: 25% a 30% do total calórico
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-muted text-xs space-y-1">
              <span className="font-extrabold block">🍞 Carboidratos:</span>
              <span className="text-muted-foreground">
                Calculados automaticamente pelo balanço calórico restante ({ventaGoal} kcal - prot -
                gord).
              </span>
            </div>

            <Button
              onClick={handleSaveGoals}
              className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150"
            >
              Salvar Metas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
