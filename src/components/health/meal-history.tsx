import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Trash2, Loader2 } from 'lucide-react'

const ADHERENCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  perfect: { bg: 'bg-[#58CC02]/10', text: 'text-[#58CC02]', label: 'No Plano' },
  adapted: { bg: 'bg-[#FFC800]/10', text: 'text-[#FFC800]', label: 'Adaptado' },
  cheat: { bg: 'bg-[#FF4B4B]/10', text: 'text-[#FF4B4B]', label: 'Livre' },
}

const MEAL_EMOJIS: Record<string, string> = {
  'Café da Manhã': '☀️',
  Almoço: '🍽️',
  Jantar: '🌙',
  Lanche: '🥪',
}

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'Café da Manhã', label: 'Café' },
  { value: 'Almoço', label: 'Almoço' },
  { value: 'Lanche', label: 'Lanche' },
  { value: 'Jantar', label: 'Jantar' },
]

export function MealHistory() {
  const mealLogs = useAppStore((s) => s.mealLogs)
  const deleteMealLog = useAppStore((s) => s.deleteMealLog)
  const [filter, setFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredLogs = useMemo(() => {
    const logs = [...mealLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    if (filter === 'all') return logs
    return logs.filter((l) => l.mealType === filter)
  }, [mealLogs, filter])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof filteredLogs> = {}
    for (const log of filteredLogs) {
      if (!groups[log.date]) groups[log.date] = []
      groups[log.date].push(log)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredLogs])

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dateStr === today) return 'Hoje'
    if (dateStr === yesterday) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }, [])

  const formatTime = useCallback((timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (deletingId) return
      setDeletingId(id)
      try {
        await deleteMealLog(id)
      } finally {
        setDeletingId(null)
      }
    },
    [deletingId, deleteMealLog],
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
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
              {logs.map((log) => {
                const aStyle = ADHERENCE_STYLES[log.adherence] ?? ADHERENCE_STYLES.perfect
                const emoji = MEAL_EMOJIS[log.mealType] ?? '🍴'
                return (
                  <div
                    key={log.id}
                    className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1CB0F6]/10 flex items-center justify-center text-2xl shrink-0">
                        {log.photoUrl ? (
                          <img
                            src={log.photoUrl}
                            alt="Refeição"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          emoji
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-extrabold truncate">{log.mealType}</p>
                            <span
                              className={cn(
                                'text-xs font-bold px-2 py-0.5 rounded-lg shrink-0',
                                aStyle.bg,
                                aStyle.text,
                              )}
                            >
                              {aStyle.label}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(log.id)}
                            disabled={deletingId === log.id}
                            className="p-1.5 rounded-xl text-[#FF4B4B] hover:bg-[#FF4B4B]/10 transition-colors duration-150 shrink-0 disabled:opacity-50"
                          >
                            {deletingId === log.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mb-0.5 truncate">
                            {log.description}
                          </p>
                        )}
                        <p className="text-xs font-bold text-muted-foreground mb-1">
                          {formatTime(log.timestamp)}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground">
                          🔥 {Math.round(log.calories || 0)} kcal | 🥩{' '}
                          {Math.round(log.protein || 0)}g P | 🍞 {Math.round(log.carbs || 0)}g C |
                          🥑 {Math.round(log.fat || 0)}g G
                        </p>
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
