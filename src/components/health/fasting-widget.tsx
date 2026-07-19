import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { FASTING_PROTOCOLS, getMetabolicStage } from '@/types/fasting'
import { Flame, Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FastingWidgetProps {
  onEndFasting: () => void
}

export function FastingWidget({ onEndFasting }: FastingWidgetProps) {
  const activeFastingStart = useAppStore((s) => s.activeFastingStart)
  const selectedProtocol = useAppStore((s) => s.selectedProtocol)
  const fastingLogs = useAppStore((s) => s.fastingLogs)
  const setSelectedProtocol = useAppStore((s) => s.setSelectedProtocol)
  const startFastingTimer = useAppStore((s) => s.startFastingTimer)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (activeFastingStart) {
      const update = () => {
        setElapsed((Date.now() - new Date(activeFastingStart).getTime()) / 1000)
      }
      update()
      intervalRef.current = setInterval(update, 1000)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } else {
      setElapsed(0)
    }
  }, [activeFastingStart])

  const targetSeconds = selectedProtocol * 3600
  const progress = Math.min(100, (elapsed / targetSeconds) * 100)
  const elapsedHours = elapsed / 3600
  const stage = getMetabolicStage(elapsedHours)

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = Math.floor(totalSeconds % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const remaining = Math.max(0, targetSeconds - elapsed)
  const startTime = activeFastingStart ? new Date(activeFastingStart) : null
  const endTime = startTime ? new Date(startTime.getTime() + targetSeconds * 1000) : null

  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const recentLogs = [...fastingLogs].sort((a, b) => b.endTime.localeCompare(a.endTime)).slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#FF9600]/15 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#FF9600]" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-extrabold">Jejum Intermitente</h3>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-bold text-muted-foreground">Protocolo</p>
          <div className="grid grid-cols-5 gap-2">
            {FASTING_PROTOCOLS.map((p) => {
              const isActive = selectedProtocol === p.hours
              const isDisabled = !!activeFastingStart
              return (
                <button
                  key={p.hours}
                  disabled={isDisabled}
                  onClick={() => setSelectedProtocol(p.hours)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-b-4 transition-all duration-150',
                    isDisabled && !isActive && 'opacity-40 cursor-not-allowed',
                    isDisabled && isActive && 'cursor-not-allowed',
                    !isDisabled && 'active:translate-y-1 active:border-b-2 hover:bg-muted/30',
                    isActive
                      ? 'bg-[#FF9600]/10 border-[#FF9600]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                  style={isActive ? { borderBottomColor: '#FF9600' } : undefined}
                >
                  <span className="text-base font-extrabold">{p.description}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-center my-8">
          <div className="relative w-[220px] h-[220px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                strokeWidth="14"
                className="stroke-muted/30"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                strokeWidth="14"
                stroke="#FF9600"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {activeFastingStart ? (
                <>
                  <span className="text-3xl font-extrabold tabular-nums">
                    {formatTime(elapsed)}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground mt-1">
                    {progress >= 100 ? 'Meta atingida!' : `Faltam ${formatTime(remaining)}`}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-[#FF9600]">
                    {selectedProtocol}h
                  </span>
                  <span className="text-xs font-bold text-muted-foreground mt-1">
                    Pronto para iniciar
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {activeFastingStart && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">Progresso do Jejum</span>
              <span className="text-xs font-extrabold text-[#FF9600]">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-4 rounded-full bg-muted/50 border-2 border-[#E5E5E5] dark:border-[#3B4A55] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF9600] transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {activeFastingStart && startTime && endTime && (
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Início</p>
              <p className="text-sm font-extrabold">
                {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Fim Previsto</p>
              <p className="text-sm font-extrabold">
                {endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}

        {activeFastingStart && (
          <div
            className="rounded-2xl p-4 mb-6 text-center text-sm font-bold"
            style={{ backgroundColor: stage.color + '15', color: stage.color }}
          >
            {stage.text}
          </div>
        )}

        {!activeFastingStart ? (
          <button
            onClick={() => startFastingTimer()}
            className="w-full py-4 rounded-2xl bg-[#58CC02] text-white font-extrabold text-lg border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" strokeWidth={2.5} fill="white" />🚀 Iniciar Jejum
          </button>
        ) : (
          <button
            onClick={onEndFasting}
            className="w-full py-4 rounded-2xl bg-[#FF4B4B] text-white font-extrabold text-lg border-b-4 border-[#CC3B3B] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5" strokeWidth={2.5} fill="white" />
            🍽️ Encerrar Jejum
          </button>
        )}
      </div>

      {recentLogs.length > 0 && (
        <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
          <h4 className="text-sm font-extrabold mb-4">Histórico de Jejuns</h4>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{log.completed ? '✅' : '⏹️'}</span>
                  <div>
                    <p className="text-sm font-extrabold">
                      {log.targetHours}h · {log.actualHours.toFixed(1)}h
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {new Date(log.endTime).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white border-b-2',
                    log.completed
                      ? 'bg-[#58CC02] border-[#46A302]'
                      : 'bg-[#FFC800] border-[#CCA200]',
                  )}
                >
                  {log.completed ? '✅ Meta' : '⏹ Interrompido'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
