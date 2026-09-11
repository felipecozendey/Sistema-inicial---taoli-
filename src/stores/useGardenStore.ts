import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useTaskSettingsStore } from './useTaskSettingsStore'

export interface GardenState {
  id?: string
  user_id?: string
  points: number
  level: number
  plot_count?: number // legado mantido para compatibilidade de tipagem
  streak_days: number
  last_action_at?: string | null
}

interface GardenStore {
  state: GardenState
  isLoading: boolean
  fetchGarden: () => Promise<void>
  addPoints: (points: number, reason?: string) => Promise<void>
  spendPoints: (points: number) => Promise<boolean>
  onTaskCompleted: (taskId: string, taskTitle: string) => Promise<void>
  onHabitCompleted: (habitId: string, habitTitle: string) => Promise<void>
}

export const useGardenStore = create<GardenStore>((set, get) => ({
  state: {
    points: 0,
    level: 1,
    plot_count: 6,
    streak_days: 1,
  },
  isLoading: false,

  fetchGarden: async () => {
    set({ isLoading: true })
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ isLoading: false })
        return
      }

      // Fetch garden state
      let { data: stateData, error: stateError } = await supabase
        .from('garden_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!stateData && !stateError) {
        // Create initial garden state with 50 starting points so user can test right away
        const { data: newState, error: insertError } = await supabase
          .from('garden_state')
          .insert({
            user_id: user.id,
            points: 50,
            level: 1,
            plot_count: 6,
            streak_days: 1,
          })
          .select()
          .single()

        if (!insertError) {
          stateData = newState
        }
      }

      if (stateData) {
        set({
          state: {
            id: stateData.id,
            user_id: stateData.user_id,
            points: Number(stateData.points || 0),
            level: Number(stateData.level || 1),
            plot_count: Number(stateData.plot_count || 6),
            streak_days: Number(stateData.streak_days || 1),
            last_action_at: stateData.last_action_at,
          },
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (err) {
      console.warn('Error loading garden state:', err)
      set({ isLoading: false })
    }
  },

  addPoints: async (amount: number, reason?: string) => {
    const prev = get().state
    const settings = useTaskSettingsStore.getState().settings
    const ptsPerLevel = settings.points_per_level || 100

    const newPoints = prev.points + amount
    const newLevel = Math.max(1, Math.floor(newPoints / ptsPerLevel) + 1)
    const leveledUp = newLevel > prev.level

    set({
      state: {
        ...prev,
        points: newPoints,
        level: newLevel,
        last_action_at: new Date().toISOString(),
      },
    })

    if (leveledUp) {
      toast({
        title: '🎉 Subiu de nível!',
        description: `Parabéns! Seu Jardim atingiu o Nível ${newLevel}!`,
      })
    } else if (reason) {
      toast({
        title: `🌱 +${amount} pts para o seu jardim!`,
        description: reason,
      })
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('garden_state').upsert(
        {
          user_id: user.id,
          points: newPoints,
          level: newLevel,
          streak_days: prev.streak_days,
          last_action_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
    } catch (err) {
      console.warn('Error syncing garden points:', err)
    }
  },

  spendPoints: async (amount: number) => {
    const prev = get().state
    if (prev.points < amount) {
      toast({
        title: 'Pontos insuficientes',
        description: `Você precisa de ${amount} pts para comprar este item (você tem ${prev.points}).`,
        variant: 'destructive',
      })
      return false
    }

    const newPoints = prev.points - amount
    // Otimista
    set({
      state: {
        ...prev,
        points: newPoints,
        last_action_at: new Date().toISOString(),
      },
    })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return true

      const { error } = await supabase
        .from('garden_state')
        .update({
          points: newPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) {
        // Rollback
        set({ state: prev })
        toast({
          title: 'Erro ao debitar pontos',
          description: 'Não foi possível concluir a transação. Tente novamente.',
          variant: 'destructive',
        })
        return false
      }
      return true
    } catch (err) {
      set({ state: prev })
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível debitar os pontos.',
        variant: 'destructive',
      })
      return false
    }
  },

  onTaskCompleted: async (_taskId: string, taskTitle: string) => {
    const settings = useTaskSettingsStore.getState().settings
    const pts = settings.points_per_task || 10
    await get().addPoints(pts, `Tarefa concluída: "${taskTitle}"`)
  },

  onHabitCompleted: async (_habitId: string, habitTitle: string) => {
    const settings = useTaskSettingsStore.getState().settings
    const pts = settings.points_per_habit || 5
    await get().addPoints(pts, `Hábito cumprido: "${habitTitle}"`)
  },
}))
