import { useState } from 'react'
import { useAppStore, WorkoutExercise } from '@/stores/useAppStore'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const newId = () => Math.random().toString(36).substring(2, 9)

export function RoutineBuilder({ onClose }: { onClose: () => void }) {
  const { addWorkoutRoutine } = useAppStore()
  const [title, setTitle] = useState('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    { id: newId(), name: '', sets: 3, reps: 10, weight: 0 },
  ])

  const addExercise = () => {
    setExercises((p) => [...p, { id: newId(), name: '', sets: 3, reps: 10, weight: 0 }])
  }

  const removeExercise = (id: string) => {
    setExercises((p) => p.filter((e) => e.id !== id))
  }

  const updateExercise = (id: string, field: keyof WorkoutExercise, value: string | number) => {
    setExercises((p) => p.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const handleSave = () => {
    const valid = exercises.filter((e) => e.name.trim())
    if (!title.trim() || valid.length === 0) return
    addWorkoutRoutine(title.trim(), valid)
    onClose()
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold">Nova Rotina</h3>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#58CC02] text-white font-bold text-sm border-b-4 border-[#46a302] active:translate-y-1 active:border-b-0 transition-all flex items-center gap-1"
          >
            <Check className="w-4 h-4" strokeWidth={2.5} /> Salvar
          </button>
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome da rotina (ex: Treino A - Push)"
        className="rounded-2xl bg-muted/50 border-transparent font-bold"
      />

      <div className="space-y-3">
        {exercises.map((ex, i) => (
          <div key={ex.id} className="flex items-center gap-2 p-3 rounded-2xl bg-muted/40">
            <span className="text-sm font-extrabold text-muted-foreground w-5 shrink-0">
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
              className="w-14 rounded-xl bg-background font-semibold text-sm h-9 text-center"
            />
            <Input
              type="number"
              value={ex.reps}
              onChange={(e) => updateExercise(ex.id, 'reps', parseInt(e.target.value) || 0)}
              className="w-14 rounded-xl bg-background font-semibold text-sm h-9 text-center"
            />
            <Input
              type="number"
              value={ex.weight}
              onChange={(e) => updateExercise(ex.id, 'weight', parseFloat(e.target.value) || 0)}
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
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] font-bold text-sm hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} /> Adicionar Exercício
      </button>

      <div className="flex gap-3 text-xs font-bold text-muted-foreground pl-1">
        <span className="w-5 shrink-0" />
        <span className="flex-1">Nome</span>
        <span className="w-14 text-center">Séries</span>
        <span className="w-14 text-center">Reps</span>
        <span className="w-16 text-center">kg</span>
        <span className="w-7 shrink-0" />
      </div>
    </div>
  )
}
