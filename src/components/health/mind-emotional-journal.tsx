import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { RichTextEditor } from '@/components/studies/rich-text-editor'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'

export function MindEmotionalJournal() {
  const { journalEntries, fetchJournalEntries, upsertJournalEntry } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const dateStr = selectedDate.toISOString().split('T')[0]
  const dayEntry = journalEntries.find((e) => e.date === dateStr)
  const [content, setContent] = useState(dayEntry?.content || '')
  const [editorKey, setEditorKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const loadedDateRef = useRef('')

  useEffect(() => {
    fetchJournalEntries()
  }, [])

  useEffect(() => {
    if (loadedDateRef.current !== dateStr) {
      loadedDateRef.current = dateStr
      setContent(dayEntry?.content || '')
      setEditorKey((k) => k + 1)
    }
  }, [dateStr, dayEntry])

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertJournalEntry(content, dateStr)
      toast.success('Diário salvo com sucesso! 📝')
    } catch {
      toast.error('Erro ao salvar diário. Tente novamente.')
    }
    setSaving(false)
  }

  const dateLabel = selectedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 flex items-center justify-center">
            <span className="text-xl">📖</span>
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Diário Emocional</h3>
            <p className="text-xs text-muted-foreground font-semibold">{dateLabel}</p>
          </div>
        </div>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] bg-card font-bold text-sm hover:bg-muted/50 transition-colors">
              <CalendarIcon className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Data</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  setSelectedDate(d)
                  setCalendarOpen(false)
                }
              }}
              className="rounded-2xl"
            />
          </PopoverContent>
        </Popover>
      </div>

      <RichTextEditor
        key={editorKey}
        content={content}
        onChange={setContent}
        currentNoteId={dateStr}
        placeholder="Como foi seu dia emocional? Descreva seus sentimentos..."
        variant="full"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-[#58CC02] text-white font-extrabold border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150 disabled:opacity-60"
      >
        {saving ? 'Salvando...' : '💾 Gravar Diário'}
      </button>
    </div>
  )
}
