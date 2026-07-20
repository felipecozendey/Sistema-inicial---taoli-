import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

const chartConfig = {
  carbs: { label: 'Carb', color: '#FFC800' },
  protein: { label: 'Prot', color: '#FF4B4B' },
  fat: { label: 'Gord', color: '#1CB0F6' },
} satisfies ChartConfig

interface Props {
  carbsG: number
  proteinG: number
  fatG: number
  size?: number
}

export function MacroPieChart({ carbsG, proteinG, fatG, size = 72 }: Props) {
  const data = [
    { name: 'Carb', value: Math.max(carbsG, 0), fill: '#FFC800' },
    { name: 'Prot', value: Math.max(proteinG, 0), fill: '#FF4B4B' },
    { name: 'Gord', value: Math.max(fatG, 0), fill: '#1CB0F6' },
  ].filter((d) => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-4 border-muted flex items-center justify-center shrink-0"
      >
        <span className="text-[9px] font-bold text-muted-foreground">∅</span>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} style={{ height: size, width: size }} className="shrink-0">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={size * 0.22}
          outerRadius={size * 0.42}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
