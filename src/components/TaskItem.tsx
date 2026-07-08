import { Check, Clock, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task, useAppStore } from '@/stores/useAppStore'
import { formatTime } from '@/lib/habit-utils'

export function TaskItem({ task }: { task: Task }) {
  const { toggleTask, deleteTask, tags } = useAppStore()
  const tag = tags.find((c) => c.id === task.tagId)

  return (
    <div className="group flex items-center p-4 bg-card rounded-2xl shadow-subtle mb-3 hover:-translate-y-1 transition-transform border border-border/50 hover:shadow-elevation">
      <button
        onClick={() => toggleTask(task.id)}
        className={cn(
          'w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center mr-4 transition-all active:scale-90',
          task.completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground hover:border-primary text-transparent',
        )}
      >
        <Check className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            'font-medium transition-all truncate',
            task.completed && 'line-through text-muted-foreground opacity-60',
          )}
        >
          {task.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {tag && (
            <span
              className="px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          )}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock className="w-3 h-3" /> {formatTime(task.estimatedTime)}
          </span>
          <span className="whitespace-nowrap">
            {new Date(task.dueDate).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            })}
          </span>
        </div>
      </div>
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
