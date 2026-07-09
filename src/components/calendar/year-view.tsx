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

export function YearView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const { tags } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(year, i, 1)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval(calendarStart, calendarEnd)
    return { monthDate, days }
  })

  return (
    <div className="bg-card rounded-[2rem] p-4 md:p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{year}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(new Date(year - 1, 0, 1))}
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
            onClick={() => setCurrentDate(new Date(year + 1, 0, 1))}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {months.map(({ monthDate, days }) => {
          const monthTasks = tasks.filter((t) => {
            const taskDate = new Date(t.dueDate)
            return taskDate.getMonth() === monthDate.getMonth() && taskDate.getFullYear() === year
          })
          const monthTaskCount = monthTasks.length
          const completedCount = monthTasks.filter((t) => t.completed).length

          return (
            <div key={monthDate.getMonth()} className="rounded-2xl border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{MONTH_NAMES[monthDate.getMonth()]}</span>
                {monthTaskCount > 0 && (
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {completedCount}/{monthTaskCount}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {WEEKDAY_SHORT.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[8px] font-semibold text-muted-foreground"
                  >
                    {d.charAt(0)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day) => {
                  const dateStr = toDateString(day)
                  const dayTasks = tasks.filter((t) => t.dueDate === dateStr)
                  const dayHabits = habits.filter((h) => isHabitScheduledOn(h, day))
                  const inMonth = isSameMonth(day, monthDate)
                  const today = isToday(day)
                  const hasActivity = dayTasks.length > 0 || dayHabits.length > 0

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        'aspect-square rounded flex items-center justify-center text-[9px] transition-colors',
                        !inMonth && 'opacity-30',
                        today && 'bg-primary text-primary-foreground font-bold',
                        !today && hasActivity && 'bg-primary/15',
                        !today && !hasActivity && inMonth && 'hover:bg-muted',
                      )}
                    >
                      {day.getDate()}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
