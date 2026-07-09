import { useState } from 'react'
import { Radar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusRadar } from '@/components/focus-radar/focus-radar-provider'
import { FocusRadarConfig } from '@/components/focus-radar/focus-radar-config'

export function FocusRadarToggle() {
  const { isRunning, timeRemaining } = useFocusRadar()
  const [configOpen, setConfigOpen] = useState(false)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <>
      <button
        onClick={() => setConfigOpen(true)}
        className={cn(
          'fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-b-4 font-bold text-sm transition-all active:translate-y-1 active:border-b-0 print:hidden',
          isRunning
            ? 'bg-[#58CC02] border-[#46A302] text-white shadow-lg animate-pulse'
            : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:bg-muted',
        )}
      >
        <Radar className="w-5 h-5" strokeWidth={2.5} />
        <span className="hidden sm:inline">Radar</span>
        {isRunning ? (
          <span className="bg-white/20 px-2 py-0.5 rounded-lg tabular-nums text-xs">
            {formatTime(timeRemaining)}
          </span>
        ) : (
          <span className="text-xs opacity-70">OFF</span>
        )}
      </button>
      <FocusRadarConfig open={configOpen} onOpenChange={setConfigOpen} />
    </>
  )
}
