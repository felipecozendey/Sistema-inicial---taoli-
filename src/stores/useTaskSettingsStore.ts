import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface TaskSystemSettings {
  id: string
  points_per_task: number
  points_per_habit: number
  bonus_streak: number
  points_per_level: number
  unlock_plot_cost: number
  show_garden: boolean
  show_week_day_tabs: boolean
}

export const DEFAULT_TASK_SETTINGS: TaskSystemSettings = {
  id: 'default',
  points_per_task: 10,
  points_per_habit: 5,
  bonus_streak: 15,
  points_per_level: 100,
  unlock_plot_cost: 50,
  show_garden: true,
  show_week_day_tabs: true,
}

interface TaskSettingsState {
  settings: TaskSystemSettings
  isLoading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<TaskSystemSettings>, userEmail?: string) => Promise<boolean>
  resetToDefaults: (userEmail?: string) => Promise<boolean>
}

export const useTaskSettingsStore = create<TaskSettingsState>((set, get) => ({
  settings: DEFAULT_TASK_SETTINGS,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('task_system_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle()

      if (error) {
        console.warn('Could not load task_system_settings, using defaults:', error.message)
        set({ settings: DEFAULT_TASK_SETTINGS, isLoading: false })
        return
      }

      if (data) {
        set({
          settings: {
            id: data.id || 'default',
            points_per_task: Number(data.points_per_task ?? 10),
            points_per_habit: Number(data.points_per_habit ?? 5),
            bonus_streak: Number(data.bonus_streak ?? 15),
            points_per_level: Number(data.points_per_level ?? 100),
            unlock_plot_cost: Number(data.unlock_plot_cost ?? 50),
            show_garden: data.show_garden ?? true,
            show_week_day_tabs: data.show_week_day_tabs ?? true,
          },
          isLoading: false,
        })
      } else {
        set({ settings: DEFAULT_TASK_SETTINGS, isLoading: false })
      }
    } catch (err) {
      console.warn('Error fetching task settings:', err)
      set({ settings: DEFAULT_TASK_SETTINGS, isLoading: false })
    }
  },

  updateSettings: async (newSettings: Partial<TaskSystemSettings>, userEmail?: string) => {
    const previous = get().settings
    const merged = { ...previous, ...newSettings }
    set({ settings: merged })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from('task_system_settings').upsert({
        id: 'default',
        ...merged,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        set({ settings: previous })
        toast({
          title: 'Erro ao salvar configurações',
          description: error.message,
          variant: 'destructive',
        })
        return false
      }

      // Log in admin_audit_logs
      try {
        await supabase.from('admin_audit_logs').insert({
          actor_id: user?.id,
          actor_email: userEmail || user?.email || 'admin',
          action: 'update_task_system_settings',
          details: {
            previous: { ...previous } as any,
            updated: { ...merged } as any,
          },
        } as any)
      } catch (logErr) {
        console.warn('Failed to register audit log:', logErr)
      }

      toast({
        title: 'Configurações salvas',
        description: 'Parâmetros de Hábitos e Tarefas atualizados com sucesso.',
      })
      return true
    } catch (err: any) {
      set({ settings: previous })
      toast({
        title: 'Erro inesperado',
        description: err.message || 'Falha ao salvar configurações',
        variant: 'destructive',
      })
      return false
    }
  },

  resetToDefaults: async (userEmail?: string) => {
    return get().updateSettings(DEFAULT_TASK_SETTINGS, userEmail)
  },
}))
