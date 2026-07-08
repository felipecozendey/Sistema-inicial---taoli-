import { useState, useMemo } from 'react'
import { useAppStore, HydrationLog, MoodLog, DigestionLog } from '@/stores/useAppStore'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Droplets, Trash2, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type LogType = 'hydration' | 'mood' | 'digestion'
type UnionLog =
  | (HydrationLog & { type: LogType })
  | (MoodLog & { type: LogType })
  | (DigestionLog & { type: LogType })

const MOOD_EMOJIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😩', label: 'Péssimo' },
  2: { emoji: '😕', label: 'Ruim' },
  3: { emoji: '😐', label: 'Neutro' },
  4: { emoji: '🙂', label: 'Bom' },
  5: { emoji: '😄', label: 'Excelente' },
}

const CATEGORY_LABELS: Record<LogType, string> = {
  hydration: 'Hidratação',
  mood: 'Humor',
  digestion: 'Digestão',
}

export function HealthHistory() {
  const {
    hydrationLogs,
    moodLogs,
    digestionLogs,
    tags,
    deleteHydrationLog,
    deleteMoodLog,
    deleteDigestionLog,
  } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [category, setCategory] = useState<'all' | LogType>('all')
  const [calendarOpen, setCalendarOpen] = useState(false)

  const allLogs = useMemo(() => {
    const merged: UnionLog[] = [
      ...hydrationLogs.map((l) => ({ ...l, type: 'hydration' as LogType })),
      ...moodLogs.map((l) => ({ ...l, type: 'mood' as LogType })),
      ...digestionLogs.map((l) => ({ ...l, type: 'digestion' as LogType })),
    ]
    return merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [hydrationLogs, moodLogs, digestionLogs])

  const filteredLogs = allLogs.filter((log) => {
    if (selectedDate && log.date !== selectedDate.toISOString().split('T')[0]) return false
    if (category !== 'all' && log.type !== category) return false
    return true
  })

  const handleDelete = (log: UnionLog) => {
    if (log.type === 'hydration') deleteHydrationLog(log.id)
    else if (log.type === 'mood') deleteMoodLog(log.id)
    else deleteDigestionLog(log.id)
  }

  const renderLogContent = (log: UnionLog) => {
    if (log.type === 'hydration')
      return { icon: '💧', title: `${log.amount}ml de água`, color: '#1CB0F6' }
    if (log.type === 'mood') {
      const mood = MOOD_EMOJIS[log.moodLevel]
      const tag = tags.find((t) => t.id === log.tagId)
      return {
        icon: mood.emoji,
        title: `Humor: ${mood.label}`,
        color: '#CE82FF',
        note: log.note,
        tag,
      }
    }
    return {
      icon: '🚽',
      title: `Digestão: Tipo ${log.bristolType}`,
      color: '#FF9600',
      note: log.note,
    }
  }

  const categoryOptions: ('all' | LogType)[] = ['all', 'hydration', 'mood', 'digestion']

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] bg-card font-bold text-sm hover:bg-muted/50 transition-colors">
              <CalendarIcon className="w-4 h-4" strokeWidth={2.5} />
              {selectedDate ? selectedDate.toLocaleDateString('pt-BR') : 'Todas as datas'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d)
                setCalendarOpen(false)
              }}
              className="rounded-2xl"
            />
            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate(undefined)
                  setCalendarOpen(false)
                }}
                className="w-full py-2 text-sm font-bold text-[#FF4B4B] hover:bg-[#FF4B4B]/10 transition-colors rounded-b-2xl"
              >
                Limpar filtro
              </button>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex gap-2 flex-wrap">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-4 py-2.5 rounded-2xl border-2 border-b-4 font-bold text-sm transition-all active:translate-y-0.5 active:border-b-2',
                category === cat
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:bg-muted/50',
              )}
            >
              {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-semibold">
            Nenhum registro encontrado.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const content = renderLogContent(log)
            const time = new Date(log.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
            const dateLabel = new Date(log.date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })
            return (
              <div
                key={`${log.type}-${log.id}`}
                className="flex items-center gap-3 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: content.color + '20' }}
                >
                  {content.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold">{content.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[log.type]}
                    </span>
                  </div>
                  {content.note && (
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5 truncate">
                      {content.note}
                    </p>
                  )}
                  {content.tag && (
                    <span className="text-[10px] font-bold" style={{ color: content.tag.color }}>
                      #{content.tag.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-bold">{time}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{dateLabel}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(log)}
                    className="p-1.5 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
