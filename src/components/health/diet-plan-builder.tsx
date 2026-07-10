import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Plus, Trash2, Clock, Utensils } from 'lucide-react'
import type { DietPlanMeal } from '@/types/diet-plan'

export function DietPlanBuilder() {
  const { dietPlans, addDietPlan, deleteDietPlan, addDietPlanItem, deleteDietPlanItem } =
    useAppStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [newMealTitle, setNewMealTitle] = useState('')
  const [newMealTime, setNewMealTime] = useState('')
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({})

  const handleAddMeal = () => {
    if (!newMealTitle.trim()) return
    addDietPlan({ name: newMealTitle.trim(), time: newMealTime.trim() })
    setNewMealTitle('')
    setNewMealTime('')
    setDialogOpen(false)
  }

  const handleAddItem = (mealId: string) => {
    const desc = itemInputs[mealId]?.trim()
    if (!desc) return
    addDietPlanItem(mealId, { description: desc, quantity: '' })
    setItemInputs((prev) => ({ ...prev, [mealId]: '' }))
  }

  const handleItemKeyDown = (e: React.KeyboardEvent, mealId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem(mealId)
    }
  }

  const plans: DietPlanMeal[] = (dietPlans ?? []).map((p: any) => ({
    id: p.id,
    title: p.name,
    time: p.time ?? '',
    items: (p.items ?? []).map((it: any) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
    })),
  }))

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full py-4 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-base border-b-4 border-[#46B302] active:translate-y-1 active:border-b-0 transition-all duration-150">
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            Adicionar Refeição ao Plano
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Nova Refeição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Nome da Refeição</Label>
              <Input
                value={newMealTitle}
                onChange={(e) => setNewMealTitle(e.target.value)}
                placeholder="Ex: Almoço"
                className="rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">Horário</Label>
              <Input
                value={newMealTime}
                onChange={(e) => setNewMealTime(e.target.value)}
                placeholder="Ex: 12:00"
                className="rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-2xl font-bold">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddMeal}
              className="rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46B302] active:translate-y-1 active:border-b-0 transition-all duration-150"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {plans.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
          <Utensils className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-bold text-muted-foreground">
            Nenhum plano alimentar ainda. Crie seu primeiro acima!
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {plans.map((meal) => {
            const inputValue = itemInputs[meal.id] ?? ''
            return (
              <AccordionItem
                key={meal.id}
                value={meal.id}
                className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl px-4 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#1CB0F6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold">
                        {meal.title}
                        {meal.time ? ` às ${meal.time}` : ''}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
                      {meal.items.length} itens
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-3 p-4">
                    {meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-3 rounded-2xl bg-muted/30"
                      >
                        <p className="text-sm font-bold flex-1 truncate">{item.description}</p>
                        <button
                          onClick={() => deleteDietPlanItem?.(meal.id, item.id)}
                          className="p-2 rounded-xl text-[#FF4B4B] hover:bg-[#FF4B4B]/10 transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2 items-center pt-1">
                      <Input
                        value={inputValue}
                        onChange={(e) =>
                          setItemInputs((prev) => ({ ...prev, [meal.id]: e.target.value }))
                        }
                        placeholder="Adicionar alimento..."
                        className="rounded-xl flex-1"
                        onKeyDown={(e) => handleItemKeyDown(e, meal.id)}
                      />
                      <button
                        onClick={() => handleAddItem(meal.id)}
                        className="w-10 h-10 rounded-full bg-[#58CC02] hover:bg-[#46B302] text-white flex items-center justify-center shrink-0 transition-colors duration-150"
                      >
                        <Plus className="w-5 h-5" strokeWidth={3} />
                      </button>
                    </div>

                    <button
                      onClick={() => deleteDietPlan?.(meal.id)}
                      className="text-xs font-bold text-[#FF4B4B] hover:underline flex items-center gap-1 pt-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir Refeição Inteira
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
