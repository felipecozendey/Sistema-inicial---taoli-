import { useState } from 'react'
import { useAppStore, MealType } from '@/stores/useAppStore'
import { MicroGoalsChecklist } from '@/components/health/micro-goals-checklist'
import { NewMealModal } from '@/components/health/new-meal-modal'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const MEALS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Café', emoji: '☀️' },
  { type: 'lunch', label: 'Almoço', emoji: '🍽️' },
  { type: 'snack', label: 'Lanche', emoji: '🥪' },
  { type: 'dinner', label: 'Jantar', emoji: '🌙' },
]

export function NutritionOverview() {
  const { mealLogs } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = mealLogs.filter(
    (l) => l.date === today && l.mealType !== ('checklist' as MealType),
  )

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold mb-4">Diário de Hoje</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {MEALS.map((meal) => {
            const logged = todayMeals.find((l) => l.mealType === meal.type)
            return (
              <div
                key={meal.type}
                className={cn(
                  'flex flex-col items-center gap-1 py-4 rounded-2xl border-2 border-b-4',
                  logged
                    ? 'bg-muted/30 border-transparent'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                )}
              >
                <span className="text-2xl">{meal.emoji}</span>
                <span className="text-sm font-extrabold">{meal.label}</span>
                {logged ? (
                  <span className="text-xs font-bold text-[#58CC02]">✓ Registrado</span>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">—</span>
                )}
              </div>
            )
          })}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-4 rounded-2xl bg-[#1CB0F6] text-white font-extrabold border-b-4 border-[#0E8AC0] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          Adicionar Refeição
        </button>
      </div>
      <MicroGoalsChecklist />
      <NewMealModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
