import { Habit, useAppStore } from '@/stores/useAppStore'
import { Flame } from 'lucide-react'
import { calculateStreak } from '@/lib/habit-utils'

export function HabitStreaks({ habits }: { habits: Habit[] }) {
  const { tags } = useAppStore()
  const sorted = [...habits].sort(
    (a, b) => calculateStreak(b.completions) - calculateStreak(a.completions),
  )

  return (
    <div className="bg-card rounded-[2rem] p-6 shadow-sm border">
      <h3 className="font-bold mb-6 text-lg">Hábitos em Alta</h3>
      <div className="space-y-4">
        {sorted.slice(0, 5).map((h) => {
          const tag = tags.find((t) => t.id === h.tagId)
          const streak = calculateStreak(h.completions)
          return (
            <div
              key={h.id}
              className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: tag?.color || '#888' }}
                />
                <span className="text-sm font-medium truncate">{h.title}</span>
              </div>
              <div className="flex items-center text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-full text-xs shrink-0">
                <Flame className="w-3.5 h-3.5 mr-1" /> {streak} dias
              </div>
            </div>
          )
        })}
        {sorted.length === 0 && (
          <div className="text-sm text-muted-foreground p-4 text-center">
            Nenhum hábito ativo no momento.
          </div>
        )}
      </div>
    </div>
  )
}
