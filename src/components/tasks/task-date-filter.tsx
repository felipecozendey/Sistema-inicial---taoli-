import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, Hourglass, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

export type TimeFilterMode = 'today' | 'week' | 'month' | 'scheduled' | 'deadline' | 'custom'

interface TaskDateFilterProps {
  mode: TimeFilterMode
  onModeChange: (mode: TimeFilterMode) => void
  customRange: DateRange | undefined
  onCustomRangeChange: (range: DateRange | undefined) => void
}

export function TaskDateFilter({
  mode,
  onModeChange,
  customRange,
  onCustomRangeChange,
}: TaskDateFilterProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const formatCustomLabel = () => {
    if (!customRange?.from) return 'Escolher Período'
    if (!customRange.to || isSameDay(customRange.from, customRange.to)) {
      return format(customRange.from, "dd 'de' MMM", { locale: ptBR })
    }
    const fromStr = format(customRange.from, 'dd/MM', { locale: ptBR })
    const toStr = format(customRange.to, 'dd/MM', { locale: ptBR })
    return `${fromStr} - ${toStr}`
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-hide max-w-full">
      {/* Botão Hoje - Duolingo Verde (#58CC02) */}
      <button
        type="button"
        onClick={() => onModeChange('today')}
        title="Hoje"
        aria-label="Hoje"
        className={cn(
          'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'today'
            ? 'bg-[#58CC02] hover:bg-[#4EBC02] text-white border-b-4 border-[#46A302] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#58CC02]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <span className="text-sm leading-none">☀️</span>
        <span className="hidden sm:inline">Hoje</span>
      </button>

      {/* Botão Semana - Duolingo Azul (#1CB0F6) */}
      <button
        type="button"
        onClick={() => onModeChange('week')}
        title="Esta Semana"
        aria-label="Esta Semana"
        className={cn(
          'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'week'
            ? 'bg-[#1CB0F6] hover:bg-[#1899D6] text-white border-b-4 border-[#1899D6] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#1CB0F6]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <span className="text-sm leading-none">📅</span>
        <span className="hidden sm:inline">Semana</span>
      </button>

      {/* Botão Mês - Duolingo Roxo/Neutro */}
      <button
        type="button"
        onClick={() => onModeChange('month')}
        title="Este Mês"
        aria-label="Este Mês"
        className={cn(
          'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'month'
            ? 'bg-[#CE82FF] hover:bg-[#B36BD9] text-white border-b-4 border-[#9B54BA] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#CE82FF]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <span className="text-sm leading-none">🗓️</span>
        <span className="hidden sm:inline">Mês</span>
      </button>

      {/* Botão Agendado para - Duolingo Teal/Cyan */}
      <button
        type="button"
        onClick={() => onModeChange('scheduled')}
        title="Agendado para"
        aria-label="Agendado para"
        className={cn(
          'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'scheduled'
            ? 'bg-[#00CD9C] hover:bg-[#00B88C] text-white border-b-4 border-[#009E77] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#00CD9C]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span className="hidden sm:inline">Agenda</span>
      </button>

      {/* Botão Prazo limite - Duolingo Coral/Laranja */}
      <button
        type="button"
        onClick={() => onModeChange('deadline')}
        title="Prazo limite"
        aria-label="Prazo limite"
        className={cn(
          'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'deadline'
            ? 'bg-[#FF4B4B] hover:bg-[#E03A3A] text-white border-b-4 border-[#C92A2A] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#FF4B4B]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <Hourglass className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span className="hidden sm:inline">Prazo</span>
      </button>

      {/* Popover / DateRangePicker para Período Personalizado / Escolher Dia */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => {
              if (mode !== 'custom') {
                onModeChange('custom')
              }
            }}
            title={mode === 'custom' ? formatCustomLabel() : 'Personalizado'}
            aria-label={mode === 'custom' ? formatCustomLabel() : 'Período Personalizado'}
            className={cn(
              'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-2xl font-black text-xs transition-all duration-150 flex items-center gap-1.5 select-none',
              mode === 'custom'
                ? 'bg-[#FF9600] hover:bg-[#E58700] text-white border-b-4 border-[#CC7A00] shadow-sm active:translate-y-1 active:border-b-0'
                : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#FF9600]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            {mode === 'custom' ? (
              <span className="inline text-xs">{formatCustomLabel()}</span>
            ) : (
              <span className="hidden sm:inline">Período</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3 rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-xl"
          align="start"
          collisionPadding={12}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                Escolha o período ou um dia
              </p>
              {customRange && (
                <button
                  type="button"
                  onClick={() => {
                    onCustomRangeChange(undefined)
                  }}
                  className="text-xs font-bold text-muted-foreground hover:text-[#FF4B4B] flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Limpar
                </button>
              )}
            </div>
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={(range) => {
                onCustomRangeChange(range)
                onModeChange('custom')
                if (range?.from && range?.to && !isSameDay(range.from, range.to)) {
                  setPopoverOpen(false)
                }
              }}
              locale={ptBR}
              initialFocus
              numberOfMonths={1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
