import { Check, Clock, Trash2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task, useAppStore } from '@/stores/useAppStore'
import { formatTime } from '@/lib/habit-utils'
import { GameProgress } from '@/components/ui/game-progress'

const ENERGY_COLORS = ['#58CC02', '#FFC800', '#FF4B4B']

function EnergyLevelDisplay({ level }: { level: number }) {
  const color = ENERGY_COLORS[level - 1] || ENERGY_COLORS[0]
  return (
    <span className="flex items-center gap-0.5" style={{ color }}>
      {Array.from({ length: level }).map((_, i) => (
        <Zap key={i} className="w-3 h-3" strokeWidth={2.5} fill={color} />
      ))}
    </span>
  )
}

export function TaskItem({ task }: { task: Task }) {
  const { toggleTask, deleteTask, toggleSubtask, tags } = useAppStore()
  const tag = tags.find((c) => c.id === task.tagId)
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length
  const totalSubtasks = task.subtasks.length
  const subtaskPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

  return (
    <div className="group flex flex-col gap-3 p-4 bg-card rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm mb-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up">
      <div className="flex items-center">
        <button
          onClick={() => toggleTask(task.id)}
          className={cn(
            'w-7 h-7 shrink-0 rounded-full border-2 border-b-4 flex items-center justify-center mr-4 transition-all active:translate-y-1 active:border-b-0',
            task.completed
              ? 'bg-[#58CC02] border-[#46A302] text-white'
              : 'border-[#E5E5E5] dark:border-[#3B4A55] text-transparent hover:border-[#58CC02]',
          )}
        >
          <Check className="w-4 h-4" strokeWidth={3} />
        </button>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-bold transition-all truncate',
              task.completed && 'line-through text-muted-foreground opacity-60',
            )}
          >
            {task.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {tag && (
              <span
                className="px-2 py-0.5 rounded-full whitespace-nowrap font-bold"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            )}
            <EnergyLevelDisplay level={task.energyLevel} />
            <span className="flex items-center gap-1 whitespace-nowrap font-semibold">
              <Clock className="w-3 h-3" /> {formatTime(task.estimatedTime)}
            </span>
            <span className="whitespace-nowrap font-semibold">
              {new Date(task.dueDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
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
      {totalSubtasks > 0 && (
        <div className="space-y-2 pl-11">
          <div className="space-y-1.5">
            {task.subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2">
                <button
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className={cn(
                    'w-4 h-4 shrink-0 rounded-md border-2 flex items-center justify-center transition-all',
                    st.completed
                      ? 'bg-[#58CC02] border-[#58CC02] text-white'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] text-transparent',
                  )}
                >
                  {st.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                </button>
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
    </div>
  )
}
