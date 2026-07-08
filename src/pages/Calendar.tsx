import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { MonthlyView } from '@/components/calendar/monthly-view'
import { WeeklyView } from '@/components/calendar/weekly-view'
import { cn } from '@/lib/utils'
import { CalendarDays, CalendarRange } from 'lucide-react'

export default function CalendarPage() {
  const { tasks, habits } = useAppStore()
  const [view, setView] = useState<'month' | 'week'>('month')

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Calendário</h2>
        <div className="flex items-center bg-card rounded-xl p-1.5 shadow-sm border w-fit">
          <button
            onClick={() => setView('month')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all',
              view === 'month'
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <CalendarRange className="w-4 h-4" /> Mês
          </button>
          <button
            onClick={() => setView('week')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all',
              view === 'week'
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <CalendarDays className="w-4 h-4" /> Semana
          </button>
        </div>
      </div>
      {view === 'month' ? (
        <MonthlyView tasks={tasks} habits={habits} />
      ) : (
        <WeeklyView tasks={tasks} habits={habits} />
      )}
    </div>
  )
}
