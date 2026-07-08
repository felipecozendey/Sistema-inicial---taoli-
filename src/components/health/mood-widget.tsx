import { useState } from 'react'
import { useAppStore, MoodLevel } from '@/stores/useAppStore'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOODS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 1, emoji: '😩', label: 'Péssimo', color: '#FF4B4B' },
  { level: 2, emoji: '😕', label: 'Ruim', color: '#FF9600' },
  { level: 3, emoji: '😐', label: 'Neutro', color: '#FFC800' },
  { level: 4, emoji: '🙂', label: 'Bom', color: '#1CB0F6' },
  { level: 5, emoji: '😄', label: 'Excelente', color: '#58CC02' },
]

export function MoodWidget() {
  const { tags, moodLogs, addMoodLog, deleteMoodLog } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = moodLogs
    .filter((l) => l.date === today)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const [selectedLevel, setSelectedLevel] = useState<MoodLevel | null>(null)
  const [note, setNote] = useState('')
  const [tagId, setTagId] = useState('')

  const handleSubmit = () => {
    if (selectedLevel === null) return
    addMoodLog(today, selectedLevel, note, tagId)
    setSelectedLevel(null)
    setNote('')
    setTagId('')
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
          <span className="text-xl">🧠</span>
        </div>
        <h3 className="text-lg font-extrabold">Humor</h3>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {MOODS.map((mood) => {
          const isActive = selectedLevel === mood.level
          return (
            <button
              key={mood.level}
              onClick={() => setSelectedLevel(mood.level)}
              className={cn(
                'flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                isActive
                  ? 'bg-muted/50 border-transparent scale-105'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
              )}
              style={isActive ? { borderBottomColor: mood.color } : undefined}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span
                className={cn(
                  'text-[9px] font-bold',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {mood.label}
              </span>
            </button>
          )
        })}
      </div>

      {selectedLevel !== null && (
        <div className="space-y-3 animate-fade-in-up">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Como você está se sentindo?"
            className="rounded-2xl bg-muted/50 border-transparent font-semibold"
          />
          {tags.length > 0 && (
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                <SelectValue placeholder="Associar a uma atividade" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-2xl bg-[#CE82FF] text-white font-extrabold border-b-4 border-[#A855F7] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            Registrar Humor
          </button>
        </div>
      )}

      {todayLogs.length > 0 && (
        <div className="space-y-2 mt-1">
          {todayLogs.map((log) => {
            const mood = MOODS.find((m) => m.level === log.moodLevel)
            const tag = tags.find((t) => t.id === log.tagId)
            return (
              <div
                key={log.id}
                className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{mood?.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-bold">{mood?.label}</span>
                    {log.note && (
                      <p className="text-xs text-muted-foreground truncate">{log.note}</p>
                    )}
                    {tag && (
                      <span className="text-[10px] font-bold" style={{ color: tag.color }}>
                        #{tag.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => deleteMoodLog(log.id)}
                    className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
