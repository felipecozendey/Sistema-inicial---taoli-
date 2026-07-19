import { useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Clock, Weight, Dumbbell } from 'lucide-react'

export function WorkoutHistoryView() {
  const workoutHistory = useAppStore((s) => s.workoutHistory)
  const workoutRoutines = useAppStore((s) => s.workoutRoutines)
  const fetchWorkoutHistory = useAppStore((s) => s.fetchWorkoutHistory)
  const fetchWorkoutRoutines = useAppStore((s) => s.fetchWorkoutRoutines)

  useEffect(() => {
    fetchWorkoutHistory()
    fetchWorkoutRoutines()
  }, [fetchWorkoutHistory, fetchWorkoutRoutines])

  const getRoutineName = (routineId: string) => {
    const r = workoutRoutines.find((routine) => routine.id === routineId)
    return r?.title || 'Ficha deletada'
  }

  if (workoutHistory.length === 0) {
    return (
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-8 text-center">
        <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" strokeWidth={2} />
        <p className="text-sm font-bold text-muted-foreground">
          Nenhum treino registrado ainda. Complete sua primeira ficha!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {workoutHistory.map((h) => {
        const date = new Date(h.completedAt)
        const dateStr = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        return (
          <div
            key={h.id}
            className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏋️</span>
                <div>
                  <p className="font-extrabold text-sm">{getRoutineName(h.routineId)}</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {dateStr} às {timeStr}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1CB0F6]/10">
                <Clock className="w-4 h-4 text-[#1CB0F6]" strokeWidth={2.5} />
                <span className="text-sm font-extrabold text-[#1CB0F6]">
                  {h.durationMinutes || 0} min
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF9600]/10">
                <Weight className="w-4 h-4 text-[#FF9600]" strokeWidth={2.5} />
                <span className="text-sm font-extrabold text-[#FF9600]">
                  {((h.totalVolumeKg || 0) / 1000).toFixed(2)} Ton
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
