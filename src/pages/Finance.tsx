import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-24">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight">💰 Finanças</h2>
        <p className="text-muted-foreground mt-1 font-semibold">
          Controle seu dinheiro, parcelamentos e investimentos com clareza e gamificação.
        </p>
      </header>

      <div className="rounded-3xl p-4 bg-card border space-y-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-[#1CB0F6]" />
          <span className="font-extrabold text-sm">Filtro de Período</span>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Data Inicial</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setFinanceDateRange({ startDate: e.target.value })}
              className="rounded-xl font-bold"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Data Final</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setFinanceDateRange({ endDate: e.target.value })}
              className="rounded-xl font-bold"
            />
          </div>
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
