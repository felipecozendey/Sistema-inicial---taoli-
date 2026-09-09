import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

export type TimeFilterMode = 'today' | 'week' | 'month' | 'custom'

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
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Botão Hoje - Duolingo Verde (#58CC02) */}
      <button
        type="button"
        onClick={() => onModeChange('today')}
        className={cn(
          'px-5 py-2.5 rounded-3xl font-extrabold text-sm transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'today'
            ? 'bg-[#58CC02] hover:bg-[#4EBC02] text-white border-b-4 border-[#46A302] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#58CC02]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <span>☀️</span>
        <span>Hoje</span>
      </button>

      {/* Botão Semana - Duolingo Azul (#1CB0F6) */}
      <button
        type="button"
        onClick={() => onModeChange('week')}
        className={cn(
          'px-5 py-2.5 rounded-3xl font-extrabold text-sm transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'week'
            ? 'bg-[#1CB0F6] hover:bg-[#1899D6] text-white border-b-4 border-[#1899D6] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#1CB0F6]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <span>📅</span>
        <span>Esta Semana</span>
      </button>

      {/* Botão Mês - Duolingo Roxo/Neutro */}
      <button
        type="button"
        onClick={() => onModeChange('month')}
        className={cn(
          'px-5 py-2.5 rounded-3xl font-extrabold text-sm transition-all duration-150 flex items-center gap-1.5 select-none',
          mode === 'month'
            ? 'bg-[#CE82FF] hover:bg-[#B36BD9] text-white border-b-4 border-[#9B54BA] shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#CE82FF]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        <span>🗓️</span>
        <span>Este Mês</span>
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
            className={cn(
              'px-5 py-2.5 rounded-3xl font-extrabold text-sm transition-all duration-150 flex items-center gap-2 select-none',
              mode === 'custom'
                ? 'bg-[#FF9600] hover:bg-[#E58700] text-white border-b-4 border-[#CC7A00] shadow-sm active:translate-y-1 active:border-b-0'
                : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#FF9600]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
            )}
          >
            <CalendarIcon className="w-4 h-4" strokeWidth={2.5} />
            <span>{mode === 'custom' ? formatCustomLabel() : 'Personalizado'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3 rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-xl"
          align="start"
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
