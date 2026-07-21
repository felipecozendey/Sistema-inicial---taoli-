import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

export function EvolutionChart() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const patientGoals = useAppStore((s) => s.patientGoals)

  const chartData = useMemo(() => {
    return [...bodyMetrics]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        date: new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        weight: m.weight,
        height: m.height,
        leanMass: m.leanMass,
        fatMass:
          m.fatMass ??
          (m.weight && m.bodyFatPercentage
            ? Math.round(m.weight * (m.bodyFatPercentage / 100) * 10) / 10
            : undefined),
      }))
  }, [bodyMetrics])

  if (chartData.length === 0) return null

  const targetFatMass =
    patientGoals.targetWeight && patientGoals.targetBodyFat
      ? Math.round(patientGoals.targetWeight * (patientGoals.targetBodyFat / 100) * 10) / 10
      : 0

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-extrabold mb-4">Evolução Corporal</h3>
      <div className="h-64">
        <ChartContainer
          config={{
            weight: { label: 'Peso (kg)', color: '#1CB0F6' },
            height: { label: 'Altura (cm)', color: '#CE82FF' },
            leanMass: { label: 'Massa Magra (kg)', color: '#10b981' },
            fatMass: { label: 'Massa Gorda (kg)', color: '#FF9600' },
          }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1CB0F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1CB0F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="heightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CE82FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#CE82FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="leanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9600" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF9600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
              />
              {patientGoals.targetWeight > 0 && (
                <ReferenceLine
                  yAxisId="left"
                  y={patientGoals.targetWeight}
                  stroke="#1CB0F6"
                  strokeDasharray="5 5"
                  label={{ value: 'Meta', fontSize: 10, fill: '#1CB0F6' }}
                />
              )}
              {patientGoals.targetLeanMass > 0 && (
                <ReferenceLine
                  yAxisId="left"
                  y={patientGoals.targetLeanMass}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  label={{ value: 'Meta', fontSize: 10, fill: '#10b981' }}
                />
              )}
              {targetFatMass > 0 && (
                <ReferenceLine
                  yAxisId="left"
                  y={targetFatMass}
                  stroke="#FF9600"
                  strokeDasharray="5 5"
                  label={{ value: 'Meta', fontSize: 10, fill: '#FF9600' }}
                />
              )}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                name="Peso (kg)"
                stroke="#1CB0F6"
                strokeWidth={3}
                fill="url(#weightGradient)"
                dot={{ fill: '#1CB0F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="height"
                name="Altura (cm)"
                stroke="#CE82FF"
                strokeWidth={2}
                fill="url(#heightGradient)"
                dot={{ fill: '#CE82FF', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="leanMass"
                name="Massa Magra (kg)"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#leanGradient)"
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="fatMass"
                name="Massa Gorda (kg)"
                stroke="#FF9600"
                strokeWidth={3}
                fill="url(#fatGradient)"
                dot={{ fill: '#FF9600', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
