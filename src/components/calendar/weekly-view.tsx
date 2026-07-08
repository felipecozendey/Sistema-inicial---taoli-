import { useState } from 'react'
import { Task, Habit, useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isHabitScheduledOn } from '@/lib/habit-utils'
import {
  startOfWeek,
  addDays,
  addWeeks,
  eachDayOfInterval,
  isToday,
  toDateString,
  formatDateShort,
  WEEKDAY_SHORT,
} from '@/lib/date-utils'

export function WeeklyView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const { tags } = useAppStore()
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()))
  const days = eachDayOfInterval(weekStart, addDays(weekStart, 6))

  return (
    <div className="bg-card rounded-[2rem] p-4 md:p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">
          {formatDateShort(weekStart)} - {formatDateShort(addDays(weekStart, 6))}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1 text-sm hover:bg-muted rounded-lg transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = toDateString(day)
          const dayTasks = tasks.filter((t) => t.dueDate === dateStr)
          const dayHabits = habits.filter((h) => isHabitScheduledOn(h, day))
          const today = isToday(day)

          return (
            <div
              key={dateStr}
              className={cn(
                'rounded-xl p-3 border min-h-[120px] transition-all hover:shadow-sm',
                today ? 'border-primary bg-primary/5' : 'border-border/50',
              )}
            >
              <div
                className={cn(
                  'text-sm font-bold mb-2 flex items-center gap-1',
                  today && 'text-primary',
                )}
              >
                <span>{WEEKDAY_SHORT[day.getDay()]}</span>
                <span className="text-muted-foreground font-normal">{day.getDate()}</span>
              </div>
              <div className="space-y-1">
                {dayTasks.map((t) => {
                  const tag = tags.find((tg) => tg.id === t.tagId)
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'text-xs truncate px-1.5 py-1 rounded',
                        t.completed && 'line-through opacity-50',
                      )}
                      style={{
                        backgroundColor: (tag?.color || '#888') + '20',
                        color: tag?.color || '#888',
                      }}
                    >
                      {t.title}
                    </div>
                  )
                })}
                {dayHabits.map((h) => {
                  const tag = tags.find((tg) => tg.id === h.tagId)
                  const completed = h.completions.includes(dateStr)
                  return (
                    <div key={h.id} className="flex items-center gap-1 text-xs py-0.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0 transition-all"
                        style={{
                          backgroundColor: tag?.color || '#888',
                          opacity: completed ? 1 : 0.3,
                        }}
                      />
                      <span className={cn('truncate', completed && 'line-through opacity-50')}>
                        {h.title}
                      </span>
                    </div>
                  )
                })}
                {dayTasks.length === 0 && dayHabits.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">Livre</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
