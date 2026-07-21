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
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useAppStore } from '@/stores/useAppStore'
import { format } from 'date-fns'

const chartConfig: ChartConfig = {
  heartRate: { label: 'BPM', color: 'hsl(0, 72%, 51%)' },
  systolic: { label: 'Sistólica', color: 'hsl(201, 94%, 57%)' },
  diastolic: { label: 'Diastólica', color: 'hsl(201, 94%, 40%)' },
  glucose: { label: 'Glicose', color: 'hsl(32, 95%, 44%)' },
}

export function VitalsChart() {
  const { bodyMetrics } = useAppStore()

  const chartData = useMemo(() => {
    if (!bodyMetrics?.length) return []
    return [...bodyMetrics]
      .filter((b: any) => b.heart_rate_rest || b.blood_pressure || b.glucose)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((b: any) => {
        const bp = b.blood_pressure ? String(b.blood_pressure).split('/') : []
        return {
          date: format(new Date(b.date), 'dd/MM'),
          heartRate: b.heart_rate_rest ?? null,
          glucose: b.glucose ? Number(b.glucose) : null,
          systolic: bp[0] ? parseInt(bp[0]) : null,
          diastolic: bp[1] ? parseInt(bp[1]) : null,
        }
      })
  }, [bodyMetrics])

  if (!chartData.length) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm font-bold">
        Nenhum dado vital registrado ainda.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="heartRate"
            stroke="var(--color-heartRate)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="var(--color-systolic)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="var(--color-diastolic)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="glucose"
            stroke="var(--color-glucose)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
