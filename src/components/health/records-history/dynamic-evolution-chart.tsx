import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { HealthMetricCategory, UnifiedChartPoint } from './types'
import { Droplets, AlertCircle } from 'lucide-react'

interface DynamicEvolutionChartProps {
  data: UnifiedChartPoint[]
  selectedMetrics: HealthMetricCategory[]
}

export function DynamicEvolutionChart({ data, selectedMetrics }: DynamicEvolutionChartProps) {
  // Determine which series should be displayed based on granular selectedMetrics
  const showHeartRate = selectedMetrics.includes('heart_rate')
  const showBloodPressure = selectedMetrics.includes('blood_pressure')
  const showGlucose = selectedMetrics.includes('glucose')
  const showWeight = selectedMetrics.includes('weight')
  const showHeight = selectedMetrics.includes('height')
  const showHydration = selectedMetrics.includes('hydration')
  const showUrine = selectedMetrics.includes('urine')
  const showDigestion = selectedMetrics.includes('digestion')

  // Check if there is any data to plot for the selected metrics
  const hasPlotData = useMemo(() => {
    if (!data.length) return false
    return data.some((point) => {
      if (showHydration && point.hydration !== undefined) return true
      if (showUrine && point.urineColor !== undefined) return true
      if (showDigestion && point.bristolType !== undefined) return true
      if (showWeight && point.weight !== undefined) return true
      if (showHeight && point.height !== undefined) return true
      if (showHeartRate && point.heartRate !== undefined) return true
      if (showGlucose && point.glucose !== undefined) return true
      if (showBloodPressure && (point.systolic !== undefined || point.diastolic !== undefined))
        return true
      return false
    })
  }, [
    data,
    showHydration,
    showUrine,
    showDigestion,
    showWeight,
    showHeight,
    showHeartRate,
    showGlucose,
    showBloodPressure,
  ])

  if (!selectedMetrics.length) {
    return (
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center py-10">
        <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm font-extrabold text-foreground">Nenhuma métrica selecionada</p>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Ative ao menos uma métrica nas pílulas acima para visualizar a evolução gráfica.
        </p>
      </div>
    )
  }

  if (!hasPlotData) {
    return (
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center py-10">
        <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/10 flex items-center justify-center mb-3">
          <Droplets className="w-6 h-6 text-[#1CB0F6]" />
        </div>
        <p className="text-sm font-extrabold text-foreground">Sem dados suficientes no período</p>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Nenhum registro encontrado para as métricas selecionadas nesse intervalo de datas.
        </p>
      </div>
    )
  }

  // Eixos Y independentes para escalas diferentes:
  // left: Hidratação (ml, 0-4000), Peso (kg), Altura (cm), FC (bpm), PA (mmHg), Glicose (mg/dL)
  // scale: Escalas discretas Urina (1-6) e Bristol (1-7)
  const hasScaleMetrics = showUrine || showDigestion

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="text-base sm:text-lg font-black tracking-tight">Evolução dos Registros</h3>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
          {data.length} {data.length === 1 ? 'dia com registro' : 'dias com registros'}
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            {/* Eixo Esquerdo: Valores contínuos (bpm, mmHg, mg/dL, kg, cm, ml) */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            {/* Eixo Direito: Escalas discretas (Urina 1-6 e Bristol 1-7) */}
            <YAxis
              yAxisId="scale"
              orientation="right"
              domain={[1, 7]}
              ticks={[1, 2, 3, 4, 5, 6, 7]}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
              hide={!hasScaleMetrics}
            />

            <Tooltip content={<CustomHealthTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }}
              iconType="circle"
            />

            {/* Frequência Cardíaca (bpm) */}
            {showHeartRate && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="heartRate"
                name="Freq. Cardíaca (bpm)"
                stroke="#FF4B4B"
                strokeWidth={2.5}
                dot={{ fill: '#FF4B4B', r: 3.5 }}
                activeDot={{ r: 5.5 }}
                connectNulls
              />
            )}

            {/* Pressão Arterial - Sistólica (mmHg) */}
            {showBloodPressure && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="systolic"
                name="PA Sistólica (mmHg)"
                stroke="#0E8FCC"
                strokeWidth={2}
                dot={{ fill: '#0E8FCC', r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )}

            {/* Pressão Arterial - Diastólica (mmHg) */}
            {showBloodPressure && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="diastolic"
                name="PA Diastólica (mmHg)"
                stroke="#0A6A99"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ fill: '#0A6A99', r: 2.5 }}
                activeDot={{ r: 4.5 }}
                connectNulls
              />
            )}

            {/* Glicose (mg/dL) */}
            {showGlucose && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="glucose"
                name="Glicose (mg/dL)"
                stroke="#CE82FF"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ fill: '#CE82FF', r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )}

            {/* Peso (kg) */}
            {showWeight && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                name="Peso (kg)"
                stroke="#58CC02"
                strokeWidth={3}
                dot={{ fill: '#58CC02', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}

            {/* Altura (cm) */}
            {showHeight && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="height"
                name="Altura (cm)"
                stroke="#1CB0F6"
                strokeWidth={2}
                dot={{ fill: '#1CB0F6', r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )}

            {/* Hidratação (ml) */}
            {showHydration && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hydration"
                name="Hidratação (ml)"
                stroke="#1CB0F6"
                strokeWidth={3}
                dot={{ fill: '#1CB0F6', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}

            {/* Urina (Escala 1-6) */}
            {showUrine && (
              <Line
                yAxisId="scale"
                type="monotone"
                dataKey="urineColor"
                name="Urina (Escala 1-6)"
                stroke="#FFC800"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ fill: '#FFC800', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}

            {/* Digestão (Escala Bristol 1-7) */}
            {showDigestion && (
              <Line
                yAxisId="scale"
                type="monotone"
                dataKey="bristolType"
                name="Digestão (Bristol 1-7)"
                stroke="#FF9600"
                strokeWidth={2.5}
                dot={{ fill: '#FF9600', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CustomHealthTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const point: UnifiedChartPoint | undefined = payload[0]?.payload

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3 shadow-xl text-xs space-y-2 min-w-[200px]">
      <p className="font-black text-foreground border-b border-muted pb-1">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item: any) => {
          let extraInfo = ''
          if (item.dataKey === 'urineColor' && point?.urineLabel) {
            extraInfo = ` (${point.urineLabel})`
          } else if (item.dataKey === 'bristolType' && point?.bristolLabel) {
            extraInfo = ` (${point.bristolLabel})`
          } else if (item.dataKey === 'systolic' && point?.diastolic) {
            extraInfo = ` / ${point.diastolic} mmHg`
          }

          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: item.color }}>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-black text-foreground">
                {item.value}
                {extraInfo}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
