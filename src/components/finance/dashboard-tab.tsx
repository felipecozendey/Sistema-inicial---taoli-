import { useState, useMemo, useEffect } from 'react'
import { useFinanceStore } from '@/stores/useFinanceStore'
import { cn } from '@/lib/utils'
import { formatCurrency, filterByDateRange } from '@/lib/finance-utils'
import { IncomeExpenseChart, ExpenseDistributionChart } from '@/components/finance/finance-charts'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Pencil } from 'lucide-react'

export function DashboardTab() {
  const transactions = useFinanceStore((s) => s.transactions)
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
      return d >= today && d <= limit
    })
    return {
      balance: paidIncome - paidExpense,
      toReceive: pendingIncome,
      toPay: pendingExpense,
      periodExpenses: periodExp,
      urgentReminders: urgent,
    }
  }, [filteredTx])

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl p-5 bg-[#1CB0F6] text-white border-b-4 border-[#1899D6]">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="font-bold text-sm opacity-90">Saldo em Contas</span>
          </div>
          <p className="text-2xl font-extrabold">{fmt(balance)}</p>
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
                onClick={saveBudget}
                className="px-3 py-1 rounded-lg bg-[#58CC02] text-white text-xs font-bold"
              >
                OK
              </button>
            </div>
          ) : (
            <button
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

      <div className="rounded-3xl p-6 bg-card border">
        <h3 className="font-extrabold text-lg mb-4">📈 Receitas vs Despesas</h3>
        <IncomeExpenseChart transactions={filteredTx} startDate={startDate} endDate={endDate} />
      </div>

      <div className="rounded-3xl p-6 bg-card border">
        <h3 className="font-extrabold text-lg mb-4">🥧 Distribuição de Despesas</h3>
        <ExpenseDistributionChart transactions={filteredTx} />
      </div>

      <div className="rounded-3xl p-6 bg-card border space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[#FF4B4B]" />
          <h3 className="font-extrabold text-lg">⏰ Lembranças Urgentes</h3>
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
                    <p className="font-bold text-sm">{t.description || t.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
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
