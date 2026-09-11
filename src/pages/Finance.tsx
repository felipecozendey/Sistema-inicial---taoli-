import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { TransactionModal } from '@/components/finance/transaction-modal'
import { DashboardTab } from '@/components/finance/dashboard-tab'
import { TransactionsTab } from '@/components/finance/transactions-tab'
import { DreTab } from '@/components/finance/dre-tab'
import { InvestmentsTab } from '@/components/finance/investments-tab'
import { PasswordsTab } from '@/components/finance/passwords-tab'
import { FinanceSettingsTab } from '@/components/finance/finance-settings-tab'
import { useFinanceStore } from '@/stores/useFinanceStore'
import { Plus, CalendarRange } from 'lucide-react'

export default function FinancePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const fetchAllFinanceData = useFinanceStore((s) => s.fetchAllFinanceData)
  const startDate = useFinanceStore((s) => s.financeDateRange.startDate)
  const endDate = useFinanceStore((s) => s.financeDateRange.endDate)
  const setFinanceDateRange = useFinanceStore((s) => s.setFinanceDateRange)

  useEffect(() => {
    fetchAllFinanceData()
  }, [fetchAllFinanceData])

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in-up pb-24">
      <header>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">💰 Finanças</h2>
        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none">
          Controle seu dinheiro, parcelamentos e investimentos com clareza e gamificação.
        </p>
      </header>

      {/* Barra compacta de filtro de período */}
      <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-xs">
        <div
          className="flex items-center gap-1.5 text-muted-foreground shrink-0"
          title="Filtro de período"
        >
          <CalendarRange className="w-4 h-4 text-[#1CB0F6]" strokeWidth={2.5} />
          <span className="hidden sm:inline text-xs font-black text-foreground">Período:</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setFinanceDateRange({ startDate: e.target.value })}
            aria-label="Data Inicial"
            title="Data Inicial"
            className="h-9 w-1/2 min-w-0 rounded-xl font-bold text-xs px-2 sm:px-3 bg-muted/40 border-2"
          />
          <span className="text-xs text-muted-foreground font-black shrink-0">→</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setFinanceDateRange({ endDate: e.target.value })}
            aria-label="Data Final"
            title="Data Final"
            className="h-9 w-1/2 min-w-0 rounded-xl font-bold text-xs px-2 sm:px-3 bg-muted/40 border-2"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-2xl grid grid-cols-6 h-auto p-1.5">
          <TabsTrigger value="Dashboard" className="rounded-xl font-bold text-xs py-2">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="Transactions" className="rounded-xl font-bold text-xs py-2">
            Transações
          </TabsTrigger>
          <TabsTrigger value="Investimentos" className="rounded-xl font-bold text-xs py-2">
            Investimentos
          </TabsTrigger>
          <TabsTrigger value="DRE" className="rounded-xl font-bold text-xs py-2">
            DRE
          </TabsTrigger>
          <TabsTrigger value="Senhas" className="rounded-xl font-bold text-xs py-2">
            Senhas
          </TabsTrigger>
          <TabsTrigger value="Config" className="rounded-xl font-bold text-xs py-2">
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Dashboard" className="mt-6">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="Transactions" className="mt-6">
          <TransactionsTab />
        </TabsContent>
        <TabsContent value="Investimentos" className="mt-6">
          <InvestmentsTab />
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
          type="button"
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
