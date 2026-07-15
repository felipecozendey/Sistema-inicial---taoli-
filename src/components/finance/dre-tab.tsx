import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { formatCurrency } from '@/lib/finance-utils'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const ESSENTIAL_CATEGORIES = [
  '🏠 Casa',
  '🍔 Alimentação',
  '🚗 Transporte',
  '💊 Saúde',
  '📚 Educação',
]

export function DreTab() {
  const transactions = useAppStore((s) => s.transactions)

  const dre = useMemo(() => {
    const now = new Date()
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const essentialExpenses = monthTx
      .filter((t) => t.type === 'expense' && ESSENTIAL_CATEGORIES.includes(t.category))
      .reduce((s, t) => s + t.amount, 0)
    const freeExpenses = monthTx
      .filter((t) => t.type === 'expense' && !ESSENTIAL_CATEGORIES.includes(t.category))
      .reduce((s, t) => s + t.amount, 0)
    const netResult = totalIncome - essentialExpenses - freeExpenses

    return {
      totalIncome,
      essentialExpenses,
      freeExpenses,
      netResult,
      totalExpenses: essentialExpenses + freeExpenses,
    }
  }, [transactions])

  const chartData = [{ name: 'Mês Atual', Receitas: dre.totalIncome, Despesas: dre.totalExpenses }]
  const fmt = formatCurrency
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })

  const rows = [
    {
      label: 'Receitas Totais',
      value: dre.totalIncome,
      color: 'text-[#58CC02]',
      bg: 'bg-[#58CC02]/10',
    },
    {
      label: 'Despesas Essenciais',
      value: dre.essentialExpenses,
      color: 'text-[#FF4B4B]',
      bg: 'bg-[#FF4B4B]/10',
    },
    {
      label: 'Despesas Livres',
      value: dre.freeExpenses,
      color: 'text-[#FF4B4B]',
      bg: 'bg-[#FF4B4B]/5',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-6 bg-card border">
        <h3 className="font-extrabold text-lg mb-4">📊 Receitas vs Despesas — {monthName}</h3>
        <div className="h-56">
          <ChartContainer config={{}} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number) => fmt(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill="#58CC02" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Despesas" fill="#FF4B4B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="rounded-3xl p-6 bg-card border space-y-3">
        <h3 className="font-extrabold text-lg mb-4">📋 DRE Pessoal — {monthName}</h3>
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between p-4 rounded-2xl ${row.bg}`}
          >
            <span className="font-bold text-sm">{row.label}</span>
            <span className={`font-extrabold text-sm ${row.color}`}>{fmt(row.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border-2 border-primary">
          <span className="font-extrabold text-sm">Lucro / Prejuízo</span>
          <span
            className={`font-extrabold text-lg ${dre.netResult >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
          >
            {fmt(dre.netResult)}
          </span>
        </div>
      </div>

      {dre.netResult > 0 && (
        <div className="rounded-3xl p-6 bg-[#58CC02]/10 border-2 border-[#58CC02] text-center animate-fade-in-up">
          <p className="text-2xl font-extrabold text-[#58CC02]">
            Sobrou dinheiro para investir! 🎉
          </p>
          <p className="text-sm font-bold text-muted-foreground mt-1">
            Você teve um superávit de {fmt(dre.netResult)} este mês.
          </p>
        </div>
      )}
    </div>
  )
}
