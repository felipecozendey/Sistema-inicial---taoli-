import { useState, useMemo, useEffect } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useNutritionStore, type DietPlanItem } from '@/stores/use-nutrition-store'
import { useAppStore } from '@/stores/useAppStore'
import { FoodEntryModal } from '@/components/health/food-entry-modal'
import { NewMealPlanModal } from '@/components/health/new-meal-plan-modal'
import { DietItemEditModal } from '@/components/health/diet-item-edit-modal'
import { Plus, Trash2, Clock, Pencil } from 'lucide-react'

export function MealPlanTab() {
  const { dietPlans, fetchDietPlans, deleteDietPlanItem, deleteDietPlan } = useNutritionStore()
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const [foodModalPlanId, setFoodModalPlanId] = useState<string | null>(null)
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<{ planId: string; item: DietPlanItem } | null>(null)

  useEffect(() => {
    fetchDietPlans()
  }, [fetchDietPlans])

  const sortedMetrics = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sortedMetrics[sortedMetrics.length - 1]
  const tmb = latest?.tmb || 2000
  const get = latest?.get || 2500

  const totals = useMemo(
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

  const bars = [
    { label: 'Calorias', value: totals.calories, target: get, color: '#FF4B4B', unit: 'kcal' },
    { label: 'Carboidratos', value: totals.carbsG, target: 250, color: '#FFC800', unit: 'g' },
    { label: 'Proteínas', value: totals.proteinG, target: 150, color: '#FF4B4B', unit: 'g' },
    { label: 'Gorduras', value: totals.fatG, target: 65, color: '#1CB0F6', unit: 'g' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">Resumo do Plano</h3>
          <span className="text-xs font-bold text-muted-foreground">
            TMB: {tmb} · GET: {get}
          </span>
        </div>
        <div className="space-y-3">
          {bars.map((b) => {
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
      </div>

      <button
        onClick={() => setMealModalOpen(true)}
        className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white font-extrabold text-lg border-b-4 border-[#1890D0] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
        Nova Refeição
      </button>

      {dietPlans.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
          <p className="text-sm font-bold text-muted-foreground">
            Nenhuma refeição cadastrada. Crie sua primeira refeição!
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {dietPlans.map((plan) => {
            const cals = plan.items.reduce((s, i) => s + i.calories, 0)
            return (
              <AccordionItem
                key={plan.id}
                value={plan.id}
                className="border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl px-5 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-extrabold text-base">{plan.name}</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-bold text-muted-foreground">
                        {plan.time || 'Sem horário'}
                      </span>
                      <span className="text-xs font-extrabold text-[#FF4B4B]">
                        {Math.round(cals)} kcal
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {plan.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-muted/30 rounded-2xl p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold truncate">{item.description}</p>
                        <p className="text-xs font-bold text-muted-foreground">{item.quantity}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFC800]/15 text-[#FFC800]">
                          {item.carbsG}g
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FF4B4B]/15 text-[#FF4B4B]">
                          {item.proteinG}g
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1CB0F6]/15 text-[#1CB0F6]">
                          {item.fatG}g
                        </span>
                      </div>
                      <button
                        onClick={() => setEditItem({ planId: plan.id, item })}
                        className="p-1.5 rounded-lg hover:bg-[#1CB0F6]/10 transition-colors shrink-0"
                      >
                        <Pencil className="w-4 h-4 text-[#1CB0F6]" />
                      </button>
                      <button
                        onClick={() => deleteDietPlanItem(plan.id, item.id)}
                        className="p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-[#FF4B4B]" />
                      </button>
                    </div>
                  ))}
                  {plan.items.length === 0 && (
                    <p className="text-center text-xs font-bold text-muted-foreground py-4">
                      Nenhum alimento adicionado
                    </p>
                  )}
                  <button
                    onClick={() => setFoodModalPlanId(plan.id)}
                    className="w-full py-3 rounded-2xl bg-[#58CC02]/10 hover:bg-[#58CC02]/20 text-[#58CC02] font-extrabold border-2 border-b-4 border-[#58CC02]/30 active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    Adicionar Alimento
                  </button>
                  <button
                    onClick={() => deleteDietPlan(plan.id)}
                    className="w-full py-2 rounded-xl text-[#FF4B4B] font-bold text-xs hover:bg-[#FF4B4B]/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir Refeição
                  </button>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      <FoodEntryModal
        open={!!foodModalPlanId}
        onOpenChange={(o) => {
          if (!o) setFoodModalPlanId(null)
        }}
        planId={foodModalPlanId || ''}
      />
      <NewMealPlanModal open={mealModalOpen} onOpenChange={setMealModalOpen} />
      <DietItemEditModal
        open={!!editItem}
        onOpenChange={(o) => {
          if (!o) setEditItem(null)
        }}
        planId={editItem?.planId || ''}
        item={editItem?.item || null}
      />
    </div>
  )
}
