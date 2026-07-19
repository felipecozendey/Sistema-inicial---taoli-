export type ExerciseItem = {
  id: string
  name: string
  sets: number
  reps: string
  weightKg: number
}

export const newExerciseId = () => Math.random().toString(36).substring(2, 9)

export function normalizeExercises(exercises: any[]): ExerciseItem[] {
  return exercises.map((e) => ({
    id: e.id || newExerciseId(),
    name: e.name || '',
    sets: e.sets || 3,
    reps: typeof e.reps === 'string' ? e.reps : String(e.reps || '10'),
    weightKg: e.weightKg ?? e.weight ?? 0,
  }))
}
