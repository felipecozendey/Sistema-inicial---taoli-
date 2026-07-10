import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { MicroGoalsManagementModal } from '@/components/health/micro-goals-management-modal'
import { cn } from '@/lib/utils'
import { Check, Settings } from 'lucide-react'

const GOAL_COLORS = ['#FF4B4B', '#CE82FF', '#58CC02', '#1CB0F6', '#FF9600', '#FFC800']

export function MicroGoalsChecklist() {
  const {
    nutritionMicroGoals,
    dailyChecklist,
    toggleChecklistItem,
    fetchNutritionMicroGoals,
    fetchDailyChecklist,
  } = useAppStore()
  const [manageOpen, setManageOpen] = useState(false)

  useEffect(() => {
    fetchNutritionMicroGoals()
    fetchDailyChecklist()
  }, [fetchNutritionMicroGoals, fetchDailyChecklist])

  const activeGoals = nutritionMicroGoals.filter((g) => g.isActive)
  const completedCount = activeGoals.filter((g) => dailyChecklist[g.id]).length
  const percent =
    activeGoals.length > 0 ? Math.round((completedCount / activeGoals.length) * 100) : 0

  return (
    <>
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold">Micro-metas</h3>
            <p className="text-xs font-bold text-muted-foreground">
              {completedCount}/{activeGoals.length} concluídas hoje
            </p>
          </div>
          <button
            onClick={() => setManageOpen(true)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
          </button>
        </div>

        <div className="w-full h-3 rounded-full bg-muted/50 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#58CC02] to-[#1CB0F6] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeGoals.map((goal, idx) => {
            const isChecked = !!dailyChecklist[goal.id]
            const color = GOAL_COLORS[idx % GOAL_COLORS.length]
            return (
              <button
                key={goal.id}
                onClick={() => toggleChecklistItem(goal.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                  isChecked
                    ? 'bg-muted/30 border-transparent'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
                )}
                style={isChecked ? { borderBottomColor: color } : undefined}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-200',
                    isChecked ? 'border-transparent' : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                  style={isChecked ? { backgroundColor: color } : undefined}
                >
                  {isChecked ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  ) : (
                    <span className="text-lg">{goal.emoji || '✅'}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm font-extrabold text-left',
                    isChecked && 'line-through opacity-60',
                  )}
                >
                  {goal.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <MicroGoalsManagementModal open={manageOpen} onOpenChange={setManageOpen} />
    </>
  )
}
