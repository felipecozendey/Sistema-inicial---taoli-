import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  date: Date
  onDateChange: (date: Date) => void
  className?: string
}

export function DatePicker({ date, onDateChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] font-bold justify-start text-left h-10',
            className,
          )}
        >
          <CalendarIcon className="w-4 h-4 mr-2 text-[#1CB0F6]" />
          {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onDateChange(d)
              setOpen(false)
            }
          }}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
