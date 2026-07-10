import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const MICRO_GOALS = [
  { key: 'protein', label: 'Bati a Proteína', emoji: '🥩', color: '#FF4B4B' },
  { key: 'zero_sugar', label: 'Zero Açúcar', emoji: '🚫', color: '#CE82FF' },
  { key: 'veggies', label: 'Vegetais no Prato', emoji: '🥦', color: '#58CC02' },
  { key: 'water', label: '2L de Água', emoji: '💧', color: '#1CB0F6' },
  { key: 'no_ultra', label: 'Sem Ultraprocessados', emoji: '⛔', color: '#FF9600' },
  { key: 'fiber', label: 'Fibras no Prato', emoji: '🌾', color: '#FFC800' },
]

export function MicroGoalsChecklist() {
  const { dailyChecklist, toggleChecklistItem } = useAppStore()

  const completedCount = MICRO_GOALS.filter((g) => dailyChecklist[g.key]).length
  const percent = Math.round((completedCount / MICRO_GOALS.length) * 100)

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
          <span className="text-xl">🎯</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-extrabold">Micro-metas</h3>
          <p className="text-xs font-bold text-muted-foreground">
            {completedCount}/{MICRO_GOALS.length} concluídas hoje
          </p>
        </div>
      </div>

      <div className="w-full h-3 rounded-full bg-muted/50 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#58CC02] to-[#1CB0F6] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MICRO_GOALS.map((goal) => {
          const isChecked = !!dailyChecklist[goal.key]
          return (
            <button
              key={goal.key}
              onClick={() => toggleChecklistItem(goal.key)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                isChecked
                  ? 'bg-muted/30 border-transparent'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
              )}
              style={isChecked ? { borderBottomColor: goal.color } : undefined}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-200',
                  isChecked ? 'border-transparent' : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                )}
                style={isChecked ? { backgroundColor: goal.color } : undefined}
              >
                {isChecked ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : (
                  <span className="text-lg">{goal.emoji}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-extrabold text-left',
                  isChecked && 'line-through opacity-60',
                )}
              >
                {goal.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
