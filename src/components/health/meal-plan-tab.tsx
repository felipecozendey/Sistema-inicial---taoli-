import { useState, useMemo, useEffect } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useNutritionStore, type DietPlanItem, type DietPlan } from '@/stores/use-nutrition-store'
import { FoodEntryModal } from '@/components/health/food-entry-modal'
import { NewMealPlanModal } from '@/components/health/new-meal-plan-modal'
import { DietItemEditModal } from '@/components/health/diet-item-edit-modal'
import { MacroPieChart } from '@/components/health/macro-pie-chart'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Clock, Pencil, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'

export function MealPlanTab() {
  const {
    dietPlans,
    fetchDietPlans,
    fetchRecipes,
    deleteDietPlanItem,
    deleteDietPlan,
    updateDietPlan,
    reorderDietPlan,
    loadModelDietPlans,
  } = useNutritionStore()

  const [foodModalPlanId, setFoodModalPlanId] = useState<string | null>(null)
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<{ planId: string; item: DietPlanItem } | null>(null)
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null)
  const [editPlanName, setEditPlanName] = useState('')
  const [editPlanTime, setEditPlanTime] = useState('')

  useEffect(() => {
    fetchDietPlans()
    fetchRecipes()
  }, [fetchDietPlans, fetchRecipes])

  const sortedPlans = useMemo(() => {
    return [...dietPlans].sort((a, b) => a.orderIndex - b.orderIndex)
  }, [dietPlans])

  const planAnalytics = useMemo(() => {
    const map = new Map<
      string,
      { cals: number; macros: { carbsG: number; proteinG: number; fatG: number } }
    >()
    dietPlans.forEach((plan) => {
      const cals = plan.items.reduce((s, i) => s + i.calories, 0)
      const macros = plan.items.reduce(
        (a, i) => ({
          carbsG: a.carbsG + i.carbsG,
          proteinG: a.proteinG + i.proteinG,
          fatG: a.fatG + i.fatG,
        }),
        { carbsG: 0, proteinG: 0, fatG: 0 },
      )
      map.set(plan.id, { cals, macros })
    })
    return map
  }, [dietPlans])

  const handleStartEditPlan = (e: React.MouseEvent, plan: DietPlan) => {
    e.stopPropagation()
    setEditingPlan(plan)
    setEditPlanName(plan.name)
    setEditPlanTime(plan.time || '')
  }

  const handleSavePlanEdit = async () => {
    if (!editingPlan) return
    await updateDietPlan(editingPlan.id, {
      name: editPlanName.trim() || editingPlan.name,
      time: editPlanTime.trim(),
    })
    setEditingPlan(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setMealModalOpen(true)}
          className="flex-1 py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white font-extrabold text-base border-b-4 border-[#1890D0] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={3} /> Nova Refeição
        </button>
        {dietPlans.length === 0 && (
          <button
            onClick={() => loadModelDietPlans()}
            className="py-5 px-4 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-sm border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Carregar Modelo
          </button>
        )}
      </div>

      {sortedPlans.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center space-y-3">
          <span className="text-4xl block">🥗</span>
          <p className="text-sm font-bold text-muted-foreground">
            Nenhuma refeição cadastrada no seu plano alimentar.
          </p>
          <p className="text-xs text-muted-foreground">
            Você pode criar sua primeira refeição acima ou carregar o modelo de exemplo!
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {sortedPlans.map((plan, index) => {
            const analytics = planAnalytics.get(plan.id)
            const cals = analytics?.cals ?? 0
            const macros = analytics?.macros ?? { carbsG: 0, proteinG: 0, fatG: 0 }
            return (
              <AccordionItem
                key={plan.id}
                value={plan.id}
                className="border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl px-5 overflow-hidden bg-card"
              >
                <div className="flex items-center justify-between w-full">
                  <AccordionTrigger className="hover:no-underline flex-1 py-4">
                    <div className="flex items-center gap-3">
                      <MacroPieChart
                        carbsG={macros.carbsG}
                        proteinG={macros.proteinG}
                        fatG={macros.fatG}
                        size={48}
                      />
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
                    </div>
                  </AccordionTrigger>

                  {/* Header action controls: Reorder and Edit Name/Time */}
                  <div
                    className="flex items-center gap-1 pl-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => reorderDietPlan(plan.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderDietPlan(plan.id, 'down')}
                      disabled={index === sortedPlans.length - 1}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleStartEditPlan(e, plan)}
                      className="p-1.5 rounded-lg hover:bg-[#1CB0F6]/10 text-[#1CB0F6] transition-colors"
                      title="Editar nome e horário"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-4 bg-muted/30 rounded-2xl py-2">
                    <span className="text-xs font-extrabold">
                      <span className="text-[#FFC800]">●</span> Carb {Math.round(macros.carbsG)}g
                    </span>
                    <span className="text-xs font-extrabold">
                      <span className="text-[#FF4B4B]">●</span> Prot {Math.round(macros.proteinG)}g
                    </span>
                    <span className="text-xs font-extrabold">
                      <span className="text-[#1CB0F6]">●</span> Gord {Math.round(macros.fatG)}g
                    </span>
                  </div>
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
                    <Plus className="w-4 h-4" strokeWidth={3} /> Adicionar Alimento
                  </button>
                  <button
                    onClick={() => deleteDietPlan(plan.id)}
                    className="w-full py-2 rounded-xl text-[#FF4B4B] font-bold text-xs hover:bg-[#FF4B4B]/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir Refeição
                  </button>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Edit Meal Plan Name/Time Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(o) => !o && setEditingPlan(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Editar Refeição do Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Nome da Refeição</Label>
              <Input
                value={editPlanName}
                onChange={(e) => setEditPlanName(e.target.value)}
                placeholder="Ex: Café da Manhã"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Horário Habitual</Label>
              <Input
                type="time"
                value={editPlanTime}
                onChange={(e) => setEditPlanTime(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <Button
              onClick={handleSavePlanEdit}
              className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white font-extrabold border-b-4 border-[#1890D0] active:translate-y-1 active:border-b-0 transition-all duration-150"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
