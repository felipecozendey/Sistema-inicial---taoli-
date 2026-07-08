import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { TaskItem } from '@/components/TaskItem'
import { cn } from '@/lib/utils'
import { Calendar, List } from 'lucide-react'

export default function Tasks() {
  const { tasks, categories } = useAppStore()
  const [filter, setFilter] = useState<string>('all')
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => filter === 'all' || t.categoryId === filter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [tasks, filter])

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Gerenciar Tarefas</h2>
        <div className="flex items-center bg-card rounded-xl p-1.5 shadow-sm border w-fit">
          <button
            onClick={() => setView('list')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all',
              view === 'list'
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="w-4 h-4" /> Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all',
              view === 'calendar'
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Calendar className="w-4 h-4" /> Semana
          </button>
        </div>
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
        {categories.map((cat) => (
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

      {view === 'list' ? (
        <div className="space-y-3 mt-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((t) => <TaskItem key={t.id} task={t} />)
          ) : (
            <div className="text-center p-16 text-muted-foreground bg-card/50 rounded-[2rem] border border-dashed">
              Nenhuma tarefa encontrada para este filtro.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-16 bg-card rounded-[2rem] border border-dashed text-muted-foreground mt-6">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-lg text-foreground">Visão Semanal</h3>
          <p>
            O modo calendário está em desenvolvimento. Mantenha o foco na lista por enquanto. 🌱
          </p>
        </div>
      )}
    </div>
  )
}
