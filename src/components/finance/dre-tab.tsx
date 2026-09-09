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
import { TrendingUp, Layers } from 'lucide-react'

interface GroupItem {
  name: string
  value: number
  pct: number
}

export function DreTab() {
  const transactions = useFinanceStore((s) => s.transactions)
  const investments = useFinanceStore((s) => s.investments)
  const startDate = useFinanceStore((s) => s.financeDateRange.startDate)
  const endDate = useFinanceStore((s) => s.financeDateRange.endDate)

  const dre = useMemo(() => {
    // Competência mensal: todas as transações (incluindo parcelas futuras de compras) contam no mês da sua data
    const rangeTx = filterByDateRange(transactions, startDate, endDate)

    const fixedIncome = rangeTx.filter((t) => t.type === 'income' && t.isFixed)
    const variableIncome = rangeTx.filter((t) => t.type === 'income' && !t.isFixed)

    // Despesas fixas / operacionais
    const fixedExp = rangeTx.filter((t) => t.type === 'expense' && t.isFixed)

    // Despesas variáveis comuns
    const variableExp = rangeTx.filter(
      (t) => t.type === 'expense' && !t.isFixed && !t.isInstallment,
    )

    // Despesas comprometidas por parcelamento no período (competência)
    const installmentExp = rangeTx.filter((t) => t.type === 'expense' && t.isInstallment)

    const totalFixedIncome = fixedIncome.reduce((s, t) => s + t.amount, 0)
    const totalVariableIncome = variableIncome.reduce((s, t) => s + t.amount, 0)

    const totalFixedExp = fixedExp.reduce((s, t) => s + t.amount, 0)
    const totalVariableExp = variableExp.reduce((s, t) => s + t.amount, 0)
    const totalInstallmentExp = installmentExp.reduce((s, t) => s + t.amount, 0)

    const totalIncome = totalFixedIncome + totalVariableIncome
    const totalExpenses = totalFixedExp + totalVariableExp + totalInstallmentExp
    const operatingResult = totalIncome - totalExpenses

    // Linha de Investimentos no período de competência
    const rangeInvestments = investments.filter((inv) => {
      const d = new Date(inv.date + 'T00:00:00')
      const start = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T00:00:00')
      return d >= start && d <= end
    })

    const totalInvestedOutflow = rangeInvestments.reduce((s, i) => s + i.investedAmount, 0)
    const totalInvestmentEarnings = rangeInvestments.reduce(
      (s, i) => s + (i.currentAmount - i.investedAmount),
      0,
    )

    // Resultado final consolidado
    const netResultWithInvestments = operatingResult + totalInvestmentEarnings

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

    const groupInstallments = (txs: typeof rangeTx, base: number): GroupItem[] => {
      const map: Record<string, number> = {}
      txs.forEach((t) => {
        const key = `${t.description || t.category} (${t.installmentNumber || 1}/${t.totalInstallments || 1})`
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
      totalInstallmentExp,
      totalIncome,
      totalExpenses,
      operatingResult,
      totalInvestedOutflow,
      totalInvestmentEarnings,
      netResultWithInvestments,
      fixedIncomeGroups: groupBy(fixedIncome, totalFixedIncome),
      variableIncomeGroups: groupBy(variableIncome, totalVariableIncome),
      fixedExpGroups: groupBy(fixedExp, totalFixedExp),
      variableExpGroups: groupBy(variableExp, totalVariableExp),
      installmentGroups: groupInstallments(installmentExp, totalInstallmentExp),
    }
  }, [transactions, investments, startDate, endDate])

  const chartData = useMemo(
    () => [
      {
        name: 'Período',
        Receitas: dre.totalIncome,
        Despesas: dre.totalExpenses,
        'Aportes Investimentos': dre.totalInvestedOutflow,
      },
    ],
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
          <span className="text-sm font-bold truncate max-w-[240px]">{item.name}</span>
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
        <h3 className="font-extrabold text-lg mb-4">
          📊 Visão de Competência (Receitas, Despesas e Investimentos) — {periodLabel}
        </h3>
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
                <Bar dataKey="Aportes Investimentos" fill="#1CB0F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="rounded-3xl p-6 bg-card border border-b-4">
        <h3 className="font-extrabold text-lg mb-4">📋 DRE Gerencial Detalhado — {periodLabel}</h3>
        <Accordion
          type="multiple"
          defaultValue={[
            'fixedIncome',
            'variableIncome',
            'fixedExp',
            'variableExp',
            'installments',
            'investments',
          ]}
          className="space-y-2"
        >
          {/* RECEITAS FIXAS */}
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

          {/* RECEITAS VARIÁVEIS */}
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

          {/* SUBTOTAL RECEITAS */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/30">
            <span className="font-extrabold text-sm">(=) Receita Operacional Bruta</span>
            <span className="font-extrabold text-sm text-[#58CC02]">{fmt(dre.totalIncome)}</span>
          </div>

          {/* DESPESAS FIXAS */}
          <AccordionItem
            value="fixedExp"
            className="rounded-2xl bg-[#FF4B4B]/5 px-4 border border-[#FF4B4B]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm">(-) Despesas Fixas / Essenciais</span>
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

          {/* DESPESAS VARIÁVEIS */}
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

          {/* PARCELAS COMPROMETIDAS (NOVO) */}
          <AccordionItem
            value="installments"
            className="rounded-2xl bg-[#1CB0F6]/5 px-4 border border-[#1CB0F6]/20"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#1CB0F6]" /> (-) Parcelas Comprometidas no Mês
                </span>
                <span className="font-extrabold text-sm text-[#1CB0F6]">
                  {fmt(dre.totalInstallmentExp)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {renderGroup(dre.installmentGroups, 'text-[#1CB0F6]')}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-[#1CB0F6]/20">
                <span className="text-sm font-extrabold pl-6">Total Parcelas no Mês</span>
                <span className="text-sm font-extrabold text-[#1CB0F6]">
                  {fmt(dre.totalInstallmentExp)}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* RESULTADO OPERACIONAL */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/70 border">
            <span className="font-extrabold text-sm">
              (=) Resultado Operacional Antes de Investimentos
            </span>
            <span
              className={`font-extrabold text-sm ${dre.operatingResult >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
            >
              {fmt(dre.operatingResult)}
            </span>
          </div>

          {/* SEÇÃO / LINHA DE INVESTIMENTOS (NOVO) */}
          <AccordionItem
            value="investments"
            className="rounded-2xl bg-[#58CC02]/5 px-4 border border-[#58CC02]/30"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#58CC02]" /> (±) Investimentos (Aportes &
                  Rendimentos)
                </span>
                <span
                  className={`font-extrabold text-sm ${dre.totalInvestmentEarnings >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
                >
                  {dre.totalInvestmentEarnings >= 0 ? '+' : ''}
                  {fmt(dre.totalInvestmentEarnings)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between py-1.5 pl-6 pr-2 text-xs">
                  <span className="font-bold text-muted-foreground">
                    Aportes Realizados no Período (Saída de Caixa):
                  </span>
                  <span className="font-extrabold text-[#1CB0F6]">
                    -{fmt(dre.totalInvestedOutflow)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 pl-6 pr-2 text-xs">
                  <span className="font-bold text-muted-foreground">
                    Rendimento / Variação de Patrimônio no Período:
                  </span>
                  <span
                    className={`font-extrabold ${dre.totalInvestmentEarnings >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
                  >
                    {dre.totalInvestmentEarnings >= 0 ? '+' : ''}
                    {fmt(dre.totalInvestmentEarnings)}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* RESULTADO LÍQUIDO FINAL */}
        <div className="flex items-center justify-between p-4 mt-4 rounded-2xl bg-primary/10 border-2 border-primary">
          <span className="font-extrabold text-sm">(=) Resultado Líquido Consolidado do Mês</span>
          <span
            className={`font-extrabold text-lg ${dre.netResultWithInvestments >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}
          >
            {fmt(dre.netResultWithInvestments)}
          </span>
        </div>
      </div>

      {dre.operatingResult > 0 && (
        <div className="rounded-3xl p-6 bg-[#58CC02]/10 border-2 border-[#58CC02] text-center animate-fade-in-up">
          <p className="text-2xl font-extrabold text-[#58CC02]">
            Superávit financeiro no período! 🎉
          </p>
          <p className="text-sm font-bold text-muted-foreground mt-1">
            Você economizou {fmt(dre.operatingResult)} que podem ser destinados aos seus
            investimentos.
          </p>
        </div>
      )}
    </div>
  )
}
