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
    const fixedIncome = rangeTx.filter((t) => t.type === 'income' && t.isFixed)
    const variableIncome = rangeTx.filter((t) => t.type === 'income' && !t.isFixed)
    const fixedExp = rangeTx.filter((t) => t.type === 'expense' && t.isFixed)
    const variableExp = rangeTx.filter((t) => t.type === 'expense' && !t.isFixed)

    const totalFixedIncome = fixedIncome.reduce((s, t) => s + t.amount, 0)
    const totalVariableIncome = variableIncome.reduce((s, t) => s + t.amount, 0)
    const totalFixedExp = fixedExp.reduce((s, t) => s + t.amount, 0)
    const totalVariableExp = variableExp.reduce((s, t) => s + t.amount, 0)
    const totalIncome = totalFixedIncome + totalVariableIncome
    const totalExpenses = totalFixedExp + totalVariableExp
    const netResult = totalIncome - totalExpenses

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
      totalFixedIncome,
      totalVariableIncome,
      totalFixedExp,
      totalVariableExp,
      totalIncome,
      totalExpenses,
      netResult,
      fixedIncomeGroups: groupBy(fixedIncome, totalFixedIncome),
      variableIncomeGroups: groupBy(variableIncome, totalVariableIncome),
      fixedExpGroups: groupBy(fixedExp, totalFixedExp),
      variableExpGroups: groupBy(variableExp, totalVariableExp),
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
        <h3 className="font-extrabold text-lg mb-4">📋 DRE Profissional — {periodLabel}</h3>
        <Accordion
          type="multiple"
          defaultValue={['fixedIncome', 'variableIncome', 'fixedExp', 'variableExp']}
          className="space-y-2"
        >
          <AccordionItem
            value="fixedIncome"
            className="rounded-2xl bg-[#58CC02]/5 px-4 border border-[#58CC02]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">(+) Receitas Fixas</span>
                <span className="font-extrabold text-sm text-[#58CC02]">
                  {fmt(dre.totalFixedIncome)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.fixedIncomeGroups, 'text-[#58CC02]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#58CC02]/20">
                <span className="text-sm font-extrabold pl-6">Total Receitas Fixas</span>
                <span className="text-sm font-extrabold text-[#58CC02]">
                  {fmt(dre.totalFixedIncome)}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="variableIncome"
            className="rounded-2xl bg-[#82D936]/5 px-4 border border-[#82D936]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">(+) Receitas Variáveis</span>
                <span className="font-extrabold text-sm text-[#82D936]">
                  {fmt(dre.totalVariableIncome)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.variableIncomeGroups, 'text-[#82D936]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#82D936]/20">
                <span className="text-sm font-extrabold pl-6">Total Receitas Variáveis</span>
                <span className="text-sm font-extrabold text-[#82D936]">
                  {fmt(dre.totalVariableIncome)}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/30">
            <span className="font-extrabold text-sm">(=) Subtotal de Receitas</span>
            <span className="font-extrabold text-sm text-[#58CC02]">{fmt(dre.totalIncome)}</span>
          </div>

          <AccordionItem
            value="fixedExp"
            className="rounded-2xl bg-[#FF4B4B]/5 px-4 border border-[#FF4B4B]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">(-) Despesas Fixas / Operacionais</span>
                <span className="font-extrabold text-sm text-[#FF4B4B]">
                  {fmt(dre.totalFixedExp)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.fixedExpGroups, 'text-[#FF4B4B]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#FF4B4B]/20">
                <span className="text-sm font-extrabold pl-6">Total Despesas Fixas</span>
                <span className="text-sm font-extrabold text-[#FF4B4B]">
                  {fmt(dre.totalFixedExp)}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="variableExp"
            className="rounded-2xl bg-[#FF9600]/5 px-4 border border-[#FF9600]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">
                  (-) Despesas Variáveis / Estilo de Vida
                </span>
                <span className="font-extrabold text-sm text-[#FF9600]">
                  {fmt(dre.totalVariableExp)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.variableExpGroups, 'text-[#FF9600]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#FF9600]/20">
                <span className="text-sm font-extrabold pl-6">Total Despesas Variáveis</span>
                <span className="text-sm font-extrabold text-[#FF9600]">
                  {fmt(dre.totalVariableExp)}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center justify-between p-4 mt-4 rounded-2xl bg-primary/10 border-2 border-primary">
          <span className="font-extrabold text-sm">(=) Resultado Líquido do Mês</span>
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
