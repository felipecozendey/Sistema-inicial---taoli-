import { useState, useMemo } from 'react'
import { Task, Habit, useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Check, Calendar, Repeat, Flame } from 'lucide-react'
import { isHabitScheduledOn } from '@/lib/habit-utils'
import { calculateStreak } from '@/lib/habit-utils'
import { toDateString, isToday, WEEKDAY_SHORT, MONTH_NAMES } from '@/lib/date-utils'

type CustomFilterType = 'all' | 'tasks' | 'habits' | 'streaks'

const FILTERS: { value: CustomFilterType; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'tasks', label: 'Tarefas' },
  { value: 'habits', label: 'Hábitos' },
  { value: 'streaks', label: 'Sequências' },
]

export function CustomView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const { tags, toggleHabitCompletion, toggleTask } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filter, setFilter] = useState<CustomFilterType>('all')

  const dateStr = toDateString(currentDate)

  const navigate = (delta: number) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + delta)
    setCurrentDate(d)
  }

  const dayTasks = useMemo(() => tasks.filter((t) => t.dueDate === dateStr), [tasks, dateStr])
  const dayHabits = useMemo(
    () => habits.filter((h) => isHabitScheduledOn(h, currentDate)),
    [habits, currentDate],
  )

  const streakData = useMemo(
    () =>
      habits
        .map((h) => ({
          habit: h,
          streak: calculateStreak(h.completions, h.frozenDates),
        }))
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5),
    [habits],
  )

  const showTasks = filter === 'all' || filter === 'tasks'
  const showHabits = filter === 'all' || filter === 'habits'
  const showStreaks = filter === 'all' || filter === 'streaks'

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

      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
              filter === f.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {showStreaks && streakData.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h4 className="text-sm font-bold">Top Sequências</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {streakData.map(({ habit, streak }) => {
                const tag = tags.find((tg) => tg.id === habit.tagId)
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2 p-2 rounded-xl border"
                    style={{ borderColor: (tag?.color || '#888') + '40' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag?.color || '#888' }}
                    />
                    <span className="text-xs font-semibold truncate flex-1">{habit.title}</span>
                    <span className="text-xs font-bold text-orange-500">{streak}d</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showTasks && dayTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold">Tarefas ({dayTasks.length})</h4>
            </div>
            <div className="space-y-2">
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
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
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
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showHabits && dayHabits.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Repeat className="w-4 h-4 text-yellow-500" />
              <h4 className="text-sm font-bold">Hábitos ({dayHabits.length})</h4>
            </div>
            <div className="space-y-2">
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
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
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
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!showTasks && !showHabits && !showStreaks && streakData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-semibold">
            Nada para mostrar aqui.
          </div>
        )}

        {filter === 'all' &&
          dayTasks.length === 0 &&
          dayHabits.length === 0 &&
          streakData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-semibold">
              Nenhuma atividade para este dia.
            </div>
          )}
      </div>
    </div>
  )
}
