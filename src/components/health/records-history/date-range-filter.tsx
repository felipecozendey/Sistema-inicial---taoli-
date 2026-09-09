import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, X, CalendarDays } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export type QuickPreset = 'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'custom'

interface DateRangeFilterProps {
  range: DateRange | undefined
  onRangeChange: (range: DateRange | undefined) => void
  activePreset: QuickPreset
  onPresetChange: (preset: QuickPreset) => void
}

export function DateRangeFilter({
  range,
  onRangeChange,
  activePreset,
  onPresetChange,
}: DateRangeFilterProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleSelectPreset = (preset: QuickPreset) => {
    onPresetChange(preset)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (preset === 'all') {
      onRangeChange(undefined)
      setPopoverOpen(false)
      return
    }

    if (preset === 'today') {
      onRangeChange({ from: today, to: today })
      setPopoverOpen(false)
      return
    }

    if (preset === '7days') {
      const from = subDays(today, 6)
      onRangeChange({ from, to: today })
      setPopoverOpen(false)
      return
    }

    if (preset === '30days') {
      const from = subDays(today, 29)
      onRangeChange({ from, to: today })
      setPopoverOpen(false)
      return
    }

    if (preset === 'thisMonth') {
      const from = startOfMonth(today)
      const to = endOfMonth(today)
      onRangeChange({ from, to })
      setPopoverOpen(false)
      return
    }

    if (preset === 'custom') {
      setPopoverOpen(true)
    }
  }

  const formatRangeLabel = () => {
    if (!range?.from) return 'Escolher Período'
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return format(range.from, "dd 'de' MMM", { locale: ptBR })
    }
    return `${format(range.from, 'dd/MM', { locale: ptBR })} - ${format(range.to, 'dd/MM/yy', { locale: ptBR })}`
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Pílulas de atalho rápido no estilo Duolingo */}
      <button
        type="button"
        onClick={() => handleSelectPreset('all')}
        className={cn(
          'px-3.5 py-1.5 rounded-3xl font-extrabold text-xs transition-all duration-150 select-none border-2 border-b-4',
          activePreset === 'all'
            ? 'bg-[#1CB0F6] border-[#0E8FCC] text-white shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:border-[#1CB0F6]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        Tudo
      </button>

      <button
        type="button"
        onClick={() => handleSelectPreset('today')}
        className={cn(
          'px-3.5 py-1.5 rounded-3xl font-extrabold text-xs transition-all duration-150 select-none border-2 border-b-4',
          activePreset === 'today'
            ? 'bg-[#58CC02] border-[#46A302] text-white shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:border-[#58CC02]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        Hoje
      </button>

      <button
        type="button"
        onClick={() => handleSelectPreset('7days')}
        className={cn(
          'px-3.5 py-1.5 rounded-3xl font-extrabold text-xs transition-all duration-150 select-none border-2 border-b-4',
          activePreset === '7days'
            ? 'bg-[#CE82FF] border-[#9B54BA] text-white shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:border-[#CE82FF]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        Últimos 7 dias
      </button>

      <button
        type="button"
        onClick={() => handleSelectPreset('thisMonth')}
        className={cn(
          'px-3.5 py-1.5 rounded-3xl font-extrabold text-xs transition-all duration-150 select-none border-2 border-b-4',
          activePreset === 'thisMonth'
            ? 'bg-[#FF9600] border-[#CC7A00] text-white shadow-sm active:translate-y-1 active:border-b-0'
            : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:border-[#FF9600]/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
        )}
      >
        Mês Atual
      </button>

      {/* DateRangePicker Popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => handleSelectPreset('custom')}
            className={cn(
              'px-3.5 py-1.5 rounded-3xl font-extrabold text-xs transition-all duration-150 flex items-center gap-1.5 select-none border-2 border-b-4',
              activePreset === 'custom'
                ? 'bg-foreground text-background border-foreground/80 shadow-sm active:translate-y-1 active:border-b-0'
                : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:border-foreground/50 hover:text-foreground active:translate-y-0.5 active:border-b-2',
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>{activePreset === 'custom' ? formatRangeLabel() : 'Calendário'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3 rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-xl"
          align="start"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#3B4A55]/60">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[#1CB0F6]" />
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Selecione o Dia ou Período
                </span>
              </div>
              {range?.from && (
                <button
                  type="button"
                  onClick={() => {
                    onRangeChange(undefined)
                    onPresetChange('all')
                    setPopoverOpen(false)
                  }}
                  className="text-xs font-bold text-muted-foreground hover:text-[#FF4B4B] flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Limpar
                </button>
              )}
            </div>

            <Calendar
              mode="range"
              selected={range}
              onSelect={(selectedRange) => {
                onRangeChange(selectedRange)
                onPresetChange('custom')
                if (selectedRange?.from && selectedRange?.to) {
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
