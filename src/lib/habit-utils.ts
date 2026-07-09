import { Habit } from '@/stores/useAppStore'

export function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  if (habit.frequency === 'daily') return true
  return habit.weekDays.includes(date.getDay())
}

export function calculateStreak(completions: string[], frozenDates: string[] = []): number {
  const allDates = new Set([...completions, ...frozenDates])
  if (allDates.size === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let startStr: string
  if (allDates.has(today)) startStr = today
  else if (allDates.has(yesterday)) startStr = yesterday
  else return 0

  let streak = 0
  const current = new Date(startStr + 'T00:00:00')
  while (true) {
    const ds = current.toISOString().split('T')[0]
    if (allDates.has(ds)) {
      streak++
      current.setDate(current.getDate() - 1)
    } else break
  }
  return streak
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

export function getTodayHabits(habits: Habit[]): Habit[] {
  const today = new Date()
  return habits.filter((h) => isHabitScheduledOn(h, today))
}

export function getHabitEvolution(streak: number): {
  emoji: string
  tier: string
  color: string
} {
  if (streak >= 21) return { emoji: '🌳', tier: 'Árvore', color: '#228B22' }
  if (streak >= 7) return { emoji: '🌿', tier: 'Broto', color: '#90EE90' }
  return { emoji: '🌱', tier: 'Semente', color: '#8B4513' }
}

export function getHabitWeeklyProgress(habit: Habit): {
  current: number
  goal: number
  percent: number
} {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const current = habit.completions.filter((d) => new Date(d) >= weekStart).length

  let goal: number
  if (habit.frequency === 'daily') {
    goal = 7
  } else if (habit.weeklyGoal && habit.weeklyGoal > 0) {
    goal = habit.weeklyGoal
  } else {
    goal = Math.max(1, habit.weekDays.length)
  }

  return { current, goal, percent: Math.min(100, Math.round((current / goal) * 100)) }
}
