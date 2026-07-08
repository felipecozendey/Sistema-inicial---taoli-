import { Check, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task, useAppStore } from '@/stores/useAppStore'

export function TaskItem({ task }: { task: Task }) {
  const { toggleTask, categories } = useAppStore()
  const category = categories.find((c) => c.id === task.categoryId)

  return (
    <div className="flex items-center p-4 bg-card rounded-2xl shadow-subtle mb-3 hover:-translate-y-1 transition-transform border border-border/50 hover:shadow-elevation group">
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
          {category && (
            <span
              className="px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ backgroundColor: category.color + '20', color: category.color }}
            >
              {category.name}
            </span>
          )}
          {task.isRoutine && (task.streak ?? 0) > 0 && (
            <span className="flex items-center text-orange-500 font-medium whitespace-nowrap bg-orange-500/10 px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3 mr-1" /> {task.streak}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
