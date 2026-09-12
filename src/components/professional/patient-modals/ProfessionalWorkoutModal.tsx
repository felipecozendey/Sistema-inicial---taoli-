import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Check, Stethoscope } from 'lucide-react'
import type { ExerciseItem } from '@/components/health/workout-types'
import { newExerciseId } from '@/components/health/workout-types'
import { supabase } from '@/lib/supabase/client'
import { useProfessionalPatientWrite } from '@/hooks/use-professional-patient-write'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  patientName: string
  editRoutine?: any | null
  onSuccess?: () => void
}

export function ProfessionalWorkoutModal({
  open,
  onOpenChange,
  patientName,
  editRoutine,
  onSuccess,
}: Props) {
  const { createWorkoutRoutineForPatient, updateWorkoutRoutineForPatient } =
    useProfessionalPatientWrite()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<ExerciseItem[]>([
    { id: newExerciseId(), name: '', sets: 3, reps: '10-12', weightKg: 0 },
  ])
  const [lastRoutineId, setLastRoutineId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editRoutine) {
      setLastRoutineId(editRoutine.id)
      setTitle(editRoutine.title || '')
      setDescription(editRoutine.description || '')
      const list = Array.isArray(editRoutine.exercises) ? editRoutine.exercises : []
      if (list.length > 0) {
        setExercises(
          list.map((ex: any) => ({
            id: ex.id || newExerciseId(),
            name: ex.name || '',
            sets: Number(ex.sets) || 3,
            reps: String(ex.reps || '10-12'),
            weightKg: Number(ex.weightKg || ex.weight_kg) || 0,
          })),
        )
      } else {
        setExercises([{ id: newExerciseId(), name: '', sets: 3, reps: '10-12', weightKg: 0 }])
      }
    } else {
      setLastRoutineId(null)
      setTitle('')
      setDescription('')
      setExercises([{ id: newExerciseId(), name: '', sets: 3, reps: '10-12', weightKg: 0 }])
    }
  }, [open, editRoutine])
  const [globalExercises, setGlobalExercises] = useState<
    { id: string; name: string; muscleGroup: string }[]
  >([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadCatalog() {
      const { data } = await supabase
        .from('global_exercises')
        .select('id, name, muscle_group')
        .eq('is_active', true)
        .order('name', { ascending: true })
      if (data) {
        setGlobalExercises(
          data.map((r: any) => ({
            id: r.id,
            name: r.name,
            muscleGroup: r.muscle_group,
          })),
        )
      }
    }
    if (open) loadCatalog()
  }, [open])

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

  const handleSave = async () => {
    const valid = exercises.filter((e) => e.name.trim())
    if (!title.trim()) {
      toast.error('Informe o nome da ficha.')
      return
    }
    if (valid.length === 0) {
      toast.error('Adicione ao menos um exercício.')
      return
    }

    setSaving(true)
    let res = null
    if (editRoutine?.id) {
      res = await updateWorkoutRoutineForPatient(editRoutine.id, {
        title: title.trim(),
        exercises: valid as any,
        description: description.trim(),
      })
    } else {
      res = await createWorkoutRoutineForPatient(title.trim(), valid as any, description.trim())
    }
    setSaving(false)

    if (res) {
      toast.success(
        editRoutine
          ? `Ficha de treino atualizada para ${patientName}! 🏋️`
          : `Ficha de treino prescrita para ${patientName}! 🏋️`,
      )
      setTitle('')
      setDescription('')
      setExercises([{ id: newExerciseId(), name: '', sets: 3, reps: '10-12', weightKg: 0 }])
      onOpenChange(false)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white bg-[#1CB0F6]">
              <Stethoscope className="w-3 h-3" />
              Prescrição
            </span>
            <span className="text-xs font-bold text-muted-foreground truncate">
              Criando para: <strong>{patientName}</strong>
            </span>
          </div>
          <DialogTitle className="text-xl font-extrabold">
            {editRoutine ? 'Editar Ficha de Treino' : 'Prescrever Ficha de Treino'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {editRoutine
              ? 'Ajuste os exercícios, séries e cargas prescritos para o paciente.'
              : 'Monte a rotina de exercícios físicos individualizada para o paciente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da ficha (ex: Ficha A - Hipertrofia Peitoral)"
              className="rounded-2xl font-bold"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Orientações e observações clínicas (opcional)"
              className="rounded-2xl font-semibold text-sm"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-2 p-2 rounded-2xl bg-muted/40">
                <span className="text-xs font-extrabold text-muted-foreground w-4 shrink-0 text-center">
                  {i + 1}
                </span>
                <Input
                  value={ex.name}
                  onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                  placeholder="Exercício (ex: Leg Press 45°)"
                  list="pro-global-exercises-datalist"
                  className="flex-1 min-w-0 rounded-xl bg-background font-semibold text-sm h-9"
                />
                <Input
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value) || 0)}
                  className="w-12 rounded-xl bg-background font-semibold text-sm h-9 text-center"
                  title="Séries"
                />
                <Input
                  value={ex.reps}
                  onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                  className="w-16 rounded-xl bg-background font-semibold text-sm h-9 text-center"
                  title="Repetições"
                />
                <Input
                  type="number"
                  value={ex.weightKg}
                  onChange={(e) =>
                    updateExercise(ex.id, 'weightKg', parseFloat(e.target.value) || 0)
                  }
                  className="w-16 rounded-xl bg-background font-semibold text-sm h-9 text-center"
                  title="Carga (kg)"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addExercise}
            className="w-full py-2.5 rounded-2xl border-2 border-dashed border-[#1CB0F6]/40 text-[#1CB0F6] font-bold text-sm hover:bg-[#1CB0F6]/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Adicionar Exercício
          </button>

          <datalist id="pro-global-exercises-datalist">
            {globalExercises.map((ge) => (
              <option key={ge.id} value={ge.name}>
                {ge.muscleGroup}
              </option>
            ))}
          </datalist>

          <div className="flex gap-3 text-[11px] font-bold text-muted-foreground px-2">
            <span className="w-4 text-center">#</span>
            <span className="flex-1">Exercício</span>
            <span className="w-12 text-center">Séries</span>
            <span className="w-16 text-center">Reps</span>
            <span className="w-16 text-center">kg</span>
            <span className="w-7" />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all"
          >
            <Check className="w-5 h-5 mr-1" strokeWidth={2.5} />
            {saving ? 'Salvando...' : editRoutine ? 'Salvar Ficha' : 'Prescrever Ficha'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
