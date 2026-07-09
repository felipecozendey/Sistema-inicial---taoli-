import { Habit, useAppStore } from '@/stores/useAppStore'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { isHabitScheduledOn } from '@/lib/habit-utils'

export function HabitHeatmap({ habits }: { habits: Habit[] }) {
  const heatmap = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 91 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (90 - i))
      const dateStr = d.toISOString().split('T')[0]
      const scheduled = habits.filter((h) => isHabitScheduledOn(h, d))
      const completed = scheduled.filter((h) => h.completions.includes(dateStr))
      let level = 0
      if (scheduled.length > 0) {
        const ratio = completed.length / scheduled.length
        if (ratio > 0.66) level = 3
        else if (ratio > 0.33) level = 2
        else if (ratio > 0) level = 1
      }
      return { date: dateStr, level, completed: completed.length, total: scheduled.length }
    })
  }, [habits])

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">Consistência de Hábitos</h3>
        <span className="text-xs text-muted-foreground">Últimos 90 dias</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {heatmap.map((day, i) => (
          <div
            key={i}
            title={`${day.date}: ${day.completed}/${day.total} hábitos`}
            className={cn(
              'w-4 h-4 md:w-5 md:h-5 rounded-[4px] transition-all duration-300 hover:scale-125 cursor-default',
              day.level === 0 && 'bg-muted',
              day.level === 1 && 'bg-[#58CC02]/40',
              day.level === 2 && 'bg-[#58CC02]/70',
              day.level === 3 && 'bg-[#58CC02]',
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-xs text-muted-foreground">Menos</span>
        <div className="w-4 h-4 rounded-[4px] bg-muted" />
        <div className="w-4 h-4 rounded-[4px] bg-[#58CC02]/40" />
        <div className="w-4 h-4 rounded-[4px] bg-[#58CC02]/70" />
        <div className="w-4 h-4 rounded-[4px] bg-[#58CC02]" />
        <span className="text-xs text-muted-foreground">Mais</span>
      </div>
    </div>
  )
}
