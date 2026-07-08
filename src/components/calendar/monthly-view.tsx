import { useState } from 'react'
import { Task, Habit, useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isHabitScheduledOn } from '@/lib/habit-utils'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  toDateString,
  MONTH_NAMES,
  WEEKDAY_SHORT,
} from '@/lib/date-utils'

export function MonthlyView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const { tags } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval(calendarStart, calendarEnd)

  return (
    <div className="bg-card rounded-[2rem] p-4 md:p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, -1))}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm hover:bg-muted rounded-lg transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = toDateString(day)
          const dayTasks = tasks.filter((t) => t.dueDate === dateStr)
          const dayHabits = habits.filter((h) => isHabitScheduledOn(h, day))
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[60px] md:min-h-[90px] p-1.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer',
                inMonth ? 'bg-background' : 'bg-muted/30 opacity-50',
                today && 'border-primary border-2',
              )}
            >
              <div className={cn('text-xs font-medium mb-1', today && 'text-primary font-bold')}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 2).map((t) => {
                  const tag = tags.find((tg) => tg.id === t.tagId)
                  return (
                    <div
                      key={t.id}
                      className="text-[10px] truncate px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: (tag?.color || '#888') + '20',
                        color: tag?.color || '#888',
                      }}
                    >
                      {t.title}
                    </div>
                  )
                })}
                {dayTasks.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 2}</div>
                )}
              </div>
              {dayHabits.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap">
                  {dayHabits.map((h) => {
                    const tag = tags.find((tg) => tg.id === h.tagId)
                    const completed = h.completions.includes(dateStr)
                    return (
                      <div
                        key={h.id}
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{
                          backgroundColor: tag?.color || '#888',
                          opacity: completed ? 1 : 0.3,
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
