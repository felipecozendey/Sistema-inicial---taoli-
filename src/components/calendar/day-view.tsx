import { useState } from 'react'
import { Task, Habit, useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { isHabitScheduledOn } from '@/lib/habit-utils'
import { toDateString, isToday, WEEKDAY_SHORT, MONTH_NAMES } from '@/lib/date-utils'

export function DayView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const { tags, toggleHabitCompletion, toggleTask } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const dateStr = toDateString(currentDate)
  const dayTasks = tasks.filter((t) => t.dueDate === dateStr)
  const dayHabits = habits.filter((h) => isHabitScheduledOn(h, currentDate))

  const navigate = (delta: number) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + delta)
    setCurrentDate(d)
  }

  return (
    <div className="bg-card rounded-[2rem] p-4 md:p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">
          {WEEKDAY_SHORT[currentDate.getDay()]}, {currentDate.getDate()} de{' '}
          {MONTH_NAMES[currentDate.getMonth()]}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => navigate(-1)}
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
            onClick={() => navigate(1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {dayTasks.length === 0 && dayHabits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-semibold">
            Nenhuma atividade para este dia.
          </div>
        ) : (
          <>
            {dayTasks.map((t) => {
              const tag = tags.find((tg) => tg.id === t.tagId)
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border"
                  style={{ borderColor: (tag?.color || '#888') + '40' }}
                >
                  <button
                    onClick={() => toggleTask(t.id)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      t.completed
                        ? 'bg-[#58CC02] border-[#58CC02] text-white'
                        : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                    )}
                  >
                    {t.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                  </button>
                  <span
                    className={cn(
                      'text-sm font-semibold flex-1',
                      t.completed && 'line-through opacity-50',
                    )}
                    style={{ color: tag?.color }}
                  >
                    {t.title}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    Tarefa
                  </span>
                </div>
              )
            })}
            {dayHabits.map((h) => {
              const tag = tags.find((tg) => tg.id === h.tagId)
              const completed = h.completions.includes(dateStr)
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border"
                  style={{ borderColor: (tag?.color || '#888') + '40' }}
                >
                  <button
                    onClick={() => toggleHabitCompletion(h.id, dateStr)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      completed
                        ? 'bg-[#FFC800] border-[#FFC800] text-[#374151]'
                        : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                    )}
                  >
                    {completed && <Check className="w-3 h-3" strokeWidth={3} />}
                  </button>
                  <span
                    className={cn(
                      'text-sm font-semibold flex-1',
                      completed && 'line-through opacity-50',
                    )}
                    style={{ color: tag?.color }}
                  >
                    {h.title}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    Hábito
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
