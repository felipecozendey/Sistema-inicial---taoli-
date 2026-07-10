import { useState, useMemo } from 'react'
import { useAppStore, MealType } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const QUALITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  on_plan: { bg: 'bg-[#58CC02]/10', text: 'text-[#58CC02]', label: 'No Plano' },
  adapted: { bg: 'bg-[#FFC800]/10', text: 'text-[#FFC800]', label: 'Adaptado' },
  free: { bg: 'bg-[#FF4B4B]/10', text: 'text-[#FF4B4B]', label: 'Livre' },
  great: { bg: 'bg-[#58CC02]/10', text: 'text-[#58CC02]', label: 'Ótima' },
  good: { bg: 'bg-[#1CB0F6]/10', text: 'text-[#1CB0F6]', label: 'Boa' },
  okay: { bg: 'bg-[#FFC800]/10', text: 'text-[#FFC800]', label: 'Razoável' },
  poor: { bg: 'bg-[#FF4B4B]/10', text: 'text-[#FF4B4B]', label: 'Ruim' },
}

const MEAL_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: 'Café da Manhã', emoji: '☀️' },
  lunch: { label: 'Almoço', emoji: '🍽️' },
  snack: { label: 'Lanche', emoji: '🥪' },
  dinner: { label: 'Jantar', emoji: '🌙' },
}

export function MealHistory() {
  const { mealLogs } = useAppStore()
  const [filter, setFilter] = useState<string>('all')

  const filteredLogs = useMemo(() => {
    const logs = (mealLogs ?? []).filter((l: any) => l.mealType !== ('checklist' as MealType))
    if (filter === 'all') return logs
    return logs.filter((l: any) => l.mealType === filter)
  }, [mealLogs, filter])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const log of filteredLogs) {
      const date = log.date ?? new Date(log.created_at).toISOString().split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(log)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredLogs])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dateStr === today) return 'Hoje'
    if (dateStr === yesterday) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }

  const filters = [
    { value: 'all', label: 'Todos' },
    { value: 'breakfast', label: 'Café' },
    { value: 'lunch', label: 'Almoço' },
    { value: 'snack', label: 'Lanche' },
    { value: 'dinner', label: 'Jantar' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap border-2 transition-all duration-150',
              filter === f.value
                ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groupedByDate.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
          <span className="text-4xl block mb-3">🍽️</span>
          <p className="text-sm font-bold text-muted-foreground">
            Nenhuma refeição registrada ainda.
          </p>
        </div>
      ) : (
        groupedByDate.map(([date, logs]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-extrabold text-muted-foreground px-1">
              {formatDate(date)}
            </h3>
            <div className="space-y-3">
              {logs.map((log: any) => {
                const mealInfo = MEAL_LABELS[log.mealType] ?? { label: log.mealType, emoji: '🍴' }
                const qStyle = QUALITY_STYLES[log.quality] ?? QUALITY_STYLES.okay
                return (
                  <div
                    key={log.id}
                    className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/10 flex items-center justify-center text-2xl shrink-0">
                        {mealInfo.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-extrabold">{mealInfo.label}</p>
                          <span
                            className={cn(
                              'text-xs font-bold px-2 py-1 rounded-lg',
                              qStyle.bg,
                              qStyle.text,
                            )}
                          >
                            {qStyle.label}
                          </span>
                        </div>
                        {log.items?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {log.items.map((item: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-xs font-bold px-2 py-0.5 rounded-lg bg-muted/50 text-muted-foreground"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                        {log.description && (
                          <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                        )}
                        {(log.photoUrl || log.photo_url) && (
                          <img
                            src={log.photoUrl || log.photo_url}
                            alt="Refeição"
                            className="w-full h-32 rounded-xl object-cover mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
