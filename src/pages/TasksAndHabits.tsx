import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useTaskSettingsStore } from '@/stores/useTaskSettingsStore'
import { UnifiedCreateButton } from '@/components/unified-create-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TasksView } from '@/components/tasks/tasks-view'
import { HabitsView } from '@/components/tasks/habits-view'
import { GardenView } from '@/components/garden/GardenView'
import { TagManager } from '@/components/tags/tag-manager'
import { cn } from '@/lib/utils'
import { CheckSquare, Repeat, Clock, Flower2, Settings as SettingsIcon } from 'lucide-react'

export default function TasksAndHabits() {
  const { tags } = useAppStore()
  const { settings, fetchSettings } = useTaskSettingsStore()
  const [activeTab, setActiveTab] = useState<'garden' | 'tasks' | 'habits'>('tasks')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [nearDeadlineOnly, setNearDeadlineOnly] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Se show_garden for desligado enquanto estiver no jardim, volta para tasks
  const showGarden = settings.show_garden ?? true
  useEffect(() => {
    if (!showGarden && activeTab === 'garden') {
      setActiveTab('tasks')
    }
  }, [showGarden, activeTab])

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Tarefas e Hábitos</h2>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">
            Organize suas pendências, construa hábitos consistentes e cultive seu jardim.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botão de Configurações Duolingo 3D */}
          <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="h-11 px-3.5 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:text-foreground hover:bg-muted active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-2 font-bold text-xs shadow-sm"
                title="Configurações de Hábitos e Tarefas"
              >
                <SettingsIcon className="w-4 h-4 text-[#1CB0F6]" strokeWidth={2.5} />
                <span className="hidden sm:inline">Tags & Configurações</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 rounded-3xl overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
              <DialogHeader className="p-6 pb-2 border-b">
                <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center">
                    <SettingsIcon className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  Configurações de Hábitos e Tarefas
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 pt-4 max-h-[75vh] overflow-y-auto">
                <TagManager />
              </div>
            </DialogContent>
          </Dialog>

          <UnifiedCreateButton />
        </div>
      </div>

      {/* Tabs Principais com design Duolingo: Jardim (se ativo) vs Tarefas vs Hábitos */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'garden' | 'tasks' | 'habits')}
        className="w-full space-y-6"
      >
        <div className="flex justify-center">
          <TabsList
            className={cn(
              'grid w-full max-w-lg h-13 p-1.5 rounded-3xl bg-muted/60 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]',
              showGarden ? 'grid-cols-3' : 'grid-cols-2 max-w-md',
            )}
          >
            {showGarden && (
              <TabsTrigger
                value="garden"
                className={cn(
                  'rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200',
                  'data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#46A302] data-[state=active]:shadow-sm',
                )}
              >
                <Flower2 className="w-4 h-4" strokeWidth={2.5} />
                <span>Jardim</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="tasks"
              className={cn(
                'rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200',
                'data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#1899D6] data-[state=active]:shadow-sm',
              )}
            >
              <CheckSquare className="w-4 h-4" strokeWidth={2.5} />
              <span>Tarefas</span>
            </TabsTrigger>
            <TabsTrigger
              value="habits"
              className={cn(
                'rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200',
                'data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#46A302] data-[state=active]:shadow-sm',
              )}
            >
              <Repeat className="w-4 h-4" strokeWidth={2.5} />
              <span>Hábitos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Barra de Filtro de Tags / Categorias e Prazo Limite */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide items-center">
          {activeTab === 'tasks' && (
            <button
              type="button"
              onClick={() => setNearDeadlineOnly((v) => !v)}
              className={cn(
                'px-4 py-2 rounded-3xl text-xs font-black whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 select-none',
                nearDeadlineOnly
                  ? 'bg-[#FF4B4B] text-white border-b-4 border-[#CC3C3C] shadow-sm active:translate-y-1 active:border-b-0'
                  : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted active:translate-y-0.5 active:border-b-2',
              )}
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Prazo Limite</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className={cn(
              'px-4 py-2 rounded-3xl text-xs font-black whitespace-nowrap transition-all duration-150 select-none',
              selectedTags.length === 0
                ? 'bg-foreground text-background border-b-4 border-foreground/70 shadow-sm active:translate-y-1 active:border-b-0'
                : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted active:translate-y-0.5 active:border-b-2',
            )}
          >
            Todas Categorias
          </button>

          {tags.map((cat) => {
            const isSelected = selectedTags.includes(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleTag(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-3xl text-xs font-black whitespace-nowrap transition-all duration-150 border-2 border-b-4 select-none',
                  isSelected
                    ? 'shadow-sm active:translate-y-1 active:border-b-0'
                    : 'active:translate-y-0.5 active:border-b-2',
                )}
                style={{
                  backgroundColor: isSelected ? cat.color : `${cat.color}18`,
                  color: isSelected ? '#ffffff' : cat.color,
                  borderColor: isSelected ? `${cat.color}` : 'transparent',
                }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Conteúdo da Aba Jardim */}
        {showGarden && (
          <TabsContent value="garden" className="focus-visible:outline-none m-0">
            <GardenView />
          </TabsContent>
        )}

        {/* Conteúdo da Aba Tarefas */}
        <TabsContent value="tasks" className="focus-visible:outline-none m-0">
          <TasksView selectedTags={selectedTags} nearDeadlineOnly={nearDeadlineOnly} />
        </TabsContent>

        {/* Conteúdo da Aba Hábitos */}
        <TabsContent value="habits" className="focus-visible:outline-none m-0">
          <HabitsView selectedTags={selectedTags} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
