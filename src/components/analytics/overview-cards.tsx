import { Task, Habit } from '@/stores/useAppStore'
import { calculateStreak } from '@/lib/habit-utils'
import { useMemo } from 'react'

type CardConfig = {
  emoji: string
  label: string
  value: string | number
  bgClass: string
  borderClass: string
  textClass: string
}

export function OverviewCards({ tasks, habits }: { tasks: Task[]; habits: Habit[] }) {
  const stats = useMemo(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const cutoff = sevenDaysAgo.toISOString().split('T')[0]

    let coins = 0
    tasks.forEach((t) => {
      if (t.completed && t.dueDate >= cutoff) coins += 10
    })
    habits.forEach((h) => {
      h.completions.forEach((d) => {
        if (d >= cutoff) coins += 5
      })
    })

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completed).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const bestStreak = habits.reduce((max, h) => {
      const streak = calculateStreak(h.completions, h.frozenDates)
      return Math.max(max, streak)
    }, 0)

    return { coins, completionRate, bestStreak }
  }, [tasks, habits])

  const cards: CardConfig[] = [
    {
      emoji: '🪙',
      label: 'Moedas na Semana',
      value: stats.coins,
      bgClass: 'bg-yellow-400',
      borderClass: 'border-yellow-600',
      textClass: 'text-yellow-950',
    },
    {
      emoji: '🎯',
      label: 'Taxa de Conclusão',
      value: `${stats.completionRate}%`,
      bgClass: 'bg-blue-400',
      borderClass: 'border-blue-600',
      textClass: 'text-blue-950',
    },
    {
      emoji: '🔥',
      label: 'Melhor Ofensiva',
      value: `${stats.bestStreak} dias`,
      bgClass: 'bg-orange-400',
      borderClass: 'border-orange-600',
      textClass: 'text-orange-950',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bgClass} ${card.borderClass} ${card.textClass} rounded-3xl border-b-4 p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] active:translate-y-[2px] active:border-b-2`}
        >
          <span className="text-3xl">{card.emoji}</span>
          <div className="mt-3">
            <div className="text-3xl font-extrabold">{card.value}</div>
            <div className="text-sm font-semibold opacity-80 mt-1">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
