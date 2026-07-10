import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Plus, Trash2, Clock, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DietPlanBuilder() {
  const { dietPlans, addDietPlan, addDietPlanItem, removeDietPlanItem, removeDietPlan } =
    useAppStore()
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanTime, setNewPlanTime] = useState('')
  const [itemInputs, setItemInputs] = useState<Record<string, { desc: string; qty: string }>>({})

  const handleAddPlan = () => {
    if (!newPlanName.trim()) return
    addDietPlan({ name: newPlanName.trim(), time: newPlanTime.trim() })
    setNewPlanName('')
    setNewPlanTime('')
  }

  const handleAddItem = (planId: string) => {
    const input = itemInputs[planId]
    if (!input?.desc?.trim()) return
    addDietPlanItem(planId, { description: input.desc.trim(), quantity: input.qty.trim() })
    setItemInputs((prev) => ({ ...prev, [planId]: { desc: '', qty: '' } }))
  }

  const updateItemInput = (planId: string, field: 'desc' | 'qty', value: string) => {
    setItemInputs((prev) => ({
      ...prev,
      [planId]: { desc: '', qty: '', ...prev[planId], [field]: value },
    }))
  }

  const plans = dietPlans ?? []

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-[#1CB0F6]" />
          Criar Plano Alimentar
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Nome da refeição</Label>
              <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Ex: Café da manhã"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Horário</Label>
              <Input
                value={newPlanTime}
                onChange={(e) => setNewPlanTime(e.target.value)}
                placeholder="Ex: 07:00"
                className="rounded-xl"
              />
            </div>
          </div>
          <Button
            onClick={handleAddPlan}
            className="w-full py-3 rounded-2xl bg-[#1CB0F6] hover:bg-[#0E8AC0] text-white font-extrabold border-b-4 border-[#0E8AC0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-4 h-4 mr-1" strokeWidth={3} />
            Adicionar Refeição ao Plano
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
          <Utensils className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-bold text-muted-foreground">
            Nenhum plano alimentar ainda. Crie seu primeiro acima!
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {plans.map((plan: any) => {
            const input = itemInputs[plan.id] ?? { desc: '', qty: '' }
            return (
              <AccordionItem
                key={plan.id}
                value={plan.id}
                className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl px-5 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#1CB0F6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold truncate">{plan.name}</p>
                      {plan.time && (
                        <p className="text-xs text-muted-foreground font-bold">{plan.time}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
                      {plan.items?.length ?? 0} itens
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-3">
                    {(plan.items ?? []).map((item: any, idx: number) => (
                      <div
                        key={item.id ?? idx}
                        className="flex items-center gap-2 p-3 rounded-2xl bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{item.description}</p>
                          {item.quantity && (
                            <p className="text-xs text-muted-foreground font-bold">
                              {item.quantity}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeDietPlanItem?.(plan.id, item.id)}
                          className="p-2 rounded-xl text-[#FF4B4B] hover:bg-[#FF4B4B]/10 transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Input
                        value={input.desc}
                        onChange={(e) => updateItemInput(plan.id, 'desc', e.target.value)}
                        placeholder="Alimento"
                        className="rounded-xl flex-1"
                      />
                      <Input
                        value={input.qty}
                        onChange={(e) => updateItemInput(plan.id, 'qty', e.target.value)}
                        placeholder="Qtd"
                        className="rounded-xl w-24"
                      />
                      <Button
                        onClick={() => handleAddItem(plan.id)}
                        size="icon"
                        className="rounded-xl bg-[#58CC02] hover:bg-[#46B302] shrink-0"
                      >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                      </Button>
                    </div>

                    <button
                      onClick={() => removeDietPlan?.(plan.id)}
                      className="text-xs font-bold text-[#FF4B4B] hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover refeição
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}
