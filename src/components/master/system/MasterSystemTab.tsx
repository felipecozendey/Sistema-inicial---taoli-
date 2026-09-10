import { useEffect, useState } from 'react'
import { useSystemStore } from '@/stores/useSystemStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils, Dumbbell, RefreshCw, Server, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MasterFoodsSubTab } from './MasterFoodsSubTab'
import { MasterExercisesSubTab } from './MasterExercisesSubTab'
import { MasterTaskSettingsSubTab } from './MasterTaskSettingsSubTab'

export function MasterSystemTab() {
  const { loadSystemData, loading, globalFoods, globalExercises } = useSystemStore()
  const [subTab, setSubTab] = useState('foods')

  useEffect(() => {
    loadSystemData()
  }, [loadSystemData])

  return (
    <div className="space-y-6">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card border-2 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border-2 border-amber-500/30">
            <Server className="w-6 h-6" />
          </span>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-foreground">
              Ajustes do Sistema & Catálogos Globais
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Gerencie tabelas nutricionais oficiais (TACO), biblioteca de exercícios e parâmetros
              compartilhados do aplicativo
            </p>
          </div>
        </div>

        <Button
          onClick={() => loadSystemData()}
          disabled={loading}
          variant="outline"
          className="rounded-2xl h-11 px-4 font-bold border-2 hover:bg-muted active:scale-95 transition-all text-xs flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Catálogos</span>
        </Button>
      </div>

      {/* Sub-tabs Duolingo Style (Extensível para futuras páginas) */}
      <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full sm:w-auto p-1.5 rounded-2xl bg-muted/60 border-2 gap-1.5">
            <TabsTrigger
              value="foods"
              className="rounded-xl px-4 py-2 text-xs font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Utensils className="w-4 h-4" />
              <span>Tabelas Nutricionais</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 ml-0.5">
                {globalFoods.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="exercises"
              className="rounded-xl px-4 py-2 text-xs font-black transition-all data-[state=active]:bg-[#FF9600] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Exercícios</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 ml-0.5">
                {globalExercises.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="tasks-habits"
              className="rounded-xl px-4 py-2 text-xs font-black transition-all data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Hábitos e Tarefas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Sub-aba 1: Tabelas Nutricionais */}
        <TabsContent value="foods" className="mt-4">
          <MasterFoodsSubTab />
        </TabsContent>

        {/* Sub-aba 2: Exercícios */}
        <TabsContent value="exercises" className="mt-4">
          <MasterExercisesSubTab />
        </TabsContent>

        {/* Sub-aba 3: Hábitos e Tarefas */}
        <TabsContent value="tasks-habits" className="mt-4">
          <MasterTaskSettingsSubTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
