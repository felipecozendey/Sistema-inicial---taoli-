import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TransactionModal } from '@/components/finance/transaction-modal'
import { DashboardTab } from '@/components/finance/dashboard-tab'
import { TransactionsTab } from '@/components/finance/transactions-tab'
import { DreTab } from '@/components/finance/dre-tab'
import { PasswordsTab } from '@/components/finance/passwords-tab'
import { FinanceSettingsTab } from '@/components/finance/finance-settings-tab'
import { useAppStore } from '@/stores/useAppStore'
import { getMonthsAgoDate, getTodayDate } from '@/lib/finance-utils'
import { Plus, CalendarRange } from 'lucide-react'

const QUICK_RANGES = [
  { label: '1 Mês', months: 1 },
  { label: '3 Meses', months: 3 },
  { label: '6 Meses', months: 6 },
  { label: '1 Ano', months: 12 },
]

export default function FinancePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const fetchTransactions = useAppStore((s) => s.fetchTransactions)
  const fetchPasswords = useAppStore((s) => s.fetchPasswords)
  const fetchFinanceCategories = useAppStore((s) => s.fetchFinanceCategories)
  const financeDateRange = useAppStore((s) => s.financeDateRange)
  const setFinanceDateRange = useAppStore((s) => s.setFinanceDateRange)

  useEffect(() => {
    fetchTransactions()
    fetchPasswords()
    fetchFinanceCategories()
  }, [fetchTransactions, fetchPasswords, fetchFinanceCategories])

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-24">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight">💰 Finanças</h2>
        <p className="text-muted-foreground mt-1 font-semibold">
          Controle seu dinheiro com clareza e gamificação.
        </p>
      </header>

      <div className="rounded-3xl p-4 bg-card border space-y-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-[#1CB0F6]" />
          <span className="font-extrabold text-sm">Filtro de Período</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Data Inicial</Label>
            <Input
              type="date"
              value={financeDateRange.startDate}
              onChange={(e) => setFinanceDateRange({ startDate: e.target.value })}
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Data Final</Label>
            <Input
              type="date"
              value={financeDateRange.endDate}
              onChange={(e) => setFinanceDateRange({ endDate: e.target.value })}
              className="rounded-xl font-bold"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() =>
                setFinanceDateRange({
                  startDate: getMonthsAgoDate(range.months),
                  endDate: getTodayDate(),
                })
              }
              className="px-4 py-2 rounded-2xl bg-muted hover:bg-[#1CB0F6] hover:text-white text-sm font-extrabold border-b-4 border-muted-foreground/20 hover:border-[#1899D6] active:translate-y-0.5 active:border-b-2 transition-all duration-150"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-2xl">
          <TabsTrigger value="Dashboard" className="rounded-xl font-bold">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="Transactions" className="rounded-xl font-bold">
            Transações
          </TabsTrigger>
          <TabsTrigger value="DRE" className="rounded-xl font-bold">
            DRE
          </TabsTrigger>
          <TabsTrigger value="Senhas" className="rounded-xl font-bold">
            Senhas
          </TabsTrigger>
          <TabsTrigger value="Config" className="rounded-xl font-bold">
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Dashboard" className="mt-6">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="Transactions" className="mt-6">
          <TransactionsTab />
        </TabsContent>
        <TabsContent value="DRE" className="mt-6">
          <DreTab />
        </TabsContent>
        <TabsContent value="Senhas" className="mt-6">
          <PasswordsTab />
        </TabsContent>
        <TabsContent value="Config" className="mt-6">
          <FinanceSettingsTab />
        </TabsContent>
      </Tabs>

      {activeTab === 'Transactions' && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-30 flex items-center gap-2 px-5 py-4 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150 shadow-lg print:hidden"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          Nova Transação
        </button>
      )}

      <TransactionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
