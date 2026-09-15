import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdaFocusPopupProps {
  open: boolean
  message: string
  autoDismissSeconds: number
  onDismiss: () => void
  isTesting?: boolean
}

export function AdaFocusPopup({
  open,
  message,
  autoDismissSeconds,
  onDismiss,
  isTesting = false,
}: AdaFocusPopupProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoDismissSeconds)

  useEffect(() => {
    if (!open) return
    setSecondsRemaining(autoDismissSeconds)
    if (autoDismissSeconds <= 0) return

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, autoDismissSeconds, onDismiss])

  if (!open) return null

  const progressPercent =
    autoDismissSeconds > 0
      ? Math.max(0, Math.min(100, (secondsRemaining / autoDismissSeconds) * 100))
      : 0

  return (
    <aside
      aria-label="Alerta Ada Focus"
      aria-live="polite"
      className={cn(
        'fixed z-[60] bottom-4 left-4 right-4 sm:right-auto sm:w-[320px] max-w-[calc(100vw-2rem)]',
        'pointer-events-auto select-none',
        'transition-all duration-300 transform animate-in slide-in-from-left-4 fade-in-50',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl bg-card text-card-foreground',
          'border-2 border-border border-b-4 shadow-2xl',
          'p-4 flex flex-col gap-2.5',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Ícone ilustrado SVG estilo Duolingo (radar / olho) */}
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center text-[#58CC02] shadow-sm">
            <svg
              className="w-6 h-6 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Radar waves / eye */}
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
              <path d="M7.76 16.24a6 6 0 0 1 0-8.49" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
            </svg>
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#58CC02]">
                Ada Focus
              </span>
              {isTesting && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Teste
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words mt-0.5">
              {message || 'Ainda focado? 👀'}
            </p>
          </div>

          {/* Botão X com área de toque mínima de 44px */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar alerta Ada Focus"
            className={cn(
              'w-11 h-11 -mr-2 -mt-2 shrink-0 rounded-2xl flex items-center justify-center',
              'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              'active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#58CC02]',
            )}
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Rodapé: tempo ou mensagem sutil */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground pt-0.5">
          <span>Lembrete de presença</span>
          {autoDismissSeconds > 0 ? (
            <span className="tabular-nums font-mono">Fecha em {secondsRemaining}s</span>
          ) : (
            <span>Manual (X)</span>
          )}
        </div>

        {/* Barra de progresso fina no rodapé quando autoDismissSeconds > 0 */}
        {autoDismissSeconds > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted overflow-hidden">
            <div
              className="h-full bg-[#58CC02] transition-all duration-1000 ease-linear rounded-r-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
