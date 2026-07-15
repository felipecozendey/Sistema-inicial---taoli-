import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransactionModal } from '@/components/finance/transaction-modal'
import { DashboardTab } from '@/components/finance/dashboard-tab'
import { TransactionsTab } from '@/components/finance/transactions-tab'
import { DreTab } from '@/components/finance/dre-tab'
import { PasswordsTab } from '@/components/finance/passwords-tab'
import { FinanceSettingsTab } from '@/components/finance/finance-settings-tab'
import { useAppStore } from '@/stores/useAppStore'
import { Plus } from 'lucide-react'

export default function FinancePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const fetchTransactions = useAppStore((s) => s.fetchTransactions)
  const fetchPasswords = useAppStore((s) => s.fetchPasswords)
  const fetchFinanceCategories = useAppStore((s) => s.fetchFinanceCategories)

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
