import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, BookOpen, Zap, Trash2 } from 'lucide-react'

type TimelineItem = {
  date: string
  type: 'journal' | 'event'
  content: string
  isHtml?: boolean
  id: string
}

export function MindTimeline() {
  const { journalEntries, mindEvents, deleteMindEvent } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const allItems = useMemo(() => {
    const items: TimelineItem[] = []
    journalEntries.forEach((e) => {
      if (e.content.trim()) {
        items.push({
          date: e.date,
          type: 'journal',
          content: e.content,
          isHtml: true,
          id: e.id,
        })
      }
    })
    mindEvents.forEach((e) => {
      items.push({
        date: e.date,
        type: 'event',
        content: e.description,
        id: e.id,
      })
    })
    return items.sort((a, b) => b.date.localeCompare(a.date))
  }, [journalEntries, mindEvents])

  const filteredItems = useMemo(() => {
    if (!selectedDate) return allItems
    const ds = selectedDate.toISOString().split('T')[0]
    return allItems.filter((i) => i.date === ds)
  }, [allItems, selectedDate])

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  return (
    <div className="space-y-4">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
              <span className="text-xl">🌀</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold">Linha do Tempo</h3>
              <p className="text-xs text-muted-foreground font-semibold">Vivências e Desabafos</p>
            </div>
          </div>
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
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-sm font-bold text-muted-foreground">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-muted/30 rounded-2xl p-4 border-2 border-[#E5E5E5] dark:border-[#3B4A55]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'journal' ? (
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#58CC02]/10 text-[#58CC02] text-[10px] font-bold">
                        <BookOpen className="w-3 h-3" /> Diário
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1CB0F6]/10 text-[#1CB0F6] text-[10px] font-bold">
                        <Zap className="w-3 h-3" /> Evento
                      </span>
                    )}
                    <span className="text-xs font-bold text-muted-foreground">
                      {fmtDate(item.date)}
                    </span>
                  </div>
                  {item.type === 'event' && (
                    <button
                      onClick={() => deleteMindEvent(item.id)}
                      className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                {item.isHtml ? (
                  <div
                    className="text-sm font-semibold leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                ) : (
                  <p className="text-sm font-semibold leading-relaxed">{item.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
