import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { TaskCard } from '@/components/tasks/task-card'
import { HabitCard } from '@/components/habits/habit-card'
import { UnifiedCreateButton } from '@/components/unified-create-button'
import { CalendarView } from '@/components/calendar/calendar-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export default function TasksAndHabits() {
  const { tasks, habits, tags } = useAppStore()
  const [filter, setFilter] = useState<string>('all')

  const filteredTasks = useMemo(
    () => tasks.filter((t) => filter === 'all' || t.tagId === filter),
    [tasks, filter],
  )
  const filteredHabits = useMemo(
    () => habits.filter((h) => filter === 'all' || h.tagId === filter),
    [habits, filter],
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Tarefas e Hábitos</h2>
        <UnifiedCreateButton />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-transform active:scale-95',
            filter === 'all'
              ? 'bg-foreground text-background shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          Todas
        </button>
        {tags.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-transform active:scale-95',
              filter === cat.id ? 'border-2 shadow-md' : 'border border-transparent',
            )}
            style={{
              backgroundColor: filter === cat.id ? cat.color : cat.color + '20',
              color: filter === cat.id ? '#0f172a' : cat.color,
              borderColor: filter === cat.id ? '#0f172a' : 'transparent',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto rounded-2xl p-1.5">
          <TabsTrigger value="list" className="rounded-xl font-bold">
            Visão em Lista
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl font-bold">
            Visão de Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-6">
          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-muted-foreground">Tarefas</h3>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => <TaskCard key={t.id} task={t} />)
            ) : (
              <div className="text-center p-8 text-muted-foreground bg-card/50 rounded-3xl border border-dashed">
                Nenhuma tarefa encontrada.
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-muted-foreground">Hábitos</h3>
            {filteredHabits.length > 0 ? (
              filteredHabits.map((h) => <HabitCard key={h.id} habit={h} />)
            ) : (
              <div className="text-center p-8 text-muted-foreground bg-card/50 rounded-3xl border border-dashed">
                Nenhum hábito encontrado.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView tasks={filteredTasks} habits={filteredHabits} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
