import { useMemo } from 'react'
import { useFinanceStore } from '@/stores/useFinanceStore'
import { formatCurrency, filterByDateRange, formatDateRangeLabel } from '@/lib/finance-utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const ESSENTIAL_CATEGORIES = [
  '🏠 Casa',
  '🍔 Alimentação',
  '🚗 Transporte',
  '💊 Saúde',
  '📚 Educação',
]

interface GroupItem {
  name: string
  value: number
  pct: number
}

export function DreTab() {
  const transactions = useFinanceStore((s) => s.transactions)
  const startDate = useFinanceStore((s) => s.financeDateRange.startDate)
  const endDate = useFinanceStore((s) => s.financeDateRange.endDate)

  const dre = useMemo(() => {
    const rangeTx = filterByDateRange(transactions, startDate, endDate)
    const incomes = rangeTx.filter((t) => t.type === 'income')
    const essentialExp = rangeTx.filter(
      (t) => t.type === 'expense' && ESSENTIAL_CATEGORIES.includes(t.category),
    )
    const variableExp = rangeTx.filter(
      (t) => t.type === 'expense' && !ESSENTIAL_CATEGORIES.includes(t.category),
    )

    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
    const totalEssential = essentialExp.reduce((s, t) => s + t.amount, 0)
    const totalVariable = variableExp.reduce((s, t) => s + t.amount, 0)

    const groupBy = (txs: typeof rangeTx, base: number): GroupItem[] => {
      const map: Record<string, number> = {}
      txs.forEach((t) => {
        const key = t.subcategory || t.category
        map[key] = (map[key] || 0) + t.amount
      })
      return Object.entries(map)
        .map(([name, value]) => ({
          name,
          value,
          pct: base > 0 ? (value / base) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)
    }

    return {
      totalIncome,
      totalEssential,
      totalVariable,
      netResult: totalIncome - totalEssential - totalVariable,
      totalExpenses: totalEssential + totalVariable,
      incomeGroups: groupBy(incomes, totalIncome),
      essentialGroups: groupBy(essentialExp, totalIncome),
      variableGroups: groupBy(variableExp, totalIncome),
    }
  }, [transactions, startDate, endDate])

  const chartData = useMemo(
    () => [{ name: 'Período', Receitas: dre.totalIncome, Despesas: dre.totalExpenses }],
    [dre],
  )

  const fmt = formatCurrency
  const periodLabel = formatDateRangeLabel(startDate, endDate)

  const renderGroup = (items: GroupItem[], color: string) => (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between py-2 pl-6 pr-2 rounded-lg hover:bg-muted/50"
        >
          <span className="text-sm font-bold">{item.name}</span>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-extrabold ${color}`}>{fmt(item.value)}</span>
            <span className="text-xs font-bold text-muted-foreground w-12 text-right">
              {item.pct.toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-6 bg-card border">
        <h3 className="font-extrabold text-lg mb-4">📊 Receitas vs Despesas — {periodLabel}</h3>
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

      <div className="rounded-3xl p-6 bg-card border border-b-4">
        <h3 className="font-extrabold text-lg mb-4">📋 DRE Clínico — {periodLabel}</h3>
        <Accordion
          type="multiple"
          defaultValue={['income', 'essential', 'variable']}
          className="space-y-2"
        >
          <AccordionItem
            value="income"
            className="rounded-2xl bg-[#58CC02]/5 px-4 border border-[#58CC02]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">(+) Receitas Brutas</span>
                <span className="font-extrabold text-sm text-[#58CC02]">
                  {fmt(dre.totalIncome)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.incomeGroups, 'text-[#58CC02]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#58CC02]/20">
                <span className="text-sm font-extrabold pl-6">Total Receitas</span>
                <span className="text-sm font-extrabold text-[#58CC02]">
                  {fmt(dre.totalIncome)} · 100%
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="essential"
            className="rounded-2xl bg-[#FF4B4B]/5 px-4 border border-[#FF4B4B]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">(-) Despesas Operacionais Fixas</span>
                <span className="font-extrabold text-sm text-[#FF4B4B]">
                  {fmt(dre.totalEssential)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.essentialGroups, 'text-[#FF4B4B]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#FF4B4B]/20">
                <span className="text-sm font-extrabold pl-6">Total Fixas</span>
                <span className="text-sm font-extrabold text-[#FF4B4B]">
                  {fmt(dre.totalEssential)} ·{' '}
                  {dre.totalIncome > 0
                    ? ((dre.totalEssential / dre.totalIncome) * 100).toFixed(1)
                    : '0'}
                  %
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="variable"
            className="rounded-2xl bg-[#FF9600]/5 px-4 border border-[#FF9600]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">
                  (-) Despesas Variáveis / Estilo de Vida
                </span>
                <span className="font-extrabold text-sm text-[#FF9600]">
                  {fmt(dre.totalVariable)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.variableGroups, 'text-[#FF9600]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#FF9600]/20">
                <span className="text-sm font-extrabold pl-6">Total Variáveis</span>
                <span className="text-sm font-extrabold text-[#FF9600]">
                  {fmt(dre.totalVariable)} ·{' '}
                  {dre.totalIncome > 0
                    ? ((dre.totalVariable / dre.totalIncome) * 100).toFixed(1)
                    : '0'}
                  %
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center justify-between p-4 mt-4 rounded-2xl bg-primary/10 border-2 border-primary">
          <span className="font-extrabold text-sm">(=) Resultado Líquido (Poupança Real)</span>
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
            Você teve um superávit de {fmt(dre.netResult)} no período.
          </p>
        </div>
      )}
    </div>
  )
}
