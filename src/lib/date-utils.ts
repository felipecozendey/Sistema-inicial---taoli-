export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6)
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endCopy = new Date(end)
  endCopy.setHours(0, 0, 0, 0)
  while (current <= endCopy) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function safeFormatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return 'Data Inválida'
  const safeDate = dateInput instanceof Date ? dateInput : new Date(dateInput)
  return isNaN(safeDate.getTime())
    ? 'Data Inválida'
    : `${String(safeDate.getDate()).padStart(2, '0')}/${String(safeDate.getMonth() + 1).padStart(2, '0')}/${safeDate.getFullYear()}`
}

export function safeFormatDateLong(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return 'Data Inválida'
  const safeDate =
    dateInput instanceof Date
      ? dateInput
      : new Date(dateInput.includes('T') ? dateInput : dateInput + 'T00:00:00')
  return isNaN(safeDate.getTime())
    ? 'Data Inválida'
    : safeDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatDateShort(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
