import { useEffect, useState } from 'react'
import { useAiStore } from '@/stores/useAiStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Sparkles, BarChart3, KeyRound, Sliders, Gauge, Coins, RefreshCw } from 'lucide-react'
import { AiOverviewSubTab } from './AiOverviewSubTab'
import { AiProvidersSubTab } from './AiProvidersSubTab'
import { AiFeaturesSubTab } from './AiFeaturesSubTab'
import { AiQuotasSubTab } from './AiQuotasSubTab'
import { AiPricingSubTab } from './AiPricingSubTab'

export function MasterAiTab() {
  const { config, providers, pricing, logs, loading, testingProvider, loadAiData } = useAiStore()

  const [activeSubTab, setActiveSubTab] = useState('overview')

  useEffect(() => {
    loadAiData()
  }, [loadAiData])

  return (
    <div className="space-y-6">
      {/* Sub-Header da Aba de IA Duolingo Style */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#58CC02]/10 text-[#58CC02] border-2 border-[#58CC02]/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Infraestrutura de IA
            </h2>
          </div>
          <p className="text-muted-foreground text-xs font-semibold">
            Central de configuração de motores de IA, chaves seguras, quotas e monitoramento de
            gastos
          </p>
        </div>

        <Button
          onClick={() => loadAiData()}
          disabled={loading}
          variant="outline"
          className="rounded-2xl h-10 px-4 font-bold border-2 hover:bg-muted active:scale-95 transition-all text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          <span>Sincronizar IA</span>
        </Button>
      </div>

      {/* Sub-navegação interna com Tabs Duolingo */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full sm:w-auto p-1.5 rounded-2xl bg-muted/60 border-2 gap-1">
            <TabsTrigger
              value="overview"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              Visão Geral & Gastos
            </TabsTrigger>

            <TabsTrigger
              value="providers"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              Provedores & Chaves
            </TabsTrigger>

            <TabsTrigger
              value="features"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#CE82FF] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4" />
              Recursos & Acesso
            </TabsTrigger>

            <TabsTrigger
              value="quotas"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#FF9600] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <Gauge className="w-4 h-4" />
              Quotas
            </TabsTrigger>

            <TabsTrigger
              value="pricing"
              className="rounded-xl px-3.5 py-2 text-xs font-black transition-all data-[state=active]:bg-[#FFC800] data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              Tabela de Preços
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Visão Geral / Gastos */}
        <TabsContent value="overview" className="mt-6">
          <AiOverviewSubTab logs={logs} loading={loading} />
        </TabsContent>

        {/* 2. Provedores & Chaves */}
        <TabsContent value="providers" className="mt-6">
          <AiProvidersSubTab providers={providers} testingProvider={testingProvider} />
        </TabsContent>

        {/* 3. Recursos & Acesso */}
        <TabsContent value="features" className="mt-6">
          <AiFeaturesSubTab config={config} />
        </TabsContent>

        {/* 4. Quotas */}
        <TabsContent value="quotas" className="mt-6">
          <AiQuotasSubTab config={config} />
        </TabsContent>

        {/* 5. Tabela de Preços */}
        <TabsContent value="pricing" className="mt-6">
          <AiPricingSubTab pricing={pricing} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
