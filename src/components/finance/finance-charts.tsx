import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/finance-utils'
import type { Transaction } from '@/stores/useAppStore'

const PIE_COLORS = [
  '#FF4B4B',
  '#FF9600',
  '#CE82FF',
  '#1CB0F6',
  '#FFC800',
  '#58CC02',
  '#FF6B6B',
  '#4ECDC4',
  '#95E1D3',
  '#AA96DA',
]

interface ChartProps {
  transactions: Transaction[]
  startDate: string
  endDate: string
}

export function IncomeExpenseChart({ transactions, startDate, endDate }: ChartProps) {
  const data = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    const sameMonth =
      start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
    const points: { key: string; label: string; Receitas: number; Despesas: number }[] = []

    if (sameMonth) {
      const cur = new Date(start)
      while (cur <= end) {
        const key = cur.toISOString().split('T')[0]
        points.push({ key, label: String(cur.getDate()), Receitas: 0, Despesas: 0 })
        cur.setDate(cur.getDate() + 1)
      }
    } else {
      const cur = new Date(start.getFullYear(), start.getMonth(), 1)
      while (cur <= end) {
        const key = `${cur.getFullYear()}-${cur.getMonth()}`
        points.push({
          key,
          label: cur.toLocaleDateString('pt-BR', { month: 'short' }),
          Receitas: 0,
          Despesas: 0,
        })
        cur.setMonth(cur.getMonth() + 1)
      }
    }

    transactions.forEach((t) => {
      const d = new Date(t.date + 'T00:00:00')
      const key = sameMonth ? d.toISOString().split('T')[0] : `${d.getFullYear()}-${d.getMonth()}`
      const pt = points.find((p) => p.key === key)
      if (pt) {
        if (t.type === 'income') pt.Receitas += t.amount
        else pt.Despesas += t.amount
      }
    })
    return points
  }, [transactions, startDate, endDate])

  return (
    <div className="h-64">
      <ChartContainer config={{}} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#58CC02" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#58CC02" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4B4B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF4B4B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="Receitas"
              stroke="#58CC02"
              strokeWidth={2}
              fill="url(#gradIncome)"
            />
            <Area
              type="monotone"
              dataKey="Despesas"
              stroke="#FF4B4B"
              strokeWidth={2}
              fill="url(#gradExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

export function ExpenseDistributionChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const byCat: Record<string, number> = {}
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        byCat[t.category] = (byCat[t.category] || 0) + t.amount
      })
    return Object.entries(byCat).map(([name, value]) => ({ name, value }))
  }, [transactions])

  if (data.length === 0) {
    return (
      <p className="text-sm font-bold text-muted-foreground text-center py-8">
        Sem despesas no período
      </p>
    )
  }

  return (
    <div className="h-64">
      <ChartContainer config={{}} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(e: any) => e.name}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
