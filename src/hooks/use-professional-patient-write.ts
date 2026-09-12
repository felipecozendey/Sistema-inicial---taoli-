import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useProfessionalStore } from '@/stores/useProfessionalStore'
import type { NewTask, NewHabit } from '@/stores/store-data'
import { buildBodyMetricPayload } from '@/lib/body-metric-payload'

export function useProfessionalPatientWrite() {
  const activePatient = useProfessionalStore((s) => s.activePatient)
  const [saving, setSaving] = useState(false)

  const ensureContext = useCallback(
    (requiredScope: 'tarefas' | 'saude') => {
      if (!activePatient) {
        toast.error('Nenhum paciente selecionado.')
        return false
      }
      if (!activePatient.grantedPages.includes(requiredScope)) {
        toast.error(`Escopo de "${requiredScope}" não concedido pelo paciente.`)
        return false
      }
      return true
    },
    [activePatient],
  )

  // 1. TAREFAS: createTaskForPatient
  const createTaskForPatient = useCallback(
    async (task: NewTask) => {
      if (!ensureContext('tarefas') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Usuário não autenticado.')
          return null
        }

        const payload = {
          title: task.title,
          due_date: task.dueDate,
          scheduled_date: task.scheduledDate || null,
          energy_level: task.energyLevel || 1,
          priority: task.energyLevel === 3 ? 'high' : task.energyLevel === 2 ? 'medium' : 'low',
          estimated_time: task.estimatedTime || 15,
          tag_id: task.tagId || (task.tagIds && task.tagIds[0]) || null,
          tag_ids: task.tagIds || (task.tagId ? [task.tagId] : []),
          subtasks: task.subtasks || [],
          completed: false,
          user_id: activePatient.id,
          created_by: user.id,
        }

        const { data, error } = await (supabase as any)
          .from('tasks')
          .insert(payload)
          .select()
          .single()

        if (error || !data) {
          toast.error(error?.message || 'Erro ao criar tarefa para o paciente.')
          return null
        }

        toast.success(`Tarefa adicionada para ${activePatient.displayName}! ✨`)
        return data
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 2. TAREFAS: createHabitForPatient
  const createHabitForPatient = useCallback(
    async (habit: NewHabit) => {
      if (!ensureContext('tarefas') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Usuário não autenticado.')
          return null
        }

        const payload = {
          title: habit.title,
          frequency: habit.frequency,
          week_days: habit.weekDays || [],
          weekly_goal: habit.weeklyGoal || 0,
          target_completions: habit.targetCompletions || 1,
          tag_id: habit.tagId || null,
          completions: [],
          escudos: 2,
          frozen_dates: [],
          user_id: activePatient.id,
          created_by: user.id,
        }

        const { data, error } = await (supabase as any)
          .from('habits')
          .insert(payload)
          .select()
          .single()

        if (error || !data) {
          toast.error(error?.message || 'Erro ao criar hábito para o paciente.')
          return null
        }

        toast.success(`Hábito criado para ${activePatient.displayName}! 🌱`)
        return data
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 3. TAREFAS: update/delete task (apenas as que o próprio profissional criou)
  const updateTaskForPatient = useCallback(
    async (taskId: string, updates: Partial<NewTask>) => {
      if (!ensureContext('tarefas') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const dbUpdates: Record<string, any> = {}
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
        if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate
        if (updates.energyLevel !== undefined) {
          dbUpdates.energy_level = updates.energyLevel
          dbUpdates.priority =
            updates.energyLevel === 3 ? 'high' : updates.energyLevel === 2 ? 'medium' : 'low'
        }
        if (updates.estimatedTime !== undefined) dbUpdates.estimated_time = updates.estimatedTime
        if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks
        if (updates.tagId !== undefined) dbUpdates.tag_id = updates.tagId
        if (updates.tagIds !== undefined) dbUpdates.tag_ids = updates.tagIds

        const { error } = await (supabase as any)
          .from('tasks')
          .update(dbUpdates)
          .eq('id', taskId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar tarefa do paciente.')
          return false
        }
        toast.success('Tarefa atualizada!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteTaskForPatient = useCallback(
    async (taskId: string) => {
      if (!ensureContext('tarefas') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir tarefa.')
          return false
        }
        toast.success('Tarefa excluída!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 4. HÁBITOS: update/delete habit
  const updateHabitForPatient = useCallback(
    async (habitId: string, updates: Partial<NewHabit>) => {
      if (!ensureContext('tarefas') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const dbUpdates: Record<string, any> = {}
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency
        if (updates.weekDays !== undefined) dbUpdates.week_days = updates.weekDays
        if (updates.weeklyGoal !== undefined) dbUpdates.weekly_goal = updates.weeklyGoal
        if (updates.targetCompletions !== undefined)
          dbUpdates.target_completions = updates.targetCompletions
        if (updates.tagId !== undefined) dbUpdates.tag_id = updates.tagId

        const { error } = await (supabase as any)
          .from('habits')
          .update(dbUpdates)
          .eq('id', habitId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar hábito.')
          return false
        }
        toast.success('Hábito atualizado!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteHabitForPatient = useCallback(
    async (habitId: string) => {
      if (!ensureContext('tarefas') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', habitId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir hábito.')
          return false
        }
        toast.success('Hábito excluído!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 5. SAÚDE: Plano Alimentar (createDietPlanForPatient, update/delete)
  const createDietPlanForPatient = useCallback(
    async (
      name: string,
      time: string,
      items: {
        description: string
        quantity: string
        calories?: number
        carbsG?: number
        proteinG?: number
        fatG?: number
        fibersG?: number
        sodiumMg?: number
        allergens?: string | null
      }[] = [],
    ) => {
      if (!ensureContext('saude') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const { data: plan, error: pError } = await (supabase as any)
          .from('diet_plans')
          .insert({
            name,
            time,
            order_index: 0,
            user_id: activePatient.id,
            created_by: user.id,
          })
          .select()
          .single()

        if (pError || !plan) {
          toast.error('Erro ao criar refeição no plano do paciente.')
          return null
        }

        if (items.length > 0) {
          const { error: itemsError } = await (supabase as any).from('diet_plan_items').insert(
            items.map((it) => ({
              plan_id: plan.id,
              description: it.description,
              quantity: it.quantity,
              calories: it.calories || 0,
              carbs_g: it.carbsG || 0,
              protein_g: it.proteinG || 0,
              fat_g: it.fatG || 0,
              fibers_g: it.fibersG || 0,
              sodium_mg: it.sodiumMg || 0,
              allergens: it.allergens || null,
              created_by: user.id,
            })),
          )
          if (itemsError) {
            console.error('Error inserting diet items:', itemsError)
          }
        }

        toast.success(`Refeição adicionada ao plano de ${activePatient.displayName}! 🥗`)
        return plan
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const updateDietPlanForPatient = useCallback(
    async (planId: string, updates: { name?: string; time?: string }) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await (supabase as any)
          .from('diet_plans')
          .update(updates)
          .eq('id', planId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar refeição do plano.')
          return false
        }
        toast.success('Refeição atualizada!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const addDietPlanItemForPatient = useCallback(
    async (
      planId: string,
      item: {
        description: string
        quantity: string
        calories?: number
        carbs_g?: number
        protein_g?: number
        fat_g?: number
        fibers_g?: number
        sodium_mg?: number
        allergens?: string | null
      },
    ) => {
      if (!ensureContext('saude') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await (supabase as any)
          .from('diet_plan_items')
          .insert({
            plan_id: planId,
            description: item.description,
            quantity: item.quantity,
            calories: item.calories || 0,
            carbs_g: item.carbs_g || 0,
            protein_g: item.protein_g || 0,
            fat_g: item.fat_g || 0,
            fibers_g: item.fibers_g || 0,
            sodium_mg: item.sodium_mg || 0,
            allergens: item.allergens || null,
            created_by: user.id,
          })
          .select()
          .single()

        if (error || !data) {
          toast.error('Erro ao adicionar alimento à refeição.')
          return null
        }
        return data
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const updateDietPlanItemForPatient = useCallback(
    async (
      itemId: string,
      updates: {
        description?: string
        quantity?: string
        calories?: number
        carbs_g?: number
        protein_g?: number
        fat_g?: number
        fibers_g?: number
        sodium_mg?: number
        allergens?: string | null
      },
    ) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await (supabase as any)
          .from('diet_plan_items')
          .update(updates)
          .eq('id', itemId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar alimento.')
          return false
        }
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteDietPlanItemForPatient = useCallback(
    async (itemId: string) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('diet_plan_items')
          .delete()
          .eq('id', itemId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir alimento.')
          return false
        }
        toast.success('Alimento removido!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteDietPlanForPatient = useCallback(
    async (planId: string) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('diet_plans')
          .delete()
          .eq('id', planId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir refeição do plano.')
          return false
        }
        toast.success('Refeição excluída!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 6. SAÚDE: Receitas (createRecipeForPatient, delete)
  const createRecipeForPatient = useCallback(
    async (
      name: string,
      description: string,
      instructions: string,
      tags: string[],
      ingredients: { foodId: string; amount: string }[],
    ) => {
      if (!ensureContext('saude') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const { data: recipe, error: rError } = await (supabase as any)
          .from('nutrition_recipes')
          .insert({
            name,
            description,
            instructions,
            tags,
            user_id: activePatient.id,
            created_by: user.id,
          })
          .select()
          .single()

        if (rError || !recipe) {
          toast.error('Erro ao criar receita para o paciente.')
          return null
        }

        if (ingredients.length > 0) {
          const { error: ingError } = await (supabase as any).from('recipe_ingredients').insert(
            ingredients.map((ing) => ({
              recipe_id: recipe.id,
              food_id: ing.foodId,
              amount: ing.amount,
            })),
          )
          if (ingError) {
            console.error('Error adding recipe ingredients:', ingError)
          }
        }

        toast.success(`Receita prescrita para ${activePatient.displayName}! 🍲`)
        return recipe
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const updateRecipeForPatient = useCallback(
    async (
      recipeId: string,
      updates: {
        name?: string
        description?: string
        instructions?: string
        tags?: string[]
        ingredients?: { foodId: string; amount: string }[]
      },
    ) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const dbUpdates: Record<string, any> = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.description !== undefined) dbUpdates.description = updates.description
        if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags

        const { error } = await (supabase as any)
          .from('nutrition_recipes')
          .update(dbUpdates)
          .eq('id', recipeId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar receita.')
          return false
        }

        if (updates.ingredients) {
          await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
          if (updates.ingredients.length > 0) {
            await (supabase as any).from('recipe_ingredients').insert(
              updates.ingredients.map((ing) => ({
                recipe_id: recipeId,
                food_id: ing.foodId,
                amount: ing.amount,
              })),
            )
          }
        }

        toast.success('Receita atualizada!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteRecipeForPatient = useCallback(
    async (recipeId: string) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('nutrition_recipes')
          .delete()
          .eq('id', recipeId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir receita.')
          return false
        }
        toast.success('Receita excluída!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 7. SAÚDE: Raio-X Corporal / Medidas (createBodyMetricForPatient, update, delete)
  const createBodyMetricForPatient = useCallback(
    async (metric: any) => {
      if (!ensureContext('saude') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const payload = {
          ...buildBodyMetricPayload(metric),
          user_id: activePatient.id,
          created_by: user.id,
        }

        const { data, error } = await (supabase as any)
          .from('body_metrics')
          .insert(payload)
          .select()
          .single()

        if (error || !data) {
          toast.error(error?.message || 'Erro ao registrar medidas do paciente.')
          return null
        }

        toast.success(`Avaliação física registrada para ${activePatient.displayName}! 📏`)
        return data
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const updateBodyMetricForPatient = useCallback(
    async (metricId: string, metric: any) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const payload = buildBodyMetricPayload(metric)

        const { error } = await (supabase as any)
          .from('body_metrics')
          .update(payload)
          .eq('id', metricId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar avaliação.')
          return false
        }
        toast.success('Avaliação atualizada!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteBodyMetricForPatient = useCallback(
    async (metricId: string) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('body_metrics')
          .delete()
          .eq('id', metricId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir avaliação.')
          return false
        }
        toast.success('Avaliação excluída!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 8. SAÚDE: Ato Energético (createMetabolicLogForPatient, delete)
  const createMetabolicLogForPatient = useCallback(
    async (logData: {
      formula: string
      tmb: number
      naf: string
      injuryFactor?: number
      injury_factor?: number
      ventaTarget?: number
      venta_target?: number
      extraActivities?: any[]
      extra_activities?: any[]
      weightGoal?: number | null
      weight_goal?: number | null
      goalDays?: number | null
      goal_days?: number | null
      date?: string
    }) => {
      if (!ensureContext('saude') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const injury = logData.injuryFactor ?? logData.injury_factor ?? 1.0
        const venta = logData.ventaTarget ?? logData.venta_target ?? 0
        const extras = logData.extraActivities ?? logData.extra_activities ?? []
        const weightG = logData.weightGoal ?? logData.weight_goal ?? null
        const daysG = logData.goalDays ?? logData.goal_days ?? null

        const payload = {
          date: logData.date || new Date().toISOString().slice(0, 10),
          formula: logData.formula,
          tmb: logData.tmb,
          naf: logData.naf,
          injury_factor: injury,
          venta_target: venta,
          extra_activities: extras,
          weight_goal: weightG,
          goal_days: daysG,
          user_id: activePatient.id,
          created_by: user.id,
        }

        const { data, error } = await (supabase as any)
          .from('metabolic_logs')
          .insert(payload)
          .select()
          .single()

        if (error || !data) {
          toast.error('Erro ao registrar ato energético.')
          return null
        }

        toast.success(`Cálculo energético salvo para ${activePatient.displayName}! ⚡`)
        return data
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const updateMetabolicLogForPatient = useCallback(
    async (
      logId: string,
      logData: {
        formula?: string
        tmb?: number
        naf?: string
        injuryFactor?: number
        injury_factor?: number
        ventaTarget?: number
        venta_target?: number
        extraActivities?: any[]
        extra_activities?: any[]
        weightGoal?: number | null
        weight_goal?: number | null
        goalDays?: number | null
        goal_days?: number | null
        date?: string
      },
    ) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const dbUpdates: Record<string, any> = {}
        if (logData.formula !== undefined) dbUpdates.formula = logData.formula
        if (logData.tmb !== undefined) dbUpdates.tmb = logData.tmb
        if (logData.naf !== undefined) dbUpdates.naf = logData.naf
        if (logData.injuryFactor !== undefined || logData.injury_factor !== undefined) {
          dbUpdates.injury_factor = logData.injuryFactor ?? logData.injury_factor
        }
        if (logData.ventaTarget !== undefined || logData.venta_target !== undefined) {
          dbUpdates.venta_target = logData.ventaTarget ?? logData.venta_target
        }
        if (logData.extraActivities !== undefined || logData.extra_activities !== undefined) {
          dbUpdates.extra_activities = logData.extraActivities ?? logData.extra_activities
        }
        if (logData.weightGoal !== undefined || logData.weight_goal !== undefined) {
          dbUpdates.weight_goal = logData.weightGoal ?? logData.weight_goal
        }
        if (logData.goalDays !== undefined || logData.goal_days !== undefined) {
          dbUpdates.goal_days = logData.goalDays ?? logData.goal_days
        }
        if (logData.date !== undefined) dbUpdates.date = logData.date

        const { error } = await (supabase as any)
          .from('metabolic_logs')
          .update(dbUpdates)
          .eq('id', logId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar cálculo energético.')
          return false
        }
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteMetabolicLogForPatient = useCallback(
    async (logId: string) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('metabolic_logs')
          .delete()
          .eq('id', logId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir ato energético.')
          return false
        }
        toast.success('Registro energético excluído!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  // 9. SAÚDE: Ficha de Treino (createWorkoutRoutineForPatient, delete)
  const createWorkoutRoutineForPatient = useCallback(
    async (title: string, exercises: any[], description?: string) => {
      if (!ensureContext('saude') || !activePatient) return null
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const payload = {
          title,
          exercises,
          description: description || '',
          user_id: activePatient.id,
          created_by: user.id,
        }

        const { data, error } = await (supabase as any)
          .from('workout_routines')
          .insert(payload)
          .select()
          .single()

        if (error || !data) {
          toast.error('Erro ao prescrever ficha de treino.')
          return null
        }

        toast.success(`Ficha de treino prescrita para ${activePatient.displayName}! 🏋️`)
        return data
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const updateWorkoutRoutineForPatient = useCallback(
    async (
      routineId: string,
      updates: { title?: string; exercises?: any[]; description?: string },
    ) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await (supabase as any)
          .from('workout_routines')
          .update(updates)
          .eq('id', routineId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao atualizar ficha de treino.')
          return false
        }
        toast.success('Ficha atualizada!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  const deleteWorkoutRoutineForPatient = useCallback(
    async (routineId: string) => {
      if (!ensureContext('saude') || !activePatient) return false
      setSaving(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return false

        const { error } = await supabase
          .from('workout_routines')
          .delete()
          .eq('id', routineId)
          .eq('created_by', user.id)

        if (error) {
          toast.error('Erro ao excluir ficha de treino.')
          return false
        }
        toast.success('Ficha excluída!')
        return true
      } finally {
        setSaving(false)
      }
    },
    [activePatient, ensureContext],
  )

  return {
    activePatient,
    saving,
    // Tarefas
    createTaskForPatient,
    updateTaskForPatient,
    deleteTaskForPatient,
    createHabitForPatient,
    updateHabitForPatient,
    deleteHabitForPatient,
    // Saúde
    createDietPlanForPatient,
    deleteDietPlanForPatient,
    createRecipeForPatient,
    updateRecipeForPatient,
    deleteRecipeForPatient,
    createBodyMetricForPatient,
    updateBodyMetricForPatient,
    deleteBodyMetricForPatient,
    createMetabolicLogForPatient,
    deleteMetabolicLogForPatient,
    createWorkoutRoutineForPatient,
    updateWorkoutRoutineForPatient,
    deleteWorkoutRoutineForPatient,
    updateDietPlanForPatient,
    addDietPlanItemForPatient,
    updateDietPlanItemForPatient,
    deleteDietPlanItemForPatient,
    updateMetabolicLogForPatient,
  }
}
