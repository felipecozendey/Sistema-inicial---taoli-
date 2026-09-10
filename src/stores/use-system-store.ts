import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface GlobalFood {
  id: string
  name: string
  category: string
  baseUnit: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  fibersG: number
  sodiumMg: number
  allergens: string | null
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GlobalExercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string | null
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado' | null
  instructions: string | null
  videoUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type NewGlobalFoodInput = Omit<GlobalFood, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateGlobalFoodInput = Partial<Omit<GlobalFood, 'id' | 'createdAt' | 'updatedAt'>>

export type NewGlobalExerciseInput = Omit<GlobalExercise, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateGlobalExerciseInput = Partial<
  Omit<GlobalExercise, 'id' | 'createdAt' | 'updatedAt'>
>

interface SystemState {
  globalFoods: GlobalFood[]
  globalExercises: GlobalExercise[]
  loading: boolean
  error: string | null

  loadSystemData: () => Promise<void>

  // Foods
  createFood: (food: NewGlobalFoodInput) => Promise<boolean>
  updateFood: (id: string, updates: UpdateGlobalFoodInput) => Promise<boolean>
  deleteFood: (id: string) => Promise<boolean>
  bulkImportFoods: (
    foods: NewGlobalFoodInput[],
    replaceExisting?: boolean,
  ) => Promise<{ inserted: number; updated: number }>

  // Exercises
  createExercise: (exercise: NewGlobalExerciseInput) => Promise<boolean>
  updateExercise: (id: string, updates: UpdateGlobalExerciseInput) => Promise<boolean>
  deleteExercise: (id: string) => Promise<boolean>
}

// Helper to log administrative actions to admin_audit_logs
async function logAudit(action: string, details: Record<string, unknown>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await (supabase.from('admin_audit_logs') as any).insert({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? 'Master',
      action,
      target_user_id: null,
      target_email: null,
      details,
    })
  } catch {
    // Non-blocking log
  }
}

function mapFoodFromDb(row: Record<string, any>): GlobalFood {
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'Geral',
    baseUnit: row.base_unit || '100g',
    calories: Number(row.calories || 0),
    carbsG: Number(row.carbs_g || 0),
    proteinG: Number(row.protein_g || 0),
    fatG: Number(row.fat_g || 0),
    fibersG: Number(row.fibers_g || 0),
    sodiumMg: Number(row.sodium_mg || 0),
    allergens: row.allergens || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isActive: Boolean(row.is_active ?? true),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapExerciseFromDb(row: Record<string, any>): GlobalExercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment || null,
    difficulty: row.difficulty || null,
    instructions: row.instructions || null,
    videoUrl: row.video_url || '',
    isActive: Boolean(row.is_active ?? true),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const useSystemStore = create<SystemState>((set, get) => ({
  globalFoods: [],
  globalExercises: [],
  loading: false,
  error: null,

  loadSystemData: async () => {
    set({ loading: true, error: null })
    try {
      const [foodsRes, exercisesRes] = await Promise.all([
        supabase.from('global_foods').select('*').order('name', { ascending: true }),
        supabase.from('global_exercises').select('*').order('name', { ascending: true }),
      ])

      if (foodsRes.error) throw foodsRes.error
      if (exercisesRes.error) throw exercisesRes.error

      set({
        globalFoods: (foodsRes.data || []).map(mapFoodFromDb),
        globalExercises: (exercisesRes.data || []).map(mapExerciseFromDb),
        loading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados do Sistema'
      set({ error: message, loading: false })
      toast.error('Erro ao carregar dados do Sistema')
    }
  },

  createFood: async (input) => {
    const tempId = 'temp-' + Date.now()
    const nowIso = new Date().toISOString()
    const previousFoods = get().globalFoods

    const optimisticFood: GlobalFood = {
      ...input,
      id: tempId,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    set({ globalFoods: [optimisticFood, ...previousFoods] })

    try {
      const { data, error } = await supabase
        .from('global_foods')
        .insert({
          name: input.name,
          category: input.category,
          base_unit: input.baseUnit,
          calories: input.calories,
          carbs_g: input.carbsG,
          protein_g: input.proteinG,
          fat_g: input.fatG,
          fibers_g: input.fibersG,
          sodium_mg: input.sodiumMg,
          allergens: input.allergens,
          tags: input.tags,
          is_active: input.isActive,
        })
        .select()
        .single()

      if (error) throw error

      const createdFood = mapFoodFromDb(data)
      set({
        globalFoods: get().globalFoods.map((f) => (f.id === tempId ? createdFood : f)),
      })

      await logAudit('create_food', { food_id: createdFood.id, name: createdFood.name })
      toast.success(`Alimento "${createdFood.name}" cadastrado! 🎉`)
      return true
    } catch (err) {
      set({ globalFoods: previousFoods })
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar alimento'
      toast.error(msg)
      return false
    }
  },

  updateFood: async (id, updates) => {
    const previousFoods = get().globalFoods
    const target = previousFoods.find((f) => f.id === id)
    if (!target) return false

    const nowIso = new Date().toISOString()
    const optimisticUpdated: GlobalFood = {
      ...target,
      ...updates,
      updatedAt: nowIso,
    }

    set({
      globalFoods: previousFoods.map((f) => (f.id === id ? optimisticUpdated : f)),
    })

    try {
      const dbPayload: Record<string, any> = {}
      if (updates.name !== undefined) dbPayload.name = updates.name
      if (updates.category !== undefined) dbPayload.category = updates.category
      if (updates.baseUnit !== undefined) dbPayload.base_unit = updates.baseUnit
      if (updates.calories !== undefined) dbPayload.calories = updates.calories
      if (updates.carbsG !== undefined) dbPayload.carbs_g = updates.carbsG
      if (updates.proteinG !== undefined) dbPayload.protein_g = updates.proteinG
      if (updates.fatG !== undefined) dbPayload.fat_g = updates.fatG
      if (updates.fibersG !== undefined) dbPayload.fibers_g = updates.fibersG
      if (updates.sodiumMg !== undefined) dbPayload.sodium_mg = updates.sodiumMg
      if (updates.allergens !== undefined) dbPayload.allergens = updates.allergens
      if (updates.tags !== undefined) dbPayload.tags = updates.tags
      if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive

      const { data, error } = await (supabase.from('global_foods') as any)
        .update(dbPayload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const saved = mapFoodFromDb(data)
      set({
        globalFoods: get().globalFoods.map((f) => (f.id === id ? saved : f)),
      })

      await logAudit('update_food', { food_id: id, name: target.name, updates: dbPayload })
      toast.success(`Alimento "${saved.name}" atualizado! 🎉`)
      return true
    } catch (err) {
      set({ globalFoods: previousFoods })
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar alimento'
      toast.error(msg)
      return false
    }
  },

  deleteFood: async (id) => {
    const previousFoods = get().globalFoods
    const target = previousFoods.find((f) => f.id === id)
    if (!target) return false

    set({
      globalFoods: previousFoods.filter((f) => f.id !== id),
    })

    try {
      const { error } = await supabase.from('global_foods').delete().eq('id', id)
      if (error) throw error

      await logAudit('delete_food', { food_id: id, name: target.name })
      toast.success(`Alimento "${target.name}" excluído!`)
      return true
    } catch (err) {
      set({ globalFoods: previousFoods })
      const msg = err instanceof Error ? err.message : 'Erro ao excluir alimento'
      toast.error(msg)
      return false
    }
  },

  bulkImportFoods: async (foods, replaceExisting = true) => {
    const previousFoods = get().globalFoods
    try {
      let insertedCount = 0
      let updatedCount = 0

      const existingMap = new Map<string, GlobalFood>()
      previousFoods.forEach((f) => {
        existingMap.set(f.name.trim().toLowerCase(), f)
      })

      const toInsert: any[] = []
      const toUpdate: { id: string; payload: any }[] = []

      foods.forEach((item) => {
        const key = item.name.trim().toLowerCase()
        const match = existingMap.get(key)
        const row = {
          name: item.name.trim(),
          category: item.category || 'Geral',
          base_unit: item.baseUnit || '100g',
          calories: item.calories,
          carbs_g: item.carbsG,
          protein_g: item.proteinG,
          fat_g: item.fatG,
          fibers_g: item.fibersG,
          sodium_mg: item.sodiumMg,
          allergens: item.allergens || null,
          tags: item.tags || [],
          is_active: item.isActive ?? true,
        }

        if (match && replaceExisting) {
          toUpdate.push({ id: match.id, payload: row })
        } else if (!match) {
          toInsert.push(row)
        }
      })

      if (toInsert.length > 0) {
        const { error } = await supabase.from('global_foods').insert(toInsert)
        if (error) throw error
        insertedCount = toInsert.length
      }

      for (const item of toUpdate) {
        const { error } = await supabase.from('global_foods').update(item.payload).eq('id', item.id)
        if (!error) {
          updatedCount++
        }
      }

      const { data: refreshed } = await supabase
        .from('global_foods')
        .select('*')
        .order('name', { ascending: true })

      if (refreshed) {
        set({ globalFoods: refreshed.map(mapFoodFromDb) })
      }

      await logAudit('import_foods', {
        inserted: insertedCount,
        updated: updatedCount,
        total: foods.length,
        replace_existing: replaceExisting,
      })

      toast.success(`Importação concluída! ${insertedCount} novos, ${updatedCount} atualizados.`)
      return { inserted: insertedCount, updated: updatedCount }
    } catch (err) {
      set({ globalFoods: previousFoods })
      const msg = err instanceof Error ? err.message : 'Erro ao importar tabela de alimentos'
      toast.error(msg)
      throw err
    }
  },

  createExercise: async (input) => {
    const tempId = 'temp-' + Date.now()
    const nowIso = new Date().toISOString()
    const previousExercises = get().globalExercises

    const optimisticExercise: GlobalExercise = {
      ...input,
      id: tempId,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    set({ globalExercises: [optimisticExercise, ...previousExercises] })

    try {
      const { data, error } = await supabase
        .from('global_exercises')
        .insert({
          name: input.name,
          muscle_group: input.muscleGroup,
          equipment: input.equipment,
          difficulty: input.difficulty,
          instructions: input.instructions,
          video_url: input.videoUrl,
          is_active: input.isActive,
        })
        .select()
        .single()

      if (error) throw error

      const createdExercise = mapExerciseFromDb(data)
      set({
        globalExercises: get().globalExercises.map((e) => (e.id === tempId ? createdExercise : e)),
      })

      await logAudit('create_exercise', {
        exercise_id: createdExercise.id,
        name: createdExercise.name,
        muscle_group: createdExercise.muscleGroup,
      })
      toast.success(`Exercício "${createdExercise.name}" cadastrado! 🏋️`)
      return true
    } catch (err) {
      set({ globalExercises: previousExercises })
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar exercício'
      toast.error(msg)
      return false
    }
  },

  updateExercise: async (id, updates) => {
    const previousExercises = get().globalExercises
    const target = previousExercises.find((e) => e.id === id)
    if (!target) return false

    const nowIso = new Date().toISOString()
    const optimisticUpdated: GlobalExercise = {
      ...target,
      ...updates,
      updatedAt: nowIso,
    }

    set({
      globalExercises: previousExercises.map((e) => (e.id === id ? optimisticUpdated : e)),
    })

    try {
      const dbPayload: Record<string, any> = {}
      if (updates.name !== undefined) dbPayload.name = updates.name
      if (updates.muscleGroup !== undefined) dbPayload.muscle_group = updates.muscleGroup
      if (updates.equipment !== undefined) dbPayload.equipment = updates.equipment
      if (updates.difficulty !== undefined) dbPayload.difficulty = updates.difficulty
      if (updates.instructions !== undefined) dbPayload.instructions = updates.instructions
      if (updates.videoUrl !== undefined) dbPayload.video_url = updates.videoUrl
      if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive

      const { data, error } = await (supabase.from('global_exercises') as any)
        .update(dbPayload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const saved = mapExerciseFromDb(data)
      set({
        globalExercises: get().globalExercises.map((e) => (e.id === id ? saved : e)),
      })

      await logAudit('update_exercise', {
        exercise_id: id,
        name: target.name,
        updates: dbPayload,
      })
      toast.success(`Exercício "${saved.name}" atualizado! 🏋️`)
      return true
    } catch (err) {
      set({ globalExercises: previousExercises })
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar exercício'
      toast.error(msg)
      return false
    }
  },

  deleteExercise: async (id) => {
    const previousExercises = get().globalExercises
    const target = previousExercises.find((e) => e.id === id)
    if (!target) return false

    set({
      globalExercises: previousExercises.filter((e) => e.id !== id),
    })

    try {
      const { error } = await supabase.from('global_exercises').delete().eq('id', id)
      if (error) throw error

      await logAudit('delete_exercise', { exercise_id: id, name: target.name })
      toast.success(`Exercício "${target.name}" excluído!`)
      return true
    } catch (err) {
      set({ globalExercises: previousExercises })
      const msg = err instanceof Error ? err.message : 'Erro ao excluir exercício'
      toast.error(msg)
      return false
    }
  },
}))
