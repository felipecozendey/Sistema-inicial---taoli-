import { useState, useMemo } from 'react'
import { useMasterStore } from '@/stores/useMasterStore'
import { formatCurrency } from '@/lib/finance-utils'
import {
  TrendingUp,
  Search,
  DollarSign,
  PiggyBank,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  User,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function MasterGlobalFinanceTab() {
  const { globalFinance } = useMasterStore()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'balance' | 'income' | 'invested' | 'txCount'>('balance')

  const filteredData = useMemo(() => {
    const list = globalFinance.filter((row) => {
      return (
        row.email.toLowerCase().includes(search.toLowerCase()) ||
        (row.displayName && row.displayName.toLowerCase().includes(search.toLowerCase()))
      )
    })

    return list.sort((a, b) => {
      if (sortBy === 'balance') return b.balance - a.balance
      if (sortBy === 'income') return b.totalIncome - a.totalIncome
      if (sortBy === 'invested') return b.totalInvested - a.totalInvested
      if (sortBy === 'txCount') return b.transactionsCount - a.transactionsCount
      return 0
    })
  }, [globalFinance, search, sortBy])

  // Global totals across all users
  const globalTotals = useMemo(() => {
    let income = 0
    let expense = 0
    let invested = 0
    let txCount = 0

    globalFinance.forEach((g) => {
      income += g.totalIncome
      expense += g.totalExpense
      invested += g.totalInvested
      txCount += g.transactionsCount
    })

    const balance = income - expense
    return { income, expense, balance, invested, txCount }
  }, [globalFinance])

  return (
    <div className="space-y-6">
      {/* Global Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-2 border-b-4 border-b-[#58CC02]/40 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between text-[#58CC02] mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Receitas Totais
            </span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {formatCurrency(globalTotals.income)}
          </div>
          <span className="text-[11px] font-bold text-muted-foreground">
            Soma de todos usuários
          </span>
        </Card>

        <Card className="rounded-3xl border-2 border-b-4 border-b-rose-500/40 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Despesas Totais
            </span>
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {formatCurrency(globalTotals.expense)}
          </div>
          <span className="text-[11px] font-bold text-muted-foreground">Saídas registradas</span>
        </Card>

        <Card className="rounded-3xl border-2 border-b-4 border-b-[#1CB0F6]/40 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between text-[#1CB0F6] mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Saldo Líquido
            </span>
            <Wallet className="w-5 h-5" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${globalTotals.balance >= 0 ? 'text-[#58CC02]' : 'text-rose-500'}`}
          >
            {formatCurrency(globalTotals.balance)}
          </div>
          <span className="text-[11px] font-bold text-muted-foreground">
            Receitas menos despesas
          </span>
        </Card>

        <Card className="rounded-3xl border-2 border-b-4 border-b-amber-500/40 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Patrimônio Investido
            </span>
            <PiggyBank className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {formatCurrency(globalTotals.invested)}
          </div>
          <span className="text-[11px] font-bold text-muted-foreground">
            Total em investimentos
          </span>
        </Card>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário no financeiro..."
            className="pl-9 rounded-2xl border-2 h-11"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            Ordenar por:
          </span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="balance">Saldo Líquido (Maior)</option>
            <option value="income">Receitas (Maior)</option>
            <option value="invested">Patrimônio (Maior)</option>
            <option value="txCount">Nº Transações</option>
          </select>
        </div>
      </div>

      {/* Global Finance Table */}
      <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
        {filteredData.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <DollarSign className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
            <p className="font-extrabold text-foreground">Nenhum registro financeiro encontrado</p>
            <p className="text-xs text-muted-foreground">
              Nenhum usuário corresponde ao filtro digitado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Usuário</th>
                  <th className="py-3.5 px-4">Receitas</th>
                  <th className="py-3.5 px-4">Despesas</th>
                  <th className="py-3.5 px-4">Saldo Líquido</th>
                  <th className="py-3.5 px-4">Patrimônio Investido</th>
                  <th className="py-3.5 px-4 text-right">Lançamentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((row) => (
                  <tr key={row.userId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xs shrink-0">
                          {row.displayName
                            ? row.displayName.charAt(0).toUpperCase()
                            : row.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground text-sm truncate max-w-[180px]">
                            {row.displayName || row.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {row.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.totalIncome)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.totalExpense)}
                    </td>

                    <td className="py-3.5 px-4 font-black">
                      <span
                        className={
                          row.balance >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {formatCurrency(row.balance)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#1CB0F6]">
                      {formatCurrency(row.totalInvested)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-muted text-foreground">
                        {row.transactionsCount} txs
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
