import { Habit, useAppStore } from '@/stores/useAppStore'
import { Check, Flame, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateStreak } from '@/lib/habit-utils'

export function HabitCard({ habit }: { habit: Habit }) {
  const { tags, toggleHabitCompletion, deleteHabit } = useAppStore()
  const tag = tags.find((t) => t.id === habit.tagId)
  const today = new Date().toISOString().split('T')[0]
  const completedToday = habit.completions.includes(today)
  const streak = calculateStreak(habit.completions)

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 rounded-2xl bg-card border shadow-sm transition-all duration-200 animate-slide-up',
        completedToday ? 'opacity-70' : 'hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <button
        onClick={() => toggleHabitCompletion(habit.id, today)}
        className={cn(
          'w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-all active:scale-90',
          completedToday
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground hover:border-primary text-transparent',
        )}
      >
        <Check className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-medium text-base truncate',
            completedToday && 'line-through text-muted-foreground',
          )}
        >
          {habit.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {tag && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          )}
          {streak > 0 && (
            <span className="flex items-center text-orange-500 font-medium text-xs bg-orange-500/10 px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3 mr-1" /> {streak}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {habit.frequency === 'daily' ? 'Diário' : `${habit.weekDays.length}x semana`}
          </span>
        </div>
      </div>
      <button
        onClick={() => deleteHabit(habit.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
        aria-label="Delete habit"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
