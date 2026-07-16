export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function filterByDateRange<T extends { date: string }>(
  items: T[],
  startDate: string,
  endDate: string,
): T[] {
  if (!startDate || !endDate) return items
  return items.filter((t) => {
    const d = new Date(t.date + 'T00:00:00')
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    return d >= start && d <= end
  })
}

export function getMonthsAgoDate(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDateRangeLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
  const end = new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
  return `${start} - ${end}`
}
