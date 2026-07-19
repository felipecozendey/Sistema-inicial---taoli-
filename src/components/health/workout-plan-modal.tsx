import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Check } from 'lucide-react'
import type { ExerciseItem } from '@/components/health/workout-types'
import { newExerciseId } from '@/components/health/workout-types'

export function WorkoutPlanModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const addWorkoutRoutine = useAppStore((s) => s.addWorkoutRoutine)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<ExerciseItem[]>([
    { id: newExerciseId(), name: '', sets: 3, reps: '10-12', weightKg: 0 },
  ])

  const addExercise = () => {
    setExercises((p) => [
      ...p,
      { id: newExerciseId(), name: '', sets: 3, reps: '10-12', weightKg: 0 },
    ])
  }

  const removeExercise = (id: string) => {
    setExercises((p) => p.filter((e) => e.id !== id))
  }

  const updateExercise = (id: string, field: keyof ExerciseItem, value: string | number) => {
    setExercises((p) => p.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const handleSave = () => {
    const valid = exercises.filter((e) => e.name.trim())
    if (!title.trim() || valid.length === 0) return
    addWorkoutRoutine(title.trim(), valid as any, description.trim())
    setTitle('')
    setDescription('')
    setExercises([{ id: newExerciseId(), name: '', sets: 3, reps: '10-12', weightKg: 0 }])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Nova Ficha de Treino</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da ficha (ex: Ficha A - Push)"
              className="rounded-2xl bg-muted/50 border-transparent font-bold"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="rounded-2xl bg-muted/50 border-transparent font-semibold text-sm"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-2 p-2 rounded-2xl bg-muted/40">
                <span className="text-xs font-extrabold text-muted-foreground w-4 shrink-0">
                  {i + 1}
                </span>
                <Input
                  value={ex.name}
                  onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                  placeholder="Exercício"
                  className="flex-1 min-w-0 rounded-xl bg-background font-semibold text-sm h-9"
                />
                <Input
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value) || 0)}
                  className="w-12 rounded-xl bg-background font-semibold text-sm h-9 text-center"
                />
                <Input
                  value={ex.reps}
                  onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                  className="w-16 rounded-xl bg-background font-semibold text-sm h-9 text-center"
                />
                <Input
                  type="number"
                  value={ex.weightKg}
                  onChange={(e) =>
                    updateExercise(ex.id, 'weightKg', parseFloat(e.target.value) || 0)
                  }
                  className="w-16 rounded-xl bg-background font-semibold text-sm h-9 text-center"
                />
                <button
                  onClick={() => removeExercise(ex.id)}
                  className="p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addExercise}
            className="w-full py-2.5 rounded-2xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] font-bold text-sm hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Adicionar Exercício
          </button>

          <div className="flex gap-3 text-xs font-bold text-muted-foreground px-2">
            <span className="w-4" />
            <span className="flex-1">Nome</span>
            <span className="w-12 text-center">Séries</span>
            <span className="w-16 text-center">Reps</span>
            <span className="w-16 text-center">kg</span>
            <span className="w-7" />
          </div>

          <Button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all"
          >
            <Check className="w-5 h-5 mr-1" strokeWidth={2.5} /> Criar Ficha
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
