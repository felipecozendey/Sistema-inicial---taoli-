import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { RichTextEditor } from '@/components/studies/rich-text-editor'
import { toast } from 'sonner'

export function MindEmotionalJournal() {
  const { journalEntries, fetchJournalEntries, upsertJournalEntry } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const todayEntry = journalEntries.find((e) => e.date === today)

  const [content, setContent] = useState(todayEntry?.content || '')
  const [editorKey, setEditorKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(!!todayEntry)

  useEffect(() => {
    fetchJournalEntries()
  }, [])

  useEffect(() => {
    if (!loadedRef.current && todayEntry?.content) {
      loadedRef.current = true
      setContent(todayEntry.content)
      setEditorKey((k) => k + 1)
    }
  }, [todayEntry])

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertJournalEntry(content)
      toast.success('Diário salvo com sucesso! 📝')
    } catch {
      toast.error('Erro ao salvar diário. Tente novamente.')
    }
    setSaving(false)
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 flex items-center justify-center">
          <span className="text-xl">📖</span>
        </div>
        <div>
          <h3 className="text-lg font-extrabold">Diário Emocional</h3>
          <p className="text-xs text-muted-foreground font-semibold">
            {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <RichTextEditor
        key={editorKey}
        content={content}
        onChange={setContent}
        currentNoteId={today}
        placeholder="Como foi seu dia emocional? Descreva seus sentimentos..."
        variant="full"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-[#58CC02] text-white font-extrabold border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150 disabled:opacity-60"
      >
        {saving ? 'Salvando...' : '💾 Gravar Diário de Hoje'}
      </button>
    </div>
  )
}
