import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { calculateIMC, calculateRCQ, calculate4CompartmentModel } from '@/lib/anthropometry-utils'
import { FourCompartmentChart } from '@/components/health/four-compartment-chart'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon } from 'lucide-react'
import { safeFormatDate } from '@/lib/date-utils'
import { ptBR } from 'date-fns/locale'

interface Props {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DailyEvaluationPanel({ selectedDate, onDateChange }: Props) {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const fetchBodyMetrics = useAppStore((s) => s.fetchBodyMetrics)

  useEffect(() => {
    fetchBodyMetrics()
  }, [fetchBodyMetrics])

  const selectedDateStr = selectedDate.toISOString().split('T')[0]

  const metric = useMemo(() => {
    if (!bodyMetrics?.length) return null
    const sorted = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))
    return sorted.find((m) => m.date <= selectedDateStr) || sorted[0]
  }, [bodyMetrics, selectedDateStr])

  if (!metric) {
    return (
      <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
        <span className="text-4xl block mb-3">📋</span>
        <p className="text-sm font-bold text-muted-foreground">
          Nenhuma avaliação registrada para esta data.
        </p>
      </div>
    )
  }

  const gender = (metric.gender as 'male' | 'female') || 'male'
  const imc = calculateIMC(metric.weight, metric.height || 0)
  const rcq = calculateRCQ(metric.waistCirc || 0, metric.hipCirc || 0, gender)
  const bodyFat = metric.bodyFatPercentage || 0

  const compartment = calculate4CompartmentModel(
    metric.weight,
    metric.height || 0,
    metric.wristDiameter || 0,
    metric.femurDiameter || 0,
    bodyFat,
    gender,
  )

  return (
    <div className="space-y-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start border-2 rounded-2xl font-bold">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {safeFormatDate(selectedDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && onDateChange(d)}
            locale={ptBR}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1CB0F6]/10 border-2 border-b-4 border-[#1CB0F6]/30 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">⚖️ IMC</p>
          <p className="text-lg font-extrabold text-[#1CB0F6]">{imc.value || '—'}</p>
          <p className="text-[9px] font-bold text-muted-foreground">{imc.classification}</p>
        </div>
        <div className="bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">📏 RCQ</p>
          <p className="text-lg font-extrabold text-[#FF9600]">{rcq.index || '—'}</p>
          <p className="text-[9px] font-bold text-muted-foreground">{rcq.riskClassification}</p>
        </div>
        <div className="bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/30 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground">🩸 Gordura</p>
          <p className="text-lg font-extrabold text-[#FF4B4B]">
            {bodyFat ? bodyFat.toFixed(1) : '—'}%
          </p>
          <p className="text-[9px] font-bold text-muted-foreground">Corporal</p>
        </div>
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4">
        <h4 className="text-sm font-extrabold mb-3">🧩 Composição Corporal (4 Compartimentos)</h4>
        <FourCompartmentChart
          muscular={compartment.muscular}
          adiposo={compartment.adiposo}
          osseo={compartment.osseo}
          residual={compartment.residual}
        />
      </div>
    </div>
  )
}
