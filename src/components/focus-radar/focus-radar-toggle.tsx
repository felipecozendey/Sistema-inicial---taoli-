import { useState } from 'react'
import { Radio, Coffee, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusRadar } from '@/components/focus-radar/focus-radar-provider'
import { FocusStudio } from '@/components/focus-radar/focus-studio'

export function FocusRadarToggle() {
  const { isRunning, timeRemaining, phase, adaFocus } = useFocusRadar()
  const [studioOpen, setStudioOpen] = useState(false)

  const formatTime = (s: number) => {
    const safe = Math.max(0, s)
    const m = Math.floor(safe / 60)
    const sec = safe % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  // Estilo do botão conforme Pomodoro (fase e tempo)
  const getButtonStyles = () => {
    if (!isRunning) {
      return {
        classes:
          'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:bg-muted shadow-md',
        badge: 'OFF',
        badgeClass: 'text-xs opacity-70',
        label: 'Foco',
      }
    }

    if (phase === 'short') {
      return {
        classes: 'bg-[#1CB0F6] border-[#1899D6] text-white shadow-lg animate-pulse',
        badge: formatTime(timeRemaining),
        badgeClass: 'bg-white/20 px-2 py-0.5 rounded-lg tabular-nums text-xs',
        label: 'Pausa',
      }
    }

    if (phase === 'long') {
      return {
        classes: 'bg-[#FFC800] border-[#E5B400] text-black shadow-lg animate-pulse',
        badge: formatTime(timeRemaining),
        badgeClass: 'bg-black/15 px-2 py-0.5 rounded-lg tabular-nums text-xs',
        label: 'Pausa Longa',
      }
    }

    // Foco normal
    return {
      classes: 'bg-[#58CC02] border-[#46A302] text-white shadow-lg animate-pulse',
      badge: formatTime(timeRemaining),
      badgeClass: 'bg-white/20 px-2 py-0.5 rounded-lg tabular-nums text-xs',
      label: 'Foco',
    }
  }

  const { classes, badge, badgeClass, label } = getButtonStyles()

  return (
    <>
      <button
        onClick={() => setStudioOpen(true)}
        aria-label="Abrir Estúdio de Foco"
        className={cn(
          'fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 px-3.5 sm:px-4 py-3 rounded-2xl border-2 border-b-4 font-black text-sm transition-all active:translate-y-1 active:border-b-0 print:hidden select-none',
          classes,
        )}
      >
        <div className="relative flex items-center justify-center">
          {phase === 'focus' ? (
            <Clock className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          ) : (
            <Coffee className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          )}
          {/* Pontinho discreto quando Ada Focus está ativo */}
          {adaFocus.enabled && (
            <span
              title="Ada Focus Ativo"
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#58CC02] border-2 border-background ring-1 ring-[#46A302]"
            />
          )}
        </div>

        <span className="hidden sm:inline font-bold">{label}</span>

        <span className={badgeClass}>{badge}</span>
      </button>

      {/* Overlay em tela cheia do Estúdio de Foco */}
      <FocusStudio open={studioOpen} onClose={() => setStudioOpen(false)} />
    </>
  )
}
