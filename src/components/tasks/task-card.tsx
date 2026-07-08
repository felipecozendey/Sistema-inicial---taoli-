import { Task, useAppStore } from '@/stores/useAppStore'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { AlertCircle, ArrowUpCircle, MinusCircle, Trash2, Clock } from 'lucide-react'
import { formatTime } from '@/lib/habit-utils'

interface TaskCardProps {
  task: Task
}

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case 'high':
      return <ArrowUpCircle className="w-4 h-4 text-[#FF4B4B]" strokeWidth={2.5} />
    case 'medium':
      return <MinusCircle className="w-4 h-4 text-[#FFC800]" strokeWidth={2.5} />
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const { tags, toggleTask, deleteTask } = useAppStore()
  const tag = tags.find((c: any) => c.id === task.tagId)

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm transition-all duration-200 animate-slide-up',
        task.completed ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id)}
        className="w-6 h-6 rounded-full border-2 data-[state=checked]:bg-[#58CC02] data-[state=checked]:border-[#58CC02] transition-all duration-300"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-bold text-base truncate transition-all duration-300',
            task.completed && 'line-through text-muted-foreground',
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {tag && (
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          )}
          <PriorityIcon priority={task.priority} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
            <Clock className="w-3 h-3" strokeWidth={2.5} /> {formatTime(task.estimatedTime)}
          </span>
        </div>
      </div>
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-[#FF4B4B] rounded-full hover:bg-[#FF4B4B]/10"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}
