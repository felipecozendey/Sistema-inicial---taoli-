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

interface ProjectableTransaction {
  id: string
  type: string
  date: string
  isRecurring: boolean
  recurrencePeriod: string | null
}

export function projectRecurringTransactions<T extends ProjectableTransaction>(
  transactions: T[],
  startDate: string,
  endDate: string,
): (T & { isVirtual?: boolean })[] {
  const result: (T & { isVirtual?: boolean })[] = [...transactions]
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  transactions
    .filter((t) => t.isRecurring && t.recurrencePeriod && t.recurrencePeriod !== 'none')
    .forEach((t) => {
      const baseDate = new Date(t.date + 'T00:00:00')
      let current = new Date(baseDate)

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        if (current >= start && dateStr !== t.date) {
          result.push({ ...t, id: `${t.id}-virtual-${dateStr}`, date: dateStr, isVirtual: true })
        }

        if (t.recurrencePeriod === 'weekly') {
          current.setDate(current.getDate() + 7)
        } else if (t.recurrencePeriod === 'monthly') {
          current.setMonth(current.getMonth() + 1)
        } else if (t.recurrencePeriod === 'yearly') {
          current.setFullYear(current.getFullYear() + 1)
        } else {
          break
        }
      }
    })

  return result
}

export function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

export function getMonthKey(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Adiciona meses mantendo o mesmo dia do mês, com ajuste de fim de mês se necessário
 * (ex: dia 31 em janeiro -> dia 28/29 em fevereiro, etc.)
 */
export function addMonthsClamped(dateStr: string, monthsToAdd: number): string {
  const base = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(base.getTime())) {
    return dateStr
  }
  const originalDay = base.getDate()
  // Move para o dia 1 do mês de destino para evitar overflow de dias
  const target = new Date(base.getFullYear(), base.getMonth() + monthsToAdd, 1)
  // Último dia do mês de destino
  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const clampedDay = Math.min(originalDay, lastDayOfTargetMonth)
  target.setDate(clampedDay)
  return target.toISOString().split('T')[0]
}

export function formatSafeDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}
