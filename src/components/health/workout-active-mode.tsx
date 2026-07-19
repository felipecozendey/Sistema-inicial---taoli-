import { useState, useMemo } from 'react'
import { useAppStore, WorkoutRoutine } from '@/stores/useAppStore'
import { ChevronLeft, Check, Flame, Coins, Flag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ConfettiBurst } from '@/components/ui/confetti-burst'
import type { ExerciseItem } from '@/components/health/workout-types'
import { normalizeExercises } from '@/components/health/workout-types'

export function WorkoutActiveMode({
  routine,
  onBack,
}: {
  routine: WorkoutRoutine
  onBack: () => void
}) {
  const completeWorkoutSet = useAppStore((s) => s.completeWorkoutSet)
  const addWorkoutLog = useAppStore((s) => s.addWorkoutLog)
  const updateWorkoutRoutine = useAppStore((s) => s.updateWorkoutRoutine)
  const user = useAppStore((s) => s.user)
  const [exercises, setExercises] = useState<ExerciseItem[]>(() =>
    normalizeExercises(routine.exercises as any[]),
  )
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set())
  const [startTime] = useState(Date.now())
  const [showConfetti, setShowConfetti] = useState(false)
  const [finishData, setFinishData] = useState<{ volume: number; duration: number } | null>(null)

  const totalSets = exercises.reduce((s, e) => s + e.sets, 0)
  const doneCount = completedSets.size
  const allDone = doneCount === totalSets && totalSets > 0

  const toggleSet = (exerciseId: string, setIndex: number) => {
    const key = `${exerciseId}-${setIndex}`
    const isDone = completedSets.has(key)
    if (!isDone) {
      completeWorkoutSet()
      toast.success('+2 Moedas! 💰', { duration: 1000 })
    }
    setCompletedSets((prev) => {
      const next = new Set(prev)
      if (isDone) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleWeightChange = (exerciseId: string, weight: number) => {
    setExercises((prev) => prev.map((e) => (e.id === exerciseId ? { ...e, weightKg: weight } : e)))
  }

  const syncToPlan = () => {
    updateWorkoutRoutine(routine.id, { exercises: exercises as any })
  }

  const totalVolume = useMemo(() => {
    let vol = 0
    exercises.forEach((e) => {
      for (let i = 0; i < e.sets; i++) {
        if (completedSets.has(`${e.id}-${i}`)) {
          const reps = parseInt(e.reps) || 10
          vol += e.weightKg * reps
        }
      }
    })
    return vol
  }, [exercises, completedSets])

  const handleFinish = () => {
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000))
    addWorkoutLog(
      routine.id,
      { completedSets: Array.from(completedSets), exercises, totalSets },
      durationMinutes,
      totalVolume,
    )
    syncToPlan()
    setShowConfetti(true)
    setFinishData({ volume: totalVolume, duration: durationMinutes })
    toast.success('Treino concluído! 🏆')
    setTimeout(() => onBack(), 2800)
  }

  if (finishData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in-up">
        <ConfettiBurst trigger={showConfetti} />
        <div className="text-7xl">🏆</div>
        <h3 className="text-2xl font-extrabold text-[#58CC02]">Treino Concluído!</h3>
        <div className="flex gap-6 mt-2">
          <div className="text-center bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-6 py-3">
            <p className="text-xs font-bold text-muted-foreground">Volume Total</p>
            <p className="text-xl font-extrabold text-[#FF9600]">
              {(finishData.volume / 1000).toFixed(2)} Ton
            </p>
          </div>
          <div className="text-center bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl px-6 py-3">
            <p className="text-xs font-bold text-muted-foreground">Duração</p>
            <p className="text-xl font-extrabold text-[#1CB0F6]">{finishData.duration} min</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
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

      {exercises.map((ex) => (
        <div
          key={ex.id}
          className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-extrabold">{ex.name}</h4>
            <span className="text-xs font-bold text-muted-foreground">
              {ex.sets}x{ex.reps}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap items-center mb-3">
            {Array.from({ length: ex.sets }).map((_, i) => {
              const key = `${ex.id}-${i}`
              const isDone = completedSets.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleSet(ex.id, i)}
                  className={cn(
                    'w-12 h-12 rounded-full border-2 border-b-4 font-extrabold flex items-center justify-center transition-all duration-150 active:translate-y-1 active:border-b-0',
                    isDone
                      ? 'bg-[#58CC02] text-white border-[#46a302]'
                      : 'bg-muted/40 border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/60',
                  )}
                >
                  {isDone ? <Check className="w-5 h-5" strokeWidth={3} /> : i + 1}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Carga (kg):</span>
            <Input
              type="number"
              value={ex.weightKg}
              onChange={(e) => handleWeightChange(ex.id, parseFloat(e.target.value) || 0)}
              onBlur={syncToPlan}
              className="w-24 rounded-xl bg-muted/50 font-bold text-sm h-8"
            />
          </div>
        </div>
      ))}

      {allDone && (
        <button
          onClick={handleFinish}
          className="w-full py-4 rounded-2xl bg-[#FF9600] text-white font-extrabold border-b-4 border-[#cc7a00] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
        >
          <Flag className="w-5 h-5" strokeWidth={2.5} /> Finalizar Treino
        </button>
      )}
    </div>
  )
}
