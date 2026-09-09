import { useState, useMemo, useEffect } from 'react'
import { useFinanceStore } from '@/stores/useFinanceStore'
import { cn } from '@/lib/utils'
import {
  formatCurrency,
  filterByDateRange,
  projectRecurringTransactions,
  getMonthKey,
  getMonthLabel,
  formatSafeDateBR,
} from '@/lib/finance-utils'
import {
  IncomeExpenseChart,
  ExpenseDistributionChart,
  IncomeDistributionChart,
  ExpensesByPaymentMethodChart,
} from '@/components/finance/finance-charts'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Pencil,
  Landmark,
  PiggyBank,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

export function DashboardTab() {
  const transactions = useFinanceStore((s) => s.transactions)
  const bankAccounts = useFinanceStore((s) => s.bankAccounts)
  const paymentMethods = useFinanceStore((s) => s.paymentMethods)
  const investments = useFinanceStore((s) => s.investments)
  const investmentGoals = useFinanceStore((s) => s.investmentGoals)

  const startDate = useFinanceStore((s) => s.financeDateRange.startDate)
  const endDate = useFinanceStore((s) => s.financeDateRange.endDate)

  const [budget, setBudget] = useState(() =>
    parseFloat(localStorage.getItem('vt_monthly_budget') || '3000'),
  )
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  useEffect(() => {
    localStorage.setItem('vt_monthly_budget', String(budget))
  }, [budget])

  const filteredTx = useMemo(
    () => filterByDateRange(transactions, startDate, endDate),
    [transactions, startDate, endDate],
  )

  const projectedTx = useMemo(
    () => projectRecurringTransactions(filteredTx, startDate, endDate),
    [filteredTx, startDate, endDate],
  )

  // Saldo por conta bancária em tempo real
  const accountsWithBalances = useMemo(() => {
    return bankAccounts.map((ba) => {
      const inc = transactions
        .filter((t) => t.bankAccountId === ba.id && t.type === 'income' && t.status === 'paid')
        .reduce((s, t) => s + t.amount, 0)
      const exp = transactions
        .filter((t) => t.bankAccountId === ba.id && t.type === 'expense' && t.status === 'paid')
        .reduce((s, t) => s + t.amount, 0)
      const currentBalance = ba.initialBalance + inc - exp
      return {
        ...ba,
        currentBalance,
      }
    })
  }, [bankAccounts, transactions])

  // Total consolidado em contas bancárias
  const totalInBankAccounts = useMemo(() => {
    return accountsWithBalances.reduce((s, a) => s + a.currentBalance, 0)
  }, [accountsWithBalances])

  // Resumo de investimentos e patrimônio
  const investmentsSummary = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0)
    const currentEquity = investments.reduce((s, i) => s + i.currentAmount, 0)
    const netReturn = currentEquity - totalInvested
    const returnPct = totalInvested > 0 ? (netReturn / totalInvested) * 100 : 0
    return {
      totalInvested,
      currentEquity,
      netReturn,
      returnPct,
    }
  }, [investments])

  // Progresso consolidado das metas de investimento
  const goalsProgressSummary = useMemo(() => {
    const totalTarget = investmentGoals.reduce((s, g) => s + g.targetAmount, 0)
    const totalAccumulated = investmentGoals.reduce((s, g) => s + g.currentAmount, 0)
    const pct = totalTarget > 0 ? Math.min((totalAccumulated / totalTarget) * 100, 100) : 0
    return {
      totalTarget,
      totalAccumulated,
      pct,
      count: investmentGoals.length,
    }
  }, [investmentGoals])

  // Parcelas a vencer no período (status pending e isInstallment = true)
  const pendingInstallmentsInPeriod = useMemo(() => {
    return filteredTx
      .filter((t) => t.isInstallment && t.status === 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredTx])

  const { balance, toReceive, toPay, periodExpenses, urgentReminders } = useMemo(() => {
    const paidIncome = filteredTx
      .filter((t) => t.type === 'income' && t.status === 'paid')
      .reduce((s, t) => s + t.amount, 0)
    const paidExpense = filteredTx
      .filter((t) => t.type === 'expense' && t.status === 'paid')
      .reduce((s, t) => s + t.amount, 0)
    const pendingIncome = filteredTx
      .filter((t) => t.type === 'income' && t.status === 'pending')
      .reduce((s, t) => s + t.amount, 0)
    const pendingExpense = filteredTx
      .filter((t) => t.type === 'expense' && t.status === 'pending')
      .reduce((s, t) => s + t.amount, 0)
    const periodExp = filteredTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const limit = new Date()
    limit.setDate(limit.getDate() + 3)
    limit.setHours(23, 59, 59, 999)

    const urgent = filteredTx.filter((t) => {
      if (t.status !== 'pending') return false
      const d = new Date(t.date + 'T00:00:00')
      return !isNaN(d.getTime()) && d >= today && d <= limit
    })

    return {
      balance: paidIncome - paidExpense,
      toReceive: pendingIncome,
      toPay: pendingExpense,
      periodExpenses: periodExp,
      urgentReminders: urgent,
    }
  }, [filteredTx])

  const projectionData = useMemo(() => {
    const pendingProjected = projectedTx.filter((t) => t.status === 'pending')
    const byMonth: Record<string, { label: string; Receber: number; Pagar: number }> = {}

    pendingProjected.forEach((t) => {
      const key = getMonthKey(t.date)
      if (!key) return
      if (!byMonth[key]) {
        byMonth[key] = { label: getMonthLabel(t.date), Receber: 0, Pagar: 0 }
      }
      if (t.type === 'income') byMonth[key].Receber += t.amount
      else byMonth[key].Pagar += t.amount
    })

    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)

    const totalReceive = pendingProjected
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
    const totalPay = pendingProjected
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    return { chart: sorted, totalReceive, totalPay }
  }, [projectedTx])

  const budgetPct = Math.min((periodExpenses / budget) * 100, 100)
  const budgetColor = budgetPct > 90 ? '#FF4B4B' : budgetPct > 70 ? '#FFC800' : '#58CC02'
  const fmt = formatCurrency

  const saveBudget = () => {
    const v = parseFloat(budgetInput)
    if (v > 0) setBudget(v)
    setEditingBudget(false)
    setBudgetInput('')
  }

  return (
    <div className="space-y-6">
      {/* 3 CARDS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl p-5 bg-[#1CB0F6] text-white border-b-4 border-[#1899D6]">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="font-bold text-sm opacity-90">Saldo em Contas (Período)</span>
          </div>
          <p className="text-2xl font-extrabold">{fmt(balance)}</p>
          {bankAccounts.length > 0 && (
            <p className="text-xs opacity-90 mt-1 font-semibold">
              Consolidado Bancário Real: {fmt(totalInBankAccounts)}
            </p>
          )}
        </div>
        <div className="rounded-3xl p-5 bg-[#58CC02] text-white border-b-4 border-[#46A302]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold text-sm opacity-90">A Receber</span>
          </div>
          <p className="text-2xl font-extrabold">{fmt(toReceive)}</p>
        </div>
        <div className="rounded-3xl p-5 bg-[#FF4B4B] text-white border-b-4 border-[#CC3B3B]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="font-bold text-sm opacity-90">A Pagar</span>
          </div>
          <p className="text-2xl font-extrabold">{fmt(toPay)}</p>
        </div>
      </div>

      {/* BLOCO NOVO: SALDOS POR CONTA BANCÁRIA */}
      {accountsWithBalances.length > 0 && (
        <div className="rounded-3xl p-6 bg-card border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#58CC02]" />
              <h3 className="font-extrabold text-lg">🏦 Saldos por Conta Bancária</h3>
            </div>
            <span className="text-xs font-extrabold text-[#58CC02] bg-[#58CC02]/10 px-3 py-1 rounded-full">
              Total: {fmt(totalInBankAccounts)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {accountsWithBalances.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-muted/40 border border-b-4 space-y-1"
                style={{ borderLeftWidth: 4, borderLeftColor: acc.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground">{acc.name}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: acc.color }}
                  />
                </div>
                <p className="text-lg font-extrabold text-foreground">{fmt(acc.currentBalance)}</p>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Inicial: {fmt(acc.initialBalance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BLOCO NOVO: TOTAL INVESTIDO VS PATRIMÔNIO ATUAL & METAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Investido vs Patrimônio Atual */}
        <div className="rounded-3xl p-6 bg-card border border-b-4 space-y-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#1CB0F6]" />
            <h3 className="font-extrabold text-base">📈 Patrimônio em Investimentos</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-muted/50">
              <p className="text-xs text-muted-foreground font-bold">Total Investido</p>
              <p className="text-lg font-extrabold">{fmt(investmentsSummary.totalInvested)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20">
              <p className="text-xs text-[#1CB0F6] font-bold">Patrimônio Atual</p>
              <p className="text-lg font-extrabold text-[#1CB0F6]">
                {fmt(investmentsSummary.currentEquity)}
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Rendimento Geral:</span>
            <span
              className={cn(
                'font-extrabold',
                investmentsSummary.netReturn >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]',
              )}
            >
              {investmentsSummary.netReturn >= 0 ? '+' : ''}
              {fmt(investmentsSummary.netReturn)} ({investmentsSummary.returnPct >= 0 ? '+' : ''}
              {investmentsSummary.returnPct.toFixed(2)}%)
            </span>
          </p>
        </div>

        {/* Progresso Consolidado das Metas */}
        <div className="rounded-3xl p-6 bg-card border border-b-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF9600]" />
              <h3 className="font-extrabold text-base">🎯 Metas Financeiras</h3>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {goalsProgressSummary.count} {goalsProgressSummary.count === 1 ? 'meta' : 'metas'}
            </span>
          </div>

          <div className="relative w-full h-7 rounded-2xl bg-muted/60 p-1 border border-border">
            <div
              className="h-full rounded-xl bg-[#58CC02] border-b-2 border-[#46A302] transition-all duration-500"
              style={{ width: `${Math.max(goalsProgressSummary.pct, 4)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold drop-shadow">
              {goalsProgressSummary.pct.toFixed(0)}% das metas atingidas
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-1">
            <span>Acumulado: {fmt(goalsProgressSummary.totalAccumulated)}</span>
            <span>Objetivo: {fmt(goalsProgressSummary.totalTarget)}</span>
          </div>
        </div>
      </div>

      {/* BLOCO NOVO: PARCELAS A VENCER NO MÊS / PERÍODO */}
      {pendingInstallmentsInPeriod.length > 0 && (
        <div className="rounded-3xl p-6 bg-card border border-b-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1CB0F6]" />
              <h3 className="font-extrabold text-lg">💳 Parcelas a Vencer no Período</h3>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#1CB0F6]/10 text-[#1CB0F6]">
              {pendingInstallmentsInPeriod.length}{' '}
              {pendingInstallmentsInPeriod.length === 1 ? 'parcela' : 'parcelas'}
            </span>
          </div>

          <div className="space-y-2">
            {pendingInstallmentsInPeriod.slice(0, 5).map((inst) => {
              const pm = paymentMethods.find((p) => p.id === inst.paymentMethodId)
              return (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{inst.category.split(' ')[0]}</span>
                    <div>
                      <p className="font-bold text-sm">
                        {inst.description || inst.category}{' '}
                        <span className="text-xs text-[#1CB0F6] font-extrabold ml-1">
                          (Parcela {inst.installmentNumber}/{inst.totalInstallments})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <span>📅 Vencimento: {formatSafeDateBR(inst.date)}</span>
                        {pm && <span>· 💳 {pm.name}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-[#FF4B4B]">-{fmt(inst.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ORÇAMENTO DO PERÍODO */}
      <div className="rounded-3xl p-6 bg-card border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg">📊 Orçamento do Período</h3>
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder={String(budget)}
                className="w-24 px-2 py-1 rounded-lg border text-sm font-bold"
              />
              <button
                type="button"
                onClick={saveBudget}
                className="px-3 py-1 rounded-lg bg-[#58CC02] text-white text-xs font-bold"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingBudget(true)
                setBudgetInput(String(budget))
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative w-full h-8 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
            style={{ width: `${budgetPct}%`, backgroundColor: budgetColor }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white drop-shadow">
            {fmt(periodExpenses)} / {fmt(budget)}
          </div>
        </div>
        <p className="text-sm font-bold text-muted-foreground">
          {budgetPct > 100
            ? '⚠️ Você estourou o orçamento!'
            : `${budgetPct.toFixed(0)}% do orçamento utilizado`}
        </p>
      </div>

      {/* PROGRAMAÇÃO & PROJEÇÃO FUTURA */}
      <div className="rounded-3xl p-6 bg-card border border-b-4 space-y-4">
        <h3 className="font-extrabold text-lg">🔮 Programação & Projeção Futura</h3>
        {projectionData.chart.length === 0 ? (
          <p className="text-sm font-bold text-muted-foreground text-center py-8">
            Sem projeções futuras no período.
          </p>
        ) : (
          <>
            <div className="h-56">
              <ChartContainer config={{}} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectionData.chart}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                      tickFormatter={(v) => `R$${v}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                      }}
                      formatter={(v: number) => fmt(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="Receber"
                      name="Previsto a Receber"
                      fill="#58CC02"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="Pagar"
                      name="Previsto a Pagar"
                      fill="#FF4B4B"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 bg-[#58CC02]/10 border border-[#58CC02]/30">
                <p className="text-xs font-bold text-muted-foreground">Total Previsto a Receber</p>
                <p className="text-xl font-extrabold text-[#58CC02]">
                  {fmt(projectionData.totalReceive)}
                </p>
              </div>
              <div className="rounded-2xl p-4 bg-[#FF4B4B]/10 border border-[#FF4B4B]/30">
                <p className="text-xs font-bold text-muted-foreground">Total Previsto a Pagar</p>
                <p className="text-xl font-extrabold text-[#FF4B4B]">
                  {fmt(projectionData.totalPay)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FLUXO RECEITAS VS DESPESAS COM APORTES DE INVESTIMENTOS */}
      <div className="rounded-3xl p-6 bg-card border">
        <h3 className="font-extrabold text-lg mb-4">
          📈 Fluxo Financeiro (Receitas, Despesas e Aportes)
        </h3>
        <IncomeExpenseChart
          transactions={filteredTx}
          startDate={startDate}
          endDate={endDate}
          investments={investments}
        />
      </div>

      {/* GRÁFICOS DE PIZZA & MÉTODOS DE PAGAMENTO */}
      <div className="rounded-3xl p-6 bg-card border space-y-6">
        <h3 className="font-extrabold text-lg">🥧 Segmentações & Distribuições</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-extrabold text-[#FF4B4B] mb-2 text-center">
              Despesas por Categoria
            </p>
            <ExpenseDistributionChart transactions={filteredTx} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#58CC02] mb-2 text-center">
              Receitas por Categoria
            </p>
            <IncomeDistributionChart transactions={filteredTx} />
          </div>
        </div>

        {paymentMethods.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-extrabold text-[#1CB0F6] mb-3 text-center">
              💳 Gastos por Método de Pagamento (Cartão, Pix, Boleto, etc.)
            </p>
            <ExpensesByPaymentMethodChart
              transactions={filteredTx}
              paymentMethods={paymentMethods}
            />
          </div>
        )}
      </div>

      {/* LEMBRANÇAS URGENTES */}
      <div className="rounded-3xl p-6 bg-card border space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[#FF4B4B]" />
          <h3 className="font-extrabold text-lg">⏰ Lembranças Urgentes (Próximos 3 dias)</h3>
        </div>
        {urgentReminders.length === 0 ? (
          <p className="text-sm font-bold text-muted-foreground py-4 text-center">
            Nenhuma cobrança urgente! 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {urgentReminders.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.category.split(' ')[0]}</span>
                  <div>
                    <p className="font-bold text-sm">
                      {t.description || t.category}
                      {t.isInstallment && (
                        <span className="text-xs text-[#1CB0F6] font-bold ml-1">
                          ({t.installmentNumber}/{t.totalInstallments})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatSafeDateBR(t.date)}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-extrabold text-sm',
                    t.type === 'income' ? 'text-[#58CC02]' : 'text-[#FF4B4B]',
                  )}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
