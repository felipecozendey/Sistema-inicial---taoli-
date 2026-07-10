import { useState } from 'react'
import { useAppStore, WorkoutRoutine } from '@/stores/useAppStore'
import { Check, ChevronLeft, Flame, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ActiveWorkout({
  routine,
  onBack,
}: {
  routine: WorkoutRoutine
  onBack: () => void
}) {
  const { completeWorkoutSet, addWorkoutHistory, user } = useAppStore()
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set())

  const toggleSet = (exerciseId: string, setIndex: number) => {
    const key = `${exerciseId}-${setIndex}`
    const isDone = completedSets.has(key)
    if (!isDone) {
      completeWorkoutSet()
      toast.success('+2 Moedas! 💰', { duration: 1200 })
    }
    setCompletedSets((prev) => {
      const next = new Set(prev)
      if (isDone) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalSets = routine.exercises.reduce((sum, e) => sum + e.sets, 0)
  const doneCount = completedSets.size
  const allDone = doneCount === totalSets && totalSets > 0

  const handleFinish = () => {
    addWorkoutHistory(routine.id, { completedSets: Array.from(completedSets), totalSets })
    toast.success('Treino concluído! 🔥')
    onBack()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <h3 className="text-lg font-extrabold flex-1">{routine.title}</h3>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFC800]/15">
          <Coins className="w-4 h-4 text-[#FFC800]" strokeWidth={2.5} />
          <span className="text-sm font-extrabold text-[#FFC800]">{user.coins || 0}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/40">
        <Flame className="w-5 h-5 text-[#FF9600] shrink-0" strokeWidth={2.5} />
        <span className="text-sm font-bold shrink-0">
          {doneCount}/{totalSets}
        </span>
        <div className="flex-1 h-2 rounded-full bg-muted ml-2 overflow-hidden">
          <div
            className="h-full bg-[#58CC02] rounded-full transition-all duration-300"
            style={{ width: `${totalSets > 0 ? (doneCount / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      {routine.exercises.map((ex) => (
        <div
          key={ex.id}
          className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-extrabold">{ex.name}</h4>
            <span className="text-xs font-bold text-muted-foreground">
              {ex.sets}x{ex.reps} {ex.weight > 0 ? `@ ${ex.weight}kg` : ''}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: ex.sets }).map((_, i) => {
              const key = `${ex.id}-${i}`
              const isDone = completedSets.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleSet(ex.id, i)}
                  className={cn(
                    'w-14 h-14 rounded-full border-2 border-b-4 font-extrabold text-lg flex items-center justify-center transition-all duration-150 active:translate-y-1 active:border-b-0',
                    isDone
                      ? 'bg-[#58CC02] text-white border-[#46a302]'
                      : 'bg-muted/40 border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/60',
                  )}
                >
                  {isDone ? <Check className="w-6 h-6" strokeWidth={3} /> : i + 1}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {allDone && (
        <button
          onClick={handleFinish}
          className="w-full py-4 rounded-2xl bg-[#FF9600] text-white font-extrabold border-b-4 border-[#cc7a00] active:translate-y-1 active:border-b-0 transition-all duration-150"
        >
          🔥 Concluir Treino!
        </button>
      )}
    </div>
  )
}
