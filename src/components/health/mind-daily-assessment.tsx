import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MOODS = [
  { level: 1, emoji: '😩', label: 'Péssimo', color: '#FF4B4B' },
  { level: 2, emoji: '😕', label: 'Ruim', color: '#FF9600' },
  { level: 3, emoji: '😐', label: 'Neutro', color: '#FFC800' },
  { level: 4, emoji: '🙂', label: 'Bom', color: '#1CB0F6' },
  { level: 5, emoji: '😄', label: 'Excelente', color: '#58CC02' },
]

const METRIC_CONFIG: Record<string, { labels: string[]; colors: string[] }> = {
  stress: {
    labels: ['Calmo', 'Leve', 'Moderado', 'Alto', 'Esgotado'],
    colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600', '#FF4B4B'],
  },
  anxiety: {
    labels: ['Tranquilo', 'Leve', 'Moderado', 'Elevado', 'Crítico'],
    colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600', '#FF4B4B'],
  },
  sleep: {
    labels: ['Péssima', 'Ruim', 'Regular', 'Boa', 'Revigorante'],
    colors: ['#FF4B4B', '#FF9600', '#FFC800', '#1CB0F6', '#58CC02'],
  },
  focus: {
    labels: ['Difuso', 'Baixo', 'Médio', 'Alto', 'Hipperfoco'],
    colors: ['#FF4B4B', '#FF9600', '#FFC800', '#1CB0F6', '#58CC02'],
  },
}

function LevelSelector({
  value,
  onChange,
  config,
}: {
  value: number
  onChange: (v: number) => void
  config: { labels: string[]; colors: string[] }
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => {
        const n = i + 1
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              'py-2.5 rounded-xl border-2 border-b-4 text-[10px] font-bold transition-all duration-150 active:translate-y-0.5 active:border-b-2',
              value === n
                ? 'text-white'
                : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:bg-muted/50',
            )}
            style={
              value === n
                ? { backgroundColor: config.colors[i], borderColor: config.colors[i] }
                : undefined
            }
          >
            {config.labels[i]}
          </button>
        )
      })}
    </div>
  )
}

export function MindDailyAssessment() {
  const { mentalHealthLogs, addMentalHealthLog } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const todayLog = mentalHealthLogs.find((l) => l.date === today)

  const [mood, setMood] = useState(todayLog?.mood || 3)
  const [stress, setStress] = useState(todayLog?.stressLevel || 3)
  const [anxiety, setAnxiety] = useState(todayLog?.anxietyLevel || 3)
  const [sleep, setSleep] = useState(todayLog?.sleepQuality || 3)
  const [focus, setFocus] = useState(todayLog?.focusLevel || 3)
  const [notes, setNotes] = useState(todayLog?.mentalTriggers || '')

  useEffect(() => {
    if (todayLog) {
      setMood(todayLog.mood || 3)
      setStress(todayLog.stressLevel || 3)
      setAnxiety(todayLog.anxietyLevel || 3)
      setSleep(todayLog.sleepQuality || 3)
      setFocus(todayLog.focusLevel || 3)
      setNotes(todayLog.mentalTriggers || '')
    }
  }, [todayLog])

  const handleSave = () => {
    addMentalHealthLog({
      mood,
      stressLevel: stress,
      anxietyLevel: anxiety,
      focusLevel: focus,
      sleepQuality: sleep,
      mentalTriggers: notes,
    })
    toast.success('Avaliação registrada com sucesso! 🧠')
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
          <span className="text-xl">🧠</span>
        </div>
        <div>
          <h3 className="text-lg font-extrabold">Humor & Performance</h3>
          <p className="text-xs text-muted-foreground font-semibold">Avaliação unificada do dia</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold">Humor</label>
        <div className="grid grid-cols-5 gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.level}
              onClick={() => setMood(m.level)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 border-b-4 transition-all duration-150 active:translate-y-0.5 active:border-b-2',
                mood === m.level
                  ? 'scale-105'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
              )}
              style={
                mood === m.level
                  ? {
                      backgroundColor: `${m.color}20`,
                      borderColor: m.color,
                      borderBottomColor: m.color,
                    }
                  : undefined
              }
            >
              <span className="text-2xl">{m.emoji}</span>
              <span
                className="text-[9px] font-bold"
                style={mood === m.level ? { color: m.color } : undefined}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold">Estresse</label>
        <LevelSelector value={stress} onChange={setStress} config={METRIC_CONFIG.stress} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold">Ansiedade</label>
        <LevelSelector value={anxiety} onChange={setAnxiety} config={METRIC_CONFIG.anxiety} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold">Qualidade do Sono</label>
        <LevelSelector value={sleep} onChange={setSleep} config={METRIC_CONFIG.sleep} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold">Foco / TDAH</label>
        <LevelSelector value={focus} onChange={setFocus} config={METRIC_CONFIG.focus} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold">Notas & Gatilhos</label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="O que influenciou seu estado hoje?"
          className="rounded-2xl bg-muted/50 border-transparent font-semibold"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-2xl bg-[#CE82FF] text-white font-extrabold border-b-4 border-[#A855F7] active:translate-y-1 active:border-b-0 transition-all duration-150"
      >
        💾 Registrar Avaliação
      </button>
    </div>
  )
}
