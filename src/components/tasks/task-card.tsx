import { Task, useAppStore } from '@/stores/main'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { AlertCircle, ArrowUpCircle, MinusCircle, Trash2 } from 'lucide-react'

interface TaskCardProps {
  task: Task
}

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case 'high':
      return <ArrowUpCircle className="w-4 h-4 text-destructive" />
    case 'medium':
      return <MinusCircle className="w-4 h-4 text-amber-500" />
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const { categories, toggleTask, deleteTask } = useAppStore()
  const category = categories.find((c) => c.id === task.categoryId)

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 rounded-2xl bg-card border shadow-sm transition-all duration-200 animate-slide-up',
        task.completed ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id)}
        className="w-6 h-6 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-300"
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-medium text-base truncate transition-all duration-300',
            task.completed && 'line-through text-muted-foreground',
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {category && (
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                category.color,
              )}
            >
              {category.name}
            </span>
          )}
          <PriorityIcon priority={task.priority} />
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
