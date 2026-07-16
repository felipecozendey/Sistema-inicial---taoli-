import { useState, useMemo, useEffect } from 'react'
import { useAppStore, MentalHealthLog, JournalEntry, MindEvent } from '@/stores/useAppStore'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CalendarIcon, ChevronLeft, ChevronRight, FileText, BookOpen, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type HistoryRecord = {
  date: string
  mentalLog?: MentalHealthLog
  journalEntry?: JournalEntry
  events: MindEvent[]
}

type DialogState = { title: string; content: string; isHtml?: boolean } | null

const SCORE_META: Record<string, { label: string; color: string }> = {
  mood: { label: 'Humor', color: '#CE82FF' },
  stress: { label: 'Estresse', color: '#FF9600' },
  anxiety: { label: 'Ansiedade', color: '#FF4B4B' },
  sleep: { label: 'Sono', color: '#8B5CF6' },
  sadness: { label: 'Tristeza', color: '#1CB0F6' },
}

const ITEMS_PER_PAGE = 5

export function MindHistoryTab() {
  const { mentalHealthLogs, journalEntries, mindEvents } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)

  const allRecords = useMemo(() => {
    const map = new Map<string, HistoryRecord>()
    mentalHealthLogs.forEach((l) => {
      if (!map.has(l.date)) map.set(l.date, { date: l.date, events: [] })
      map.get(l.date)!.mentalLog = l
    })
    journalEntries.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, { date: e.date, events: [] })
      map.get(e.date)!.journalEntry = e
    })
    mindEvents.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, { date: e.date, events: [] })
      map.get(e.date)!.events.push(e)
    })
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
  }, [mentalHealthLogs, journalEntries, mindEvents])

  const filteredRecords = useMemo(() => {
    if (!selectedDate) return allRecords
    const ds = selectedDate.toISOString().split('T')[0]
    return allRecords.filter((r) => r.date === ds)
  }, [allRecords, selectedDate])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE))
  const paginatedRecords = useMemo(
    () => filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredRecords, currentPage],
  )

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  const scoreBadges = (log: MentalHealthLog) => {
    const scores = [
      { key: 'mood', value: log.mood },
      { key: 'stress', value: log.stressLevel },
      { key: 'anxiety', value: log.anxietyLevel },
      { key: 'sleep', value: log.sleepQuality },
      { key: 'sadness', value: log.sadnessLevel },
    ]
    return scores.map((s) => {
      const cfg = SCORE_META[s.key]
      return (
        <span
          key={s.key}
          className="px-2 py-1 rounded-lg text-[10px] font-bold text-white"
          style={{ backgroundColor: cfg.color }}
        >
          {cfg.label}: {s.value}/5
        </span>
      )
    })
  }

  return (
    <div className="space-y-4">
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

      {paginatedRecords.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-sm font-bold text-muted-foreground">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedRecords.map((rec) => (
            <div
              key={rec.date}
              className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4 shadow-sm"
            >
              <p className="font-extrabold text-sm mb-2">{fmtDate(rec.date)}</p>
              {rec.mentalLog && (
                <div className="flex flex-wrap gap-1.5 mb-3">{scoreBadges(rec.mentalLog)}</div>
              )}
              <div className="flex flex-wrap gap-2">
                {rec.mentalLog?.mentalTriggers && (
                  <button
                    onClick={() =>
                      setDialog({
                        title: 'Notas & Gatilhos',
                        content: rec.mentalLog!.mentalTriggers,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF9600]/10 text-[#FF9600] text-xs font-bold border border-[#FF9600]/20 hover:bg-[#FF9600]/20 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Notas
                  </button>
                )}
                {rec.journalEntry?.content && (
                  <button
                    onClick={() =>
                      setDialog({
                        title: 'Diário Emocional',
                        content: rec.journalEntry!.content,
                        isHtml: true,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#58CC02]/10 text-[#58CC02] text-xs font-bold border border-[#58CC02]/20 hover:bg-[#58CC02]/20 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Diário
                  </button>
                )}
                {rec.events.length > 0 && (
                  <button
                    onClick={() =>
                      setDialog({
                        title: `Acontecimentos (${rec.events.length})`,
                        content: rec.events
                          .map((e, i) => `${i + 1}. ${e.description}`)
                          .join('\n\n'),
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1CB0F6]/10 text-[#1CB0F6] text-xs font-bold border border-[#1CB0F6]/20 hover:bg-[#1CB0F6]/20 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" /> Eventos ({rec.events.length})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-b-4 font-bold text-sm transition-all active:translate-y-0.5',
            currentPage === 1
              ? 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground/50 cursor-not-allowed'
              : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/50',
          )}
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} /> Anterior
        </button>
        <span className="text-sm font-extrabold">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-b-4 font-bold text-sm transition-all active:translate-y-0.5',
            currentPage === totalPages
              ? 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground/50 cursor-not-allowed'
              : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/50',
          )}
        >
          Próxima <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">{dialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {dialog?.isHtml ? (
              <div
                className="text-sm font-semibold leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: dialog.content }}
              />
            ) : (
              <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                {dialog?.content}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
