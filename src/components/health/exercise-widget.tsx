import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PersonalRecords } from '@/components/health/personal-records'
import { RoutineBuilder } from '@/components/health/routine-builder'
import { ActiveWorkout } from '@/components/health/active-workout'
import { Plus, Dumbbell, ChevronRight, Trash2 } from 'lucide-react'

export function ExerciseWidget() {
  const workoutRoutines = useAppStore((s) => s.workoutRoutines)
  const fetchWorkoutRoutines = useAppStore((s) => s.fetchWorkoutRoutines)
  const deleteWorkoutRoutine = useAppStore((s) => s.deleteWorkoutRoutine)
  const [showBuilder, setShowBuilder] = useState(false)
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkoutRoutines()
  }, [fetchWorkoutRoutines])

  const routine = workoutRoutines.find((r) => r.id === activeRoutineId)

  if (routine) {
    return <ActiveWorkout routine={routine} onBack={() => setActiveRoutineId(null)} />
  }

  if (showBuilder) {
    return <RoutineBuilder onClose={() => setShowBuilder(false)} />
  }

  return (
    <div className="space-y-4">
      <PersonalRecords />

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#FF4B4B]/15 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[#FF4B4B]" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-extrabold">Rotinas</h3>
          </div>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 rounded-2xl bg-[#FF4B4B] text-white font-extrabold text-sm border-b-4 border-[#cc3c3c] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Nova
          </button>
        </div>

        {workoutRoutines.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" strokeWidth={2} />
            <p className="text-sm font-bold text-muted-foreground">
              Nenhuma rotina ainda. Crie sua primeira!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {workoutRoutines.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                onClick={() => setActiveRoutineId(r.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm">{r.title}</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {r.exercises.length} exercício{r.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteWorkoutRoutine(r.id)
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] transition-colors"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
