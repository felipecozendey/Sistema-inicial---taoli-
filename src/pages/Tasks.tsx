import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { TaskItem } from '@/components/TaskItem'
import { TaskForm } from '@/components/tasks/task-form'
import { cn } from '@/lib/utils'

export default function Tasks() {
  const { tasks, tags } = useAppStore()
  const [filter, setFilter] = useState<string>('all')

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => filter === 'all' || t.tagId === filter)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [tasks, filter])

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Gerenciar Tarefas</h2>
        <TaskForm />
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

      <div className="space-y-3 mt-6">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((t) => <TaskItem key={t.id} task={t} />)
        ) : (
          <div className="text-center p-16 text-muted-foreground bg-card/50 rounded-[2rem] border border-dashed">
            Nenhuma tarefa encontrada para este filtro.
          </div>
        )}
      </div>
    </div>
  )
}
