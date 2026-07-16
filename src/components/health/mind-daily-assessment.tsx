import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MOODS, METRIC_CONFIG } from '@/components/health/mind-constants'
import { MindEventStream } from '@/components/health/mind-event-stream'

function MetricSlider({
  label,
  hint,
  value,
  onChange,
  config,
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
  config: { labels: string[]; colors: string[] }
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold">
        {label} <span className="text-[10px] text-muted-foreground">({hint})</span>
      </label>
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
    </div>
  )
}

export function MindDailyAssessment() {
  const { mentalHealthLogs, addMentalHealthLog } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const dateStr = selectedDate.toISOString().split('T')[0]
  const dayLog = mentalHealthLogs.find((l) => l.date === dateStr)

  const [mood, setMood] = useState(dayLog?.mood || 3)
  const [stress, setStress] = useState(dayLog?.stressLevel || 3)
  const [anxiety, setAnxiety] = useState(dayLog?.anxietyLevel || 3)
  const [sleep, setSleep] = useState(dayLog?.sleepQuality || 3)
  const [sadness, setSadness] = useState(dayLog?.sadnessLevel || 3)
  const [notes, setNotes] = useState(dayLog?.mentalTriggers || '')
  const lastLoadedRef = useRef('')

  useEffect(() => {
    if (lastLoadedRef.current !== dateStr) {
      lastLoadedRef.current = dateStr
      setMood(dayLog?.mood || 3)
      setStress(dayLog?.stressLevel || 3)
      setAnxiety(dayLog?.anxietyLevel || 3)
      setSleep(dayLog?.sleepQuality || 3)
      setSadness(dayLog?.sadnessLevel || 3)
      setNotes(dayLog?.mentalTriggers || '')
    }
  }, [dateStr, dayLog])

  const handleSave = () => {
    addMentalHealthLog({
      mood,
      stressLevel: stress,
      anxietyLevel: anxiety,
      sadnessLevel: sadness,
      sleepQuality: sleep,
      mentalTriggers: notes,
      date: dateStr,
    })
    toast.success('Avaliação registrada com sucesso! 🧠')
  }

  const dateLabel = selectedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#CE82FF]/15 flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold">Avaliação Diária</h3>
              <p className="text-xs text-muted-foreground font-semibold">Avaliação do dia</p>
            </div>
          </div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] bg-card font-bold text-sm hover:bg-muted/50 transition-colors">
                <CalendarIcon className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">{dateLabel}</span>
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

        <p className="text-xs font-bold text-[#CE82FF]">Avaliando o dia: {dateLabel}</p>

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

        <MetricSlider
          label="Estresse"
          hint="1 = Esgotado • 5 = Calmo"
          value={stress}
          onChange={setStress}
          config={METRIC_CONFIG.stress}
        />
        <MetricSlider
          label="Ansiedade"
          hint="1 = Crítico • 5 = Tranquilo"
          value={anxiety}
          onChange={setAnxiety}
          config={METRIC_CONFIG.anxiety}
        />
        <MetricSlider
          label="Qualidade do Sono"
          hint="1 = Péssima • 5 = Revigorante"
          value={sleep}
          onChange={setSleep}
          config={METRIC_CONFIG.sleep}
        />
        <MetricSlider
          label="Tristeza"
          hint="1 = Profunda • 5 = Alegre"
          value={sadness}
          onChange={setSadness}
          config={METRIC_CONFIG.sadness}
        />

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

      <MindEventStream dateStr={dateStr} />
    </div>
  )
}
