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
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [nearDeadlineOnly, setNearDeadlineOnly] = useState(false)

  const toggleTag = (id: string) =>
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const taskTagIds = t.tagIds || (t.tagId ? [t.tagId] : [])
        const matchesTag =
          selectedTags.length === 0 || taskTagIds.some((id) => selectedTags.includes(id))
        if (!matchesTag) return false
        if (!nearDeadlineOnly) return true
        if (t.completed) return false
        const due = new Date(t.dueDate + 'T23:59:59')
        const diff = due.getTime() - Date.now()
        return diff > 0 && diff < 24 * 60 * 60 * 1000
      }),
    [tasks, selectedTags, nearDeadlineOnly],
  )
  const filteredHabits = useMemo(
    () => habits.filter((h) => selectedTags.length === 0 || selectedTags.includes(h.tagId)),
    [habits, selectedTags],
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Tarefas e Hábitos</h2>
        <UnifiedCreateButton />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide">
        <button
          onClick={() => setNearDeadlineOnly((v) => !v)}
          className={cn(
            'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-transform active:scale-95 flex items-center gap-1.5',
            nearDeadlineOnly
              ? 'bg-[#FF4B4B] text-white shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          ⏰ Prazo Limite
        </button>
        <button
          onClick={() => setSelectedTags([])}
          className={cn(
            'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-transform active:scale-95',
            selectedTags.length === 0
              ? 'bg-foreground text-background shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          Todas
        </button>
        {tags.map((cat) => (
          <button
            key={cat.id}
            onClick={() => toggleTag(cat.id)}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-transform active:scale-95 border-2',
              selectedTags.includes(cat.id) ? 'shadow-md' : 'border-transparent',
            )}
            style={{
              backgroundColor: selectedTags.includes(cat.id) ? cat.color : cat.color + '20',
              color: selectedTags.includes(cat.id) ? '#0f172a' : cat.color,
              borderColor: selectedTags.includes(cat.id) ? '#0f172a' : 'transparent',
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
