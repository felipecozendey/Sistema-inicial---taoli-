import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { MetabolicLog } from '@/stores/useAppStore'

const chartConfig = {
  tmb: { label: 'TMB (kcal)', color: '#1CB0F6' },
  venta: { label: 'VENTA (kcal)', color: '#58CC02' },
} satisfies ChartConfig

export function MetabolicEvolutionChart({ logs }: { logs: MetabolicLog[] }) {
  const chartData = useMemo(
    () =>
      logs
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((log) => ({
          date: new Date(log.date + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          tmb: log.tmb,
          venta: log.ventaTarget,
        })),
    [logs],
  )

  if (chartData.length === 0) {
    return (
      <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-8 text-center">
        <span className="text-3xl block mb-2">📊</span>
        <p className="text-sm font-bold text-muted-foreground">
          Nenhum dado metabólico para exibir no gráfico.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4">
      <p className="text-sm font-extrabold mb-3">📈 Evolução Metabólica</p>
      <ChartContainer config={chartConfig} className="w-full h-[280px]">
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line dataKey="tmb" stroke="var(--color-tmb)" strokeWidth={2} dot={{ r: 3 }} name="TMB" />
          <Line
            dataKey="venta"
            stroke="var(--color-venta)"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="VENTA"
          />
        </LineChart>
      </ChartContainer>
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#1CB0F6]" />
          <span className="text-[10px] font-bold">TMB</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#58CC02]" />
          <span className="text-[10px] font-bold">VENTA</span>
        </div>
      </div>
    </div>
  )
}
