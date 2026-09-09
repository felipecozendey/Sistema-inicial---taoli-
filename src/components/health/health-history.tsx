import { useState, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { useAppStore } from '@/stores/useAppStore'
import {
  DateRangeFilter,
  type QuickPreset,
} from '@/components/health/records-history/date-range-filter'
import { MetricToggleGroup } from '@/components/health/records-history/metric-toggle-group'
import { DynamicEvolutionChart } from '@/components/health/records-history/dynamic-evolution-chart'
import { HistoryList } from '@/components/health/records-history/history-list'
import {
  BRISTOL_SCALE,
  URINE_SCALE,
  type HealthMetricCategory,
  type UnifiedHistoryEntry,
  type UnifiedChartPoint,
} from '@/components/health/records-history/types'

// Helper seguro para converter qualquer data/string em timestamp
function getSafeTime(val: string | Date | undefined | null): number {
  if (!val) return 0
  const d = val instanceof Date ? val : new Date(val.includes('T') ? val : `${val}T00:00:00`)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

// Helper seguro para extrair 'YYYY-MM-DD'
function getSafeDayString(val: string | Date | undefined | null): string {
  if (!val) return ''
  if (typeof val === 'string') {
    if (val.length === 10 && val.includes('-')) return val
    const d = new Date(val)
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
  }
  return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0]
}

export function HealthHistory() {
  // 1. ISOLAMENTO TOTAL DE DADOS: Consumir exclusivamente dados de "Registrar Hoje"
  // hydrationLogs, urineLogs, digestionLogs, bodyMetrics (salvos pela avaliação rápida)
  const hydrationLogs = useAppStore((s) => s.hydrationLogs)
  const urineLogs = useAppStore((s) => s.urineLogs)
  const digestionLogs = useAppStore((s) => s.digestionLogs)
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)

  // 2. FILTRO DE CALENDÁRIO: Range Picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [activePreset, setActivePreset] = useState<QuickPreset>('all')

  // 3. FILTRO MULTI-MÉTRICAS: ToggleGroup com múltipla seleção
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetricCategory[]>([
    'hydration',
    'urine',
    'digestion',
    'quick_vitals',
  ])

  // Verificação de pertencimento ao período filtrado
  const isDateInRange = (dateStr: string): boolean => {
    if (!dateRange?.from) return true
    const time = getSafeTime(dateStr)
    if (time === 0) return false

    const startTime = new Date(dateRange.from).setHours(0, 0, 0, 0)
    const endTime = dateRange.to
      ? new Date(dateRange.to).setHours(23, 59, 59, 999)
      : new Date(dateRange.from).setHours(23, 59, 59, 999)

    return time >= startTime && time <= endTime
  }

  // 4. PERFORMANCE ZERO LAG: useMemo puramente client-side para lista unificada
  const filteredEntries = useMemo<UnifiedHistoryEntry[]>(() => {
    const list: UnifiedHistoryEntry[] = []

    // Hidratação
    if (selectedMetrics.includes('hydration') && hydrationLogs) {
      hydrationLogs.forEach((log) => {
        if (!isDateInRange(log.date)) return
        list.push({
          id: `hyd-${log.id}`,
          date: log.date,
          timestamp: log.timestamp || `${log.date}T12:00:00Z`,
          category: 'hydration',
          title: 'Hidratação',
          value: `${log.amount} ml`,
          numericValue: log.amount,
          unit: 'ml',
          badge: 'Água',
          color: '#1CB0F6',
          details: 'Registro de água ingerida',
        })
      })
    }

    // Urina
    if (selectedMetrics.includes('urine') && urineLogs) {
      urineLogs.forEach((log) => {
        if (!isDateInRange(log.date)) return
        const scaleItem = URINE_SCALE.find((u) => u.type === log.colorType)
        const label = scaleItem ? scaleItem.label : `Tipo ${log.colorType}`
        list.push({
          id: `uri-${log.id}`,
          date: log.date,
          timestamp: log.timestamp || `${log.date}T12:00:00Z`,
          category: 'urine',
          title: `Urina - ${label}`,
          value: scaleItem?.label || `Tipo ${log.colorType}`,
          numericValue: log.colorType,
          badge: 'Urina',
          color: '#FFC800',
          details: scaleItem?.description || log.note || 'Escala de coloração',
        })
      })
    }

    // Digestão
    if (selectedMetrics.includes('digestion') && digestionLogs) {
      digestionLogs.forEach((log) => {
        if (!isDateInRange(log.date)) return
        const scaleItem = BRISTOL_SCALE.find((b) => b.type === log.bristolType)
        const label = scaleItem ? scaleItem.label : `Tipo ${log.bristolType}`
        list.push({
          id: `dig-${log.id}`,
          date: log.date,
          timestamp: log.timestamp || `${log.date}T12:00:00Z`,
          category: 'digestion',
          title: `Digestão - ${label}`,
          value: scaleItem?.label || `Tipo ${log.bristolType}`,
          numericValue: Number(log.bristolType),
          badge: 'Bristol',
          color: '#FF9600',
          details: scaleItem?.description || log.note || 'Escala de Bristol',
        })
      })
    }

    // Avaliação Rápida (dados em bodyMetrics: peso, altura, BPM, PA, glicose)
    if (selectedMetrics.includes('quick_vitals') && bodyMetrics) {
      bodyMetrics.forEach((bm: any) => {
        const dateStr = getSafeDayString(bm.date)
        if (!isDateInRange(dateStr)) return

        const timestamp = bm.created_at || `${dateStr}T12:00:00Z`

        if (bm.weight && Number(bm.weight) > 0) {
          list.push({
            id: `bm-${bm.id}-weight`,
            date: dateStr,
            timestamp,
            category: 'quick_vitals',
            title: 'Peso Corporal',
            value: `${bm.weight} kg`,
            numericValue: Number(bm.weight),
            unit: 'kg',
            badge: 'Peso',
            color: '#58CC02',
            details: 'Avaliação rápida de peso',
          })
        }

        if (bm.height && Number(bm.height) > 0) {
          list.push({
            id: `bm-${bm.id}-height`,
            date: dateStr,
            timestamp,
            category: 'quick_vitals',
            title: 'Altura / Estatura',
            value: `${bm.height} cm`,
            numericValue: Number(bm.height),
            unit: 'cm',
            badge: 'Altura',
            color: '#1CB0F6',
            details: 'Estatura aferida',
          })
        }

        const hr = bm.heart_rate_rest ?? bm.heartRateRest
        if (hr && Number(hr) > 0) {
          list.push({
            id: `bm-${bm.id}-hr`,
            date: dateStr,
            timestamp,
            category: 'quick_vitals',
            title: 'Frequência Cardíaca',
            value: `${hr} BPM`,
            numericValue: Number(hr),
            unit: 'BPM',
            badge: 'Cardíaco',
            color: '#FF4B4B',
            details: 'FC em repouso',
          })
        }

        const bp = bm.blood_pressure || bm.bloodPressure
        if (bp && String(bp).trim()) {
          list.push({
            id: `bm-${bm.id}-bp`,
            date: dateStr,
            timestamp,
            category: 'quick_vitals',
            title: 'Pressão Arterial',
            value: `${bp} mmHg`,
            unit: 'mmHg',
            badge: 'Pressão',
            color: '#0E8FCC',
            details: 'Aferição sistólica/diastólica',
          })
        }

        if (bm.glucose && Number(bm.glucose) > 0) {
          list.push({
            id: `bm-${bm.id}-gl`,
            date: dateStr,
            timestamp,
            category: 'quick_vitals',
            title: 'Glicose Sanguínea',
            value: `${bm.glucose} mg/dL`,
            numericValue: Number(bm.glucose),
            unit: 'mg/dL',
            badge: 'Glicose',
            color: '#CE82FF',
            details: 'Glicemia capilar',
          })
        }
      })
    }

    // Ordenar do mais recente para o mais antigo com guard de data segura
    return list.sort((a, b) => {
      const timeA = getSafeTime(a.timestamp)
      const timeB = getSafeTime(b.timestamp)
      return timeB - timeA
    })
  }, [hydrationLogs, urineLogs, digestionLogs, bodyMetrics, selectedMetrics, dateRange])

  // 5. PROCESSAMENTO SÍNCRONO PARA O RECHARTS: Agrupar por data (YYYY-MM-DD)
  const chartPoints = useMemo<UnifiedChartPoint[]>(() => {
    const map = new Map<string, UnifiedChartPoint>()

    // Função auxiliar para inicializar um ponto de data
    const getOrCreatePoint = (dateStr: string): UnifiedChartPoint => {
      const cleanDate = getSafeDayString(dateStr)
      if (!map.has(cleanDate)) {
        const safeDate = new Date(`${cleanDate}T00:00:00`)
        const formattedLabel = isNaN(safeDate.getTime())
          ? cleanDate
          : safeDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

        map.set(cleanDate, {
          date: formattedLabel,
          rawDate: cleanDate,
        })
      }
      return map.get(cleanDate)!
    }

    // Processar Hidratação (soma diária em ml)
    if (selectedMetrics.includes('hydration') && hydrationLogs) {
      hydrationLogs.forEach((log) => {
        const dayStr = getSafeDayString(log.date)
        if (!isDateInRange(dayStr)) return
        const pt = getOrCreatePoint(dayStr)
        pt.hydration = (pt.hydration || 0) + log.amount
      })
    }

    // Processar Urina (última do dia)
    if (selectedMetrics.includes('urine') && urineLogs) {
      const sortedUrine = [...urineLogs].sort(
        (a, b) => getSafeTime(a.timestamp) - getSafeTime(b.timestamp),
      )
      sortedUrine.forEach((log) => {
        const dayStr = getSafeDayString(log.date)
        if (!isDateInRange(dayStr)) return
        const pt = getOrCreatePoint(dayStr)
        pt.urineColor = log.colorType
        const scaleItem = URINE_SCALE.find((u) => u.type === log.colorType)
        pt.urineLabel = scaleItem?.label
      })
    }

    // Processar Digestão (última do dia)
    if (selectedMetrics.includes('digestion') && digestionLogs) {
      const sortedDig = [...digestionLogs].sort(
        (a, b) => getSafeTime(a.timestamp) - getSafeTime(b.timestamp),
      )
      sortedDig.forEach((log) => {
        const dayStr = getSafeDayString(log.date)
        if (!isDateInRange(dayStr)) return
        const pt = getOrCreatePoint(dayStr)
        pt.bristolType = Number(log.bristolType)
        const scaleItem = BRISTOL_SCALE.find((b) => b.type === log.bristolType)
        pt.bristolLabel = scaleItem?.label
      })
    }

    // Processar Avaliação Rápida (peso, altura, FC, glicose, PA)
    if (selectedMetrics.includes('quick_vitals') && bodyMetrics) {
      const sortedMetrics = [...bodyMetrics].sort(
        (a: any, b: any) => getSafeTime(a.date) - getSafeTime(b.date),
      )
      sortedMetrics.forEach((bm: any) => {
        const dayStr = getSafeDayString(bm.date)
        if (!isDateInRange(dayStr)) return
        const pt = getOrCreatePoint(dayStr)

        if (bm.weight && Number(bm.weight) > 0) pt.weight = Number(bm.weight)
        if (bm.height && Number(bm.height) > 0) pt.height = Number(bm.height)

        const hr = bm.heart_rate_rest ?? bm.heartRateRest
        if (hr && Number(hr) > 0) pt.heartRate = Number(hr)

        if (bm.glucose && Number(bm.glucose) > 0) pt.glucose = Number(bm.glucose)

        const bp = bm.blood_pressure || bm.bloodPressure
        if (bp && String(bp).includes('/')) {
          const parts = String(bp).split('/')
          const sys = parseInt(parts[0], 10)
          const dia = parseInt(parts[1], 10)
          if (!isNaN(sys)) pt.systolic = sys
          if (!isNaN(dia)) pt.diastolic = dia
        }
      })
    }

    // Ordenar cronologicamente para a curva do gráfico
    return Array.from(map.values()).sort((a, b) => {
      const timeA = getSafeTime(a.rawDate)
      const timeB = getSafeTime(b.rawDate)
      return timeA - timeB
    })
  }, [hydrationLogs, urineLogs, digestionLogs, bodyMetrics, selectedMetrics, dateRange])

  return (
    <div className="space-y-6">
      {/* Bloco de Controles e Filtros */}
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 shadow-sm space-y-4">
        {/* Topo do Painel de Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#3B4A55]/60">
          <div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>📊</span> Painel de Histórico
            </h3>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              Análise visual exclusiva dos seus registros de hoje e anteriores
            </p>
          </div>

          {/* Filtro 1: Calendário (DateRangePicker) */}
          <DateRangeFilter
            range={dateRange}
            onRangeChange={setDateRange}
            activePreset={activePreset}
            onPresetChange={setActivePreset}
          />
        </div>

        {/* Filtro 2: Multi-Métricas (ToggleGroup estilo Duolingo) */}
        <MetricToggleGroup selectedMetrics={selectedMetrics} onChange={setSelectedMetrics} />
      </div>

      {/* Gráfico de Evolução Dinâmico (Clone do Raio-X com Recharts 3.x) */}
      <DynamicEvolutionChart data={chartPoints} selectedMetrics={selectedMetrics} />

      {/* Lista / Linha do Tempo dos Registros */}
      <HistoryList entries={filteredEntries} />
    </div>
  )
}
