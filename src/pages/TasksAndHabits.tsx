import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { UnifiedCreateButton } from '@/components/unified-create-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TasksView } from '@/components/tasks/tasks-view'
import { HabitsView } from '@/components/tasks/habits-view'
import { cn } from '@/lib/utils'
import { CheckSquare, Repeat, Clock } from 'lucide-react'

export default function TasksAndHabits() {
  const { tags } = useAppStore()
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits'>('tasks')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [nearDeadlineOnly, setNearDeadlineOnly] = useState(false)

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Tarefas e Hábitos</h2>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">
            Organize suas pendências e construa hábitos consistentes.
          </p>
        </div>
        <UnifiedCreateButton />
      </div>

      {/* Tabs Principais com design Duolingo: Tarefas vs Hábitos */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'tasks' | 'habits')}
        className="w-full space-y-6"
      >
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-2 w-full max-w-md h-13 p-1.5 rounded-3xl bg-muted/60 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
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
