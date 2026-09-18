import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { useTaskSettingsStore } from '@/stores/useTaskSettingsStore'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'
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
import { StudiesPanel } from '@/components/studies/studies-panel'
import { TagManager } from '@/components/tags/tag-manager'
import { cn } from '@/lib/utils'
import {
  CheckSquare,
  Repeat,
  Clock,
  Flower2,
  GraduationCap,
  Settings as SettingsIcon,
} from 'lucide-react'

type TabKey = 'estudos' | 'jardim' | 'tarefas' | 'habitos'

export default function TasksAndHabits() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { tags, fetchTasks, fetchHabits } = useAppStore()
  const { settings, fetchSettings } = useTaskSettingsStore()
  const isFeatureEnabled = useFeatureFlagsStore((s) => s.isEnabled)

  const studiesEnabled = isFeatureEnabled('studies')
  const showGarden = settings.show_garden ?? true

  // Resolver aba inicial a partir do deep link ?tab=
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase()
    if (tabParam === 'estudos') {
      return studiesEnabled ? 'estudos' : 'tarefas'
    }
    if (tabParam === 'jardim') {
      return showGarden ? 'jardim' : 'tarefas'
    }
    if (tabParam === 'tarefas') return 'tarefas'
    if (tabParam === 'habitos') return 'habitos'
    return 'tarefas'
  })

  // Preservar ID da nota em edição para persistência ao alternar abas
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [nearDeadlineOnly, setNearDeadlineOnly] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchTasks()
    fetchHabits()
  }, [fetchSettings, fetchTasks, fetchHabits])

  // Tratar alteração na flag de estudos: se desligada enquanto ativa, redireciona para tarefas
  useEffect(() => {
    if (!studiesEnabled && activeTab === 'estudos') {
      setActiveTab('tarefas')
    }
  }, [studiesEnabled, activeTab])

  // Tratar alteração no show_garden: se desligado enquanto ativo, redireciona para tarefas
  useEffect(() => {
    if (!showGarden && activeTab === 'jardim') {
      setActiveTab('tarefas')
    }
  }, [showGarden, activeTab])

  // Atualizar a URL com ?tab= quando o usuário alternar abas (mantendo navegação sincronizada)
  const handleTabChange = (newTab: string) => {
    const validTab = newTab as TabKey
    setActiveTab(validTab)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', validTab)
        return next
      },
      { replace: true },
    )
  }

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
            Performance
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5 line-clamp-1">
            Seus estudos, tarefas e hábitos em um só lugar
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Botão de Configurações Duolingo 3D */}
          <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:text-foreground hover:bg-muted active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-1.5 font-bold text-xs shadow-sm"
                title="Configurações de Performance"
                aria-label="Configurações de Performance"
              >
                <SettingsIcon className="w-4 h-4 text-[#1CB0F6]" strokeWidth={2.5} />
                <span className="hidden sm:inline">Tags & Config</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 rounded-3xl overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
              <DialogHeader className="p-6 pb-2 border-b">
                <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center">
                    <SettingsIcon className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  Configurações de Performance
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

      {/* Tabs Principais com design Duolingo: Estudos · Jardim · Tarefas · Hábitos */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="flex justify-center w-full overflow-x-auto pb-1 scrollbar-hide">
          <TabsList className="inline-flex w-full max-w-xl min-w-max h-13 p-1.5 rounded-3xl bg-muted/60 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] gap-1">
            {studiesEnabled && (
              <TabsTrigger
                value="estudos"
                className={cn(
                  'rounded-2xl font-black text-xs sm:text-sm px-3 sm:px-4 flex-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 select-none',
                  'data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#1899D6] data-[state=active]:shadow-sm',
                )}
              >
                <GraduationCap
                  className="w-4 h-4 shrink-0 text-[#1CB0F6] data-[state=active]:text-white group-data-[state=active]:text-white"
                  strokeWidth={2.5}
                />
                <span>Estudos</span>
              </TabsTrigger>
            )}
            {showGarden && (
              <TabsTrigger
                value="jardim"
                className={cn(
                  'rounded-2xl font-black text-xs sm:text-sm px-3 sm:px-4 flex-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 select-none',
                  'data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#46A302] data-[state=active]:shadow-sm',
                )}
              >
                <Flower2 className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                <span>Jardim</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="tarefas"
              className={cn(
                'rounded-2xl font-black text-xs sm:text-sm px-3 sm:px-4 flex-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 select-none',
                'data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#1899D6] data-[state=active]:shadow-sm',
              )}
            >
              <CheckSquare className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>Tarefas</span>
            </TabsTrigger>
            <TabsTrigger
              value="habitos"
              className={cn(
                'rounded-2xl font-black text-xs sm:text-sm px-3 sm:px-4 flex-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 select-none',
                'data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#46A302] data-[state=active]:shadow-sm',
              )}
            >
              <Repeat className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>Hábitos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Barra de Filtro de Tags / Categorias e Prazo Limite (apenas quando em Tarefas ou Hábitos) */}
        {(activeTab === 'tarefas' || activeTab === 'habitos') && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-hide max-w-full">
            {activeTab === 'tarefas' && (
              <button
                type="button"
                onClick={() => setNearDeadlineOnly((v) => !v)}
                title="Filtrar por tarefas próximas ao prazo"
                aria-label="Prazo Limite"
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-150 flex items-center gap-1 select-none',
                  nearDeadlineOnly
                    ? 'bg-[#FF4B4B] text-white border-b-4 border-[#CC3C3C] shadow-sm active:translate-y-1 active:border-b-0'
                    : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted active:translate-y-0.5 active:border-b-2',
                )}
              >
                <Clock className="w-3 h-3" strokeWidth={2.5} />
                <span>Prazo Limite</span>
              </button>
            )}

            {activeTab === 'tarefas' && (
              <div className="shrink-0 w-px h-4 bg-border/70 my-auto mx-0.5" />
            )}

            <button
              type="button"
              onClick={() => setSelectedTags([])}
              title="Mostrar todas as categorias"
              aria-label="Todas"
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-150 select-none',
                selectedTags.length === 0
                  ? 'bg-foreground text-background border-b-4 border-foreground/70 shadow-sm active:translate-y-1 active:border-b-0'
                  : 'bg-card text-muted-foreground border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted active:translate-y-0.5 active:border-b-2',
              )}
            >
              Todas
            </button>

            {tags.map((cat) => {
              const isSelected = selectedTags.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleTag(cat.id)}
                  title={`Categoria: ${cat.name}`}
                  aria-label={`Filtrar por ${cat.name}`}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-150 border-2 border-b-4 select-none',
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
        )}

        {/* Conteúdo da Aba Estudos com forceMount para preservar rascunho de nota e estado */}
        {studiesEnabled && (
          <TabsContent
            value="estudos"
            forceMount
            className={cn('focus-visible:outline-none m-0', activeTab !== 'estudos' && 'hidden')}
          >
            <StudiesPanel editingNoteId={editingNoteId} onEditingNoteIdChange={setEditingNoteId} />
          </TabsContent>
        )}

        {/* Conteúdo da Aba Jardim */}
        {showGarden && (
          <TabsContent value="jardim" className="focus-visible:outline-none m-0">
            <GardenView />
          </TabsContent>
        )}

        {/* Conteúdo da Aba Tarefas */}
        <TabsContent value="tarefas" className="focus-visible:outline-none m-0">
          <TasksView selectedTags={selectedTags} nearDeadlineOnly={nearDeadlineOnly} />
        </TabsContent>

        {/* Conteúdo da Aba Hábitos */}
        <TabsContent value="habitos" className="focus-visible:outline-none m-0">
          <HabitsView selectedTags={selectedTags} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
