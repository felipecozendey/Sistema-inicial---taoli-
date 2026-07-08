import { Habit } from '@/stores/useAppStore'

export function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  if (habit.frequency === 'daily') return true
  return habit.weekDays.includes(date.getDay())
}

export function calculateStreak(completions: string[]): number {
  if (completions.length === 0) return 0
  const sorted = new Set(completions)
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let startStr: string
  if (sorted.has(today)) startStr = today
  else if (sorted.has(yesterday)) startStr = yesterday
  else return 0

  let streak = 0
  const current = new Date(startStr + 'T00:00:00')
  while (true) {
    const ds = current.toISOString().split('T')[0]
    if (sorted.has(ds)) {
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
