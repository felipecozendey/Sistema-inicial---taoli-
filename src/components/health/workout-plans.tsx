import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Plus, Trash2, Play, Dumbbell } from 'lucide-react'
import { WorkoutPlanModal } from '@/components/health/workout-plan-modal'
import { WorkoutActiveMode } from '@/components/health/workout-active-mode'
import { normalizeExercises } from '@/components/health/workout-types'

export function WorkoutPlans() {
  const workoutRoutines = useAppStore((s) => s.workoutRoutines)
  const deleteWorkoutRoutine = useAppStore((s) => s.deleteWorkoutRoutine)
  const fetchWorkoutRoutines = useAppStore((s) => s.fetchWorkoutRoutines)
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchWorkoutRoutines()
  }, [fetchWorkoutRoutines])

  const activeRoutine = workoutRoutines.find((r) => r.id === activeRoutineId)
  if (activeRoutine) {
    return <WorkoutActiveMode routine={activeRoutine} onBack={() => setActiveRoutineId(null)} />
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setModalOpen(true)}
        className="w-full py-4 rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" strokeWidth={3} /> Nova Ficha
      </button>

      {workoutRoutines.length === 0 ? (
        <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-8 text-center">
          <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" strokeWidth={2} />
          <p className="text-sm font-bold text-muted-foreground">
            Nenhuma ficha criada. Crie sua primeira!
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {workoutRoutines.map((r) => {
            const exercises = normalizeExercises(r.exercises as any[])
            return (
              <AccordionItem
                key={r.id}
                value={r.id}
                className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl px-5 shadow-sm overflow-hidden border-t-2"
              >
                <AccordionTrigger className="font-extrabold text-base hover:no-underline py-5">
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-xl">📋</span>
                    <div>
                      <p>{r.title}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {exercises.length} exercícios
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-muted/40"
                    >
                      <span className="font-bold text-sm">{ex.name}</span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {ex.sets}x{ex.reps} @ {ex.weightKg}kg
                      </span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setActiveRoutineId(r.id)}
                      className="flex-1 py-3 rounded-2xl bg-[#58CC02] text-white font-extrabold text-sm border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-1"
                    >
                      <Play className="w-4 h-4" strokeWidth={2.5} /> Iniciar Ficha
                    </button>
                    <button
                      onClick={() => deleteWorkoutRoutine(r.id)}
                      className="p-3 rounded-2xl bg-[#FF4B4B]/10 text-[#FF4B4B] border-b-4 border-[#FF4B4B]/20 active:translate-y-1 active:border-b-0 transition-all"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      <WorkoutPlanModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
