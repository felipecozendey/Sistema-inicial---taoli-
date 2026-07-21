import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

const chartConfig = {
  muscular: { label: 'Muscular', color: '#1CB0F6' },
  adiposo: { label: 'Adiposo', color: '#FF9600' },
  osseo: { label: 'Ósseo', color: '#CE82FF' },
  residual: { label: 'Residual', color: '#58CC02' },
} satisfies ChartConfig

interface CompartmentData {
  kg: number
  percent: number
}

interface Props {
  muscular: CompartmentData
  adiposo: CompartmentData
  osseo: CompartmentData
  residual: CompartmentData
}

export function FourCompartmentChart({ muscular, adiposo, osseo, residual }: Props) {
  const data = [
    { name: 'Muscular', value: muscular.kg, percent: muscular.percent, fill: '#1CB0F6' },
    { name: 'Adiposo', value: adiposo.kg, percent: adiposo.percent, fill: '#FF9600' },
    { name: 'Ósseo', value: osseo.kg, percent: osseo.percent, fill: '#CE82FF' },
    { name: 'Residual', value: residual.kg, percent: residual.percent, fill: '#58CC02' },
  ].filter((d) => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <ChartContainer config={chartConfig} className="h-48 w-48 shrink-0">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-card border-2 rounded-xl p-2 shadow-lg">
                  <p className="font-extrabold text-sm" style={{ color: d.fill }}>
                    {d.name}
                  </p>
                  <p className="text-xs font-bold">
                    {d.value.toFixed(1)} kg ({d.percent.toFixed(1)}%)
                  </p>
                </div>
              )
            }}
          />
        </PieChart>
      </ChartContainer>
      <div className="grid grid-cols-2 gap-2 w-full">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 bg-muted/30 rounded-xl p-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{d.name}</p>
              <p className="text-xs font-extrabold" style={{ color: d.fill }}>
                {d.value.toFixed(1)} kg · {d.percent.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
