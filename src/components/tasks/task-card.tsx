import { useState } from 'react'
import { Task, useAppStore } from '@/stores/useAppStore'
import { Checkbox } from '@/components/ui/checkbox'
import { GameProgress } from '@/components/ui/game-progress'
import { TaskForm } from '@/components/tasks/task-form'
import { cn } from '@/lib/utils'
import { Zap, Trash2, Clock, Pencil, AlarmClock } from 'lucide-react'
import { formatTime } from '@/lib/habit-utils'

const ENERGY_COLORS = ['#58CC02', '#FFC800', '#FF4B4B']

function EnergyLevelDisplay({ level }: { level: number }) {
  const color = ENERGY_COLORS[level - 1] || ENERGY_COLORS[0]
  return (
    <span className="flex items-center gap-0.5" style={{ color }}>
      {Array.from({ length: level }).map((_, i) => (
        <Zap key={i} className="w-3.5 h-3.5" strokeWidth={2.5} fill={color} />
      ))}
    </span>
  )
}

export function TaskCard({ task }: TaskCardProps) {
  const { tags, toggleTask, deleteTask, toggleSubtask } = useAppStore()
  const [editOpen, setEditOpen] = useState(false)
  const taskTagIds = task.tagIds || (task.tagId ? [task.tagId] : [])
  const taskTags = taskTagIds.map((id) => tags.find((c) => c.id === id)).filter(Boolean)
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length
  const totalSubtasks = task.subtasks.length
  const subtaskPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0
  const dueDateTime = new Date(task.dueDate + 'T23:59:59')
  const timeDiff = dueDateTime.getTime() - Date.now()
  const isNearDeadline = !task.completed && timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000

  return (
    <div
      className={cn(
        'group flex flex-col gap-3 p-4 rounded-3xl bg-card border-2 border-b-4 shadow-sm transition-all duration-200 animate-slide-up',
        task.completed
          ? 'opacity-60 border-[#E5E5E5] dark:border-[#3B4A55]'
          : isNearDeadline
            ? 'border-[#FF4B4B] animate-pulse'
            : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {taskTags.map(
              (tag) =>
                tag && (
                  <span
                    key={tag.id}
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ),
            )}
            <EnergyLevelDisplay level={task.energyLevel} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
              <Clock className="w-3 h-3" strokeWidth={2.5} /> {formatTime(task.estimatedTime)}
            </span>
            {isNearDeadline && (
              <span className="flex items-center gap-1 text-xs text-[#FF4B4B] font-bold animate-pulse">
                <AlarmClock className="w-3 h-3" strokeWidth={2.5} /> Prazo próximo!
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditOpen(true)}
            className="p-2 text-muted-foreground hover:text-[#1CB0F6] rounded-full hover:bg-[#1CB0F6]/10 transition-colors"
            aria-label="Edit task"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-2 text-muted-foreground hover:text-[#FF4B4B] rounded-full hover:bg-[#FF4B4B]/10 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {totalSubtasks > 0 && (
        <div className="space-y-2 pl-10">
          <div className="space-y-1.5">
            {task.subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2">
                <Checkbox
                  checked={st.completed}
                  onCheckedChange={() => toggleSubtask(task.id, st.id)}
                  className="w-4 h-4 rounded-md border-2 data-[state=checked]:bg-[#58CC02] data-[state=checked]:border-[#58CC02] transition-all"
                />
                <span
                  className={cn(
                    'text-sm font-semibold transition-all',
                    st.completed && 'line-through text-muted-foreground',
                  )}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <GameProgress value={subtaskPercent} variant="success" height="sm" />
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        </div>
      )}
      <TaskForm editTask={task} hideTrigger open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}

interface TaskCardProps {
  task: Task
}
