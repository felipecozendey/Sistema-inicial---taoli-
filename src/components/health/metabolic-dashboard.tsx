import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  CALC_FORMULA_LABELS,
  PATIENT_PROFILE_LABELS,
  type CalcFormula,
  type PatientProfile,
} from '@/lib/metabolic-math'
import { Flame, User, Calculator, Activity, AlertTriangle } from 'lucide-react'
import { safeFormatDateLong } from '@/lib/date-utils'
import { MetabolicEvolutionChart } from '@/components/health/metabolic-evolution-chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

interface Props {
  selectedDate: Date
}

export function MetabolicDashboard({ selectedDate }: Props) {
  const metabolicLogs = useAppStore((s) => s.metabolicLogs)
  const fetchMetabolicLogs = useAppStore((s) => s.fetchMetabolicLogs)
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const [dashboardDate, setDashboardDate] = useState<Date>(selectedDate)

  useEffect(() => {
    fetchMetabolicLogs()
  }, [fetchMetabolicLogs])

  useEffect(() => {
    setDashboardDate(selectedDate)
  }, [selectedDate])

  const selectedDateStr = dashboardDate.toISOString().split('T')[0]

  const log = useMemo(() => {
    if (!metabolicLogs?.length) return null
    const sorted = [...metabolicLogs].sort((a, b) => b.date.localeCompare(a.date))
    return sorted.find((l) => l.date <= selectedDateStr) || sorted[0]
  }, [metabolicLogs, selectedDateStr])

  const profileLabel = useMemo(() => {
    if (!bodyMetrics?.length) return 'Paciente'
    const sorted = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))
    const p = sorted[0]?.patientProfile as PatientProfile
    return p ? PATIENT_PROFILE_LABELS[p] || 'Paciente' : 'Paciente'
  }, [bodyMetrics])

  const formulaLabel = log?.formula
    ? CALC_FORMULA_LABELS[log.formula as CalcFormula] || log.formula
    : '—'

  const activities = log?.extraActivities || []

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-extrabold flex items-center gap-2">
        <Flame className="w-5 h-5 text-[#FF9600]" /> Metabolismo e Gasto Energético
      </h3>

      <Tabs defaultValue="daily">
        <TabsList className="grid grid-cols-2 w-full rounded-2xl">
          <TabsTrigger value="daily">Avaliação do Dia</TabsTrigger>
          <TabsTrigger value="evolution">Evolução Histórica</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start border-2 rounded-2xl font-bold"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {safeFormatDateLong(dashboardDate.toISOString())}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dashboardDate}
                onSelect={(d) => d && setDashboardDate(d)}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {!log ? (
            <div className="bg-muted/30 rounded-2xl p-8 text-center">
              <Flame className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-bold text-muted-foreground">
                Nenhum gasto energético calculado para esta data.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">TMB</span>
                    <span className="text-lg font-extrabold text-[#1CB0F6]">{log.tmb} kcal</span>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Perfil
                    </span>
                    <span className="text-sm font-extrabold">{profileLabel}</span>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5" /> Fórmula
                    </span>
                    <span className="text-sm font-extrabold text-right">{formulaLabel}</span>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">NAF</span>
                    <span className="text-sm font-extrabold">{log.naf || '—'}</span>
                  </div>
                  {log.injuryFactor && log.injuryFactor > 1.0 && (
                    <div className="bg-[#FF9600]/10 rounded-2xl p-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF9600]" /> Fator Injúria
                      </span>
                      <span className="text-sm font-extrabold text-[#FF9600]">
                        ×{log.injuryFactor}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-[#58CC02]/10 border-2 border-[#58CC02]/30 rounded-3xl p-4 flex flex-col items-center justify-center gap-1">
                  <p className="text-xs font-bold text-muted-foreground">VENTA Final</p>
                  <p className="text-5xl font-extrabold text-[#58CC02]">{log.ventaTarget}</p>
                  <p className="text-xs font-bold text-muted-foreground">kcal/dia</p>
                </div>
              </div>

              {activities.length > 0 && (
                <div className="border-t-2 border-muted pt-4">
                  <h4 className="text-sm font-extrabold mb-2 flex items-center gap-1">
                    <Activity className="w-4 h-4 text-[#FF9600]" /> Atividades Físicas
                  </h4>
                  <div className="space-y-1">
                    {activities.map((a: any, i: number) => (
                      <div
                        key={a.id || i}
                        className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2"
                      >
                        <span className="text-xs font-bold">{a.item_name || a.name || '—'}</span>
                        <div className="flex gap-3 text-xs font-bold text-muted-foreground">
                          <span>MET: {a.met_value || a.met || '—'}</span>
                          <span>{a.duration_min || a.duration || 0}min</span>
                          <span className="text-[#FF9600]">{a.energy_kcal || 0} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="evolution" className="mt-4">
          <MetabolicEvolutionChart logs={metabolicLogs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
