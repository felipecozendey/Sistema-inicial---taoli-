import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

const TYPE_COLORS: Record<string, string> = {
  hydration: '#1CB0F6',
  mood: '#CE82FF',
  digestion: '#FF9600',
  urine: '#FFC800',
}

const TYPE_LABELS: Record<string, string> = {
  hydration: 'Hidratação',
  mood: 'Humor',
  digestion: 'Digestão',
  urine: 'Urina',
}

export function HealthCalendarView({ onSelectDate }: { onSelectDate?: (date: string) => void }) {
  const { hydrationLogs, moodLogs, digestionLogs, urineLogs } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  const logsByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    const addType = (date: string, type: string) => {
      if (!map[date]) map[date] = new Set()
      map[date].add(type)
    }
    hydrationLogs.forEach((l) => addType(l.date, 'hydration'))
    moodLogs.forEach((l) => addType(l.date, 'mood'))
    digestionLogs.forEach((l) => addType(l.date, 'digestion'))
    urineLogs.forEach((l) => addType(l.date, 'urine'))
    return map
  }, [hydrationLogs, moodLogs, digestionLogs, urineLogs])

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
          const types = logsByDate[dateStr]
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate?.(dateStr)}
              className={cn(
                'min-h-[60px] md:min-h-[80px] p-1.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm',
                inMonth ? 'bg-background' : 'bg-muted/30 opacity-50',
                today && 'border-primary border-2',
              )}
            >
              <div className={cn('text-xs font-medium mb-1', today && 'text-primary font-bold')}>
                {day.getDate()}
              </div>
              {types && (
                <div className="flex gap-0.5 flex-wrap">
                  {Array.from(types).map((t) => (
                    <div
                      key={t}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[t] }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 mt-4 flex-wrap">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-semibold text-muted-foreground">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
