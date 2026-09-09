import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Trash2, Loader2, Pencil, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewMealModal } from '@/components/health/new-meal-modal'
import type { MealLog } from '@/stores/store-data'

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

const PERIOD_PRESETS = [
  { value: 'all', label: 'Tudo' },
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: '7 dias' },
  { value: '30days', label: '30 dias' },
]

const PAGE_SIZE = 5

export function MealHistory() {
  const mealLogs = useAppStore((s) => s.mealLogs)
  const deleteMealLog = useAppStore((s) => s.deleteMealLog)
  const [filter, setFilter] = useState<string>('all')
  const [period, setPeriod] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Safe date parser
  const getSafeDateObj = useCallback((dateStr: string) => {
    if (!dateStr) return null
    // If it's pure YYYY-MM-DD
    const isoString = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return null
    return d
  }, [])

  // Filter by meal type & period
  const filteredLogs = useMemo(() => {
    const sorted = [...mealLogs].sort((a, b) => {
      const tA = a.timestamp || a.date || ''
      const tB = b.timestamp || b.date || ''
      return tB.localeCompare(tA)
    })

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    return sorted.filter((l) => {
      if (filter !== 'all' && l.mealType !== filter) return false

      if (period === 'today') {
        return l.date === todayStr
      }
      if (period === '7days') {
        const d = getSafeDateObj(l.date)
        if (!d) return true
        const diffMs = now.getTime() - d.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        return diffDays <= 7
      }
      if (period === '30days') {
        const d = getSafeDateObj(l.date)
        if (!d) return true
        const diffMs = now.getTime() - d.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        return diffDays <= 30
      }
      return true
    })
  }, [mealLogs, filter, period, getSafeDateObj])

  // Pagination client-side
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  }, [filteredLogs, currentPage])

  // Group current page items by date for display
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof paginatedLogs> = {}
    for (const log of paginatedLogs) {
      if (!groups[log.date]) groups[log.date] = []
      groups[log.date].push(log)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [paginatedLogs])

  const formatDate = useCallback(
    (dateStr: string) => {
      const date = getSafeDateObj(dateStr)
      if (!date) return dateStr || 'Data inválida'

      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (dateStr === today) return 'Hoje'
      if (dateStr === yesterday) return 'Ontem'
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    },
    [getSafeDateObj],
  )

  const formatTime = useCallback(
    (timestamp: string) => {
      if (!timestamp) return ''
      const d = getSafeDateObj(timestamp)
      if (!d) return ''
      try {
        return d.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch {
        return ''
      }
    },
    [getSafeDateObj],
  )

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

  const handleEdit = (log: MealLog) => {
    setEditingMeal(log)
    setEditModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters: Meal Types */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value)
              setPage(0)
            }}
            className={cn(
              'px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-2',
              filter === f.value
                ? 'bg-[#1CB0F6] text-white border-[#1890D0]'
                : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground bg-card',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Period Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-extrabold text-muted-foreground flex items-center gap-1 shrink-0">
          <Calendar className="w-3.5 h-3.5" /> Período:
        </span>
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => {
              setPeriod(p.value)
              setPage(0)
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all duration-150',
              period === p.value
                ? 'bg-[#58CC02] text-white border-[#58CC02]'
                : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground bg-card hover:bg-muted/40',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
          <span className="text-4xl block mb-3">🍽️</span>
          <p className="text-sm font-bold text-muted-foreground">
            Nenhuma refeição encontrada no filtro selecionado.
          </p>
        </div>
      ) : (
        <>
          {groupedByDate.map(([date, logs]) => (
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
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEdit(log)}
                                className="p-1.5 rounded-xl text-[#1CB0F6] hover:bg-[#1CB0F6]/10 transition-colors duration-150"
                                title="Editar refeição"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(log.id)}
                                disabled={deletingId === log.id}
                                className="p-1.5 rounded-xl text-[#FF4B4B] hover:bg-[#FF4B4B]/10 transition-colors duration-150 disabled:opacity-50"
                                title="Excluir refeição"
                              >
                                {deletingId === log.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
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
                            {((log.fibersG && log.fibersG > 0) ||
                              (log.sodiumMg && log.sodiumMg > 0)) && (
                              <span className="block mt-0.5 text-[11px] text-muted-foreground/80">
                                {log.fibersG ? `🌾 ${Math.round(log.fibersG)}g fibras ` : ''}
                                {log.sodiumMg ? `🧂 ${Math.round(log.sodiumMg)}mg sódio` : ''}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Client-side Pagination (max 5 per page) - Duolingo 3D style */}
          <div className="flex items-center justify-between pt-4 px-1 border-t-2 border-muted/50">
            <span className="font-bold text-muted-foreground text-xs">
              {currentPage * PAGE_SIZE + 1}–
              {Math.min((currentPage + 1) * PAGE_SIZE, filteredLogs.length)} de{' '}
              {filteredLogs.length} refeições
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-2xl font-extrabold border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] active:translate-y-1 active:border-b-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded-2xl font-extrabold border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] active:translate-y-1 active:border-b-2 disabled:opacity-40"
              >
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Edit Meal Modal */}
      <NewMealModal
        open={editModalOpen}
        onOpenChange={(o) => {
          setEditModalOpen(o)
          if (!o) setEditingMeal(null)
        }}
        mealToEdit={editingMeal}
      />
    </div>
  )
}
