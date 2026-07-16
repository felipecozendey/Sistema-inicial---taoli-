import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Textarea } from '@/components/ui/textarea'
import { Brain, AlertTriangle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const FOCUS_LEVELS = [
  { level: 1, label: 'Disperso/Névoa Mental', emoji: '🌫️', color: '#FF4B4B' },
  { level: 2, label: 'Pouco Foco', emoji: '😕', color: '#FF9600' },
  { level: 3, label: 'Neutro', emoji: '😐', color: '#FFC800' },
  { level: 4, label: 'Foco Bom', emoji: '🙂', color: '#1CB0F6' },
  { level: 5, label: 'Foco Absoluto/Hiperfoco', emoji: '🎯', color: '#58CC02' },
]

export const ANXIETY_LEVELS = [
  { level: 1, label: 'Calmo', emoji: '🟢', color: '#58CC02' },
  { level: 2, label: 'Tranquilo', emoji: '🟢', color: '#84CC16' },
  { level: 3, label: 'Alerta', emoji: '🟡', color: '#FFC800' },
  { level: 4, label: 'Ansioso', emoji: '🟠', color: '#FF9600' },
  { level: 5, label: 'Crise de Estresse', emoji: '🔴', color: '#FF4B4B' },
]

export function MindEvaluation() {
  const { mentalHealthLogs, addMentalHealthLog } = useAppStore()
  const [focusLevel, setFocusLevel] = useState<number | null>(null)
  const [anxietyLevel, setAnxietyLevel] = useState<number | null>(null)
  const [triggers, setTriggers] = useState('')

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayLog = useMemo(
    () => mentalHealthLogs.find((l) => l.date === today),
    [mentalHealthLogs, today],
  )

  const handleSave = useCallback(() => {
    if (focusLevel === null || anxietyLevel === null) return
    addMentalHealthLog({ focusLevel, anxietyLevel, mentalTriggers: triggers })
    toast.success('Avaliação mental registrada com sucesso! 🧠')
    setFocusLevel(null)
    setAnxietyLevel(null)
    setTriggers('')
  }, [focusLevel, anxietyLevel, triggers, addMentalHealthLog])

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#1CB0F6]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Nível de Foco (TDAH)</h3>
            <p className="text-xs text-muted-foreground font-bold">Selecione seu nível atual</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {FOCUS_LEVELS.map((f) => {
            const isActive = focusLevel === f.level
            return (
              <button
                key={f.level}
                onClick={() => setFocusLevel(f.level)}
                className={cn(
                  'flex flex-col items-center gap-1 py-4 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                  isActive
                    ? 'bg-muted/50 border-transparent scale-105'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
                )}
                style={isActive ? { borderBottomColor: f.color } : undefined}
              >
                <span className="text-2xl">{f.emoji}</span>
                <span
                  className={cn(
                    'text-[9px] font-bold',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {f.level}
                </span>
              </button>
            )
          })}
        </div>
        {focusLevel !== null && (
          <p
            className="text-sm font-bold mt-3 text-center animate-fade-in-up"
            style={{ color: FOCUS_LEVELS[focusLevel - 1].color }}
          >
            {FOCUS_LEVELS[focusLevel - 1].label}
          </p>
        )}
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FF4B4B]/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#FF4B4B]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold">Ansiedade & Estresse</h3>
            <p className="text-xs text-muted-foreground font-bold">Como você está se sentindo?</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {ANXIETY_LEVELS.map((a) => {
            const isActive = anxietyLevel === a.level
            return (
              <button
                key={a.level}
                onClick={() => setAnxietyLevel(a.level)}
                className={cn(
                  'flex flex-col items-center gap-1 py-4 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                  isActive
                    ? 'bg-muted/50 border-transparent scale-105'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
                )}
                style={isActive ? { borderBottomColor: a.color } : undefined}
              >
                <span className="text-2xl">{a.emoji}</span>
                <span
                  className={cn(
                    'text-[9px] font-bold text-center px-1',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {a.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-extrabold mb-3">Gatilhos & Sintomas</h3>
        <Textarea
          value={triggers}
          onChange={(e) => setTriggers(e.target.value)}
          placeholder="Houve algum gatilho de ansiedade ou sintoma depressivo hoje? Descreva brevemente."
          className="rounded-2xl bg-muted/50 border-transparent font-semibold min-h-[100px]"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={focusLevel === null || anxietyLevel === null}
        className="w-full py-5 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-lg border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-6 h-6" strokeWidth={3} />
        Registrar Avaliação
      </button>

      {todayLog && (
        <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4 shadow-sm animate-fade-in-up">
          <p className="text-sm font-bold text-muted-foreground mb-2">Último registro de hoje:</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-bold">
              🎯 Foco: {FOCUS_LEVELS[todayLog.focusLevel - 1]?.label}
            </span>
            <span className="font-bold">
              {ANXIETY_LEVELS[todayLog.anxietyLevel - 1]?.emoji}{' '}
              {ANXIETY_LEVELS[todayLog.anxietyLevel - 1]?.label}
            </span>
          </div>
          {todayLog.mentalTriggers && (
            <p className="text-xs text-muted-foreground mt-2 italic">"{todayLog.mentalTriggers}"</p>
          )}
        </div>
      )}
    </div>
  )
}
