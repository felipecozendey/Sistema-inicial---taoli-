import { useEffect, useState } from 'react'
import { useMasterStore } from '@/stores/useMasterStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ShieldCheck,
  Users,
  CreditCard,
  DollarSign,
  Sliders,
  History,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MasterOverviewTab } from '@/components/master/MasterOverviewTab'
import { MasterUsersTab } from '@/components/master/MasterUsersTab'
import { MasterBillingsTab } from '@/components/master/MasterBillingsTab'
import { MasterGlobalFinanceTab } from '@/components/master/MasterGlobalFinanceTab'
import { MasterFeaturesTab } from '@/components/master/MasterFeaturesTab'
import { SiteSettingsTab } from '@/components/master/site-settings-tab'
import { MasterAuditTab } from '@/components/master/MasterAuditTab'

export default function Master() {
  const { loadMasterData, loading } = useMasterStore()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadMasterData()
  }, [loadMasterData])

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border-2 border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Masterização
            </h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">
            Gestão centralizada de usuários, financeiro global, cobranças e módulos do sistema
          </p>
        </div>

        <Button
          onClick={() => loadMasterData()}
          disabled={loading}
          variant="outline"
          className="rounded-2xl h-11 px-4 font-bold border-2 hover:bg-muted active:scale-95 transition-all text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </Button>
      </header>

      {/* Tabs Duolingo Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full sm:w-auto p-1.5 rounded-2xl bg-muted/60 border-2 gap-1">
            <TabsTrigger
              value="overview"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>

            <TabsTrigger
              value="users"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>

            <TabsTrigger
              value="billings"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#FFC800] data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              Cobranças
            </TabsTrigger>

            <TabsTrigger
              value="finance"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              Financeiro Global
            </TabsTrigger>

            <TabsTrigger
              value="features"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#CE82FF] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4" />
              Features
            </TabsTrigger>

            <TabsTrigger
              value="site"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Site & Login
            </TabsTrigger>

            <TabsTrigger
              value="audit"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              Auditoria
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Visão Geral */}
        <TabsContent value="overview" className="mt-6">
          <MasterOverviewTab
            onGoToUsers={() => setActiveTab('users')}
            onGoToAudit={() => setActiveTab('audit')}
          />
        </TabsContent>

        {/* Tab 2: Usuários */}
        <TabsContent value="users" className="mt-6">
          <MasterUsersTab />
        </TabsContent>

        {/* Tab 3: Cobranças */}
        <TabsContent value="billings" className="mt-6">
          <MasterBillingsTab />
        </TabsContent>

        {/* Tab 4: Financeiro Global */}
        <TabsContent value="finance" className="mt-6">
          <MasterGlobalFinanceTab />
        </TabsContent>

        {/* Tab 5: Feature Flags */}
        <TabsContent value="features" className="mt-6">
          <MasterFeaturesTab />
        </TabsContent>

        {/* Tab 6: Site & Login */}
        <TabsContent value="site" className="mt-6">
          <SiteSettingsTab />
        </TabsContent>

        {/* Tab 7: Auditoria */}
        <TabsContent value="audit" className="mt-6">
          <MasterAuditTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
