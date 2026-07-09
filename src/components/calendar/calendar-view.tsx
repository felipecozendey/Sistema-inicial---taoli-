import { useState } from 'react'
import { Task, Habit } from '@/stores/useAppStore'
import { MonthlyView } from '@/components/calendar/monthly-view'
import { WeeklyView } from '@/components/calendar/weekly-view'
import { DayView } from '@/components/calendar/day-view'
import { YearView } from '@/components/calendar/year-view'
import { CustomView } from '@/components/calendar/custom-view'
import { cn } from '@/lib/utils'

type ViewType = 'day' | 'week' | 'month' | 'year' | 'custom'

const VIEWS: { value: ViewType; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
  { value: 'custom', label: 'Personalizado' },
]

export function CalendarView({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const [view, setView] = useState<ViewType>('month')

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-transform active:scale-95',
              view === v.value
                ? 'bg-foreground text-background shadow-md'
                : 'bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === 'month' && <MonthlyView tasks={tasks} habits={habits} />}
      {view === 'week' && <WeeklyView tasks={tasks} habits={habits} />}
      {view === 'day' && <DayView tasks={tasks} habits={habits} />}
      {view === 'year' && <YearView tasks={tasks} habits={habits} />}
      {view === 'custom' && <CustomView tasks={tasks} habits={habits} />}
    </div>
  )
}
