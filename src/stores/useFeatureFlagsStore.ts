import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'

export interface FeatureFlagRow {
  key: string
  label: string
  description: string
  enabled: boolean
}

export interface FeatureFlagsState {
  flags: Record<string, boolean>
  overrides: Record<string, boolean>
  loading: boolean
  initialized: boolean
  loadFlags: (userId?: string) => Promise<void>
  isEnabled: (key: string) => boolean
  areAllModulesDisabled: () => boolean
}

const DEFAULT_FLAGS: Record<string, boolean> = {
  tasks: true,
  habits: true,
  health: true,
  studies: true,
  finance: true,
  analytics: true,
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: DEFAULT_FLAGS,
  overrides: {},
  loading: false,
  initialized: false,

  loadFlags: async (userId?: string) => {
    set({ loading: true })
    try {
      // 1. Fetch global feature flags
      const { data, error } = await supabase.from('feature_flags').select('key, enabled')

      if (error) {
        console.warn('[useFeatureFlagsStore] Erro ao carregar feature_flags:', error.message)
      } else if (data) {
        const flagMap: Record<string, boolean> = { ...DEFAULT_FLAGS }
        data.forEach((row: { key: string; enabled: boolean }) => {
          flagMap[row.key] = row.enabled
        })
        set({ flags: flagMap })
      }

      // 2. Fetch user-level overrides if user is authenticated
      let uid = userId
      if (!uid) {
        const { data: authData } = await supabase.auth.getUser()
        uid = authData.user?.id
      }

      if (uid) {
        const { data: overrideData, error: overrideError } = await (supabase.from as any)(
          'user_feature_overrides',
        )
          .select('feature_key, enabled')
          .eq('user_id', uid)

        if (!overrideError && overrideData) {
          const overrideMap: Record<string, boolean> = {}
          overrideData.forEach((row: { feature_key: string; enabled: boolean }) => {
            overrideMap[row.feature_key] = row.enabled
          })
          set({ overrides: overrideMap })
        }
      }

      set({ initialized: true, loading: false })
    } catch (err) {
      console.error('[useFeatureFlagsStore] Falha ao sincronizar flags:', err)
      set({ loading: false, initialized: true })
    }
  },

  // Resolvedor de features: Flag global ON E (sem override OU override ON). Padrão: sem override = herda a global.
  isEnabled: (key: string) => {
    const { flags, overrides } = get()
    const globalEnabled = flags[key] ?? true
    if (!globalEnabled) return false

    // Se houver override por usuário, respeita o override
    if (key in overrides) {
      return Boolean(overrides[key])
    }
    return globalEnabled
  },

  areAllModulesDisabled: () => {
    const moduleKeys = ['tasks', 'habits', 'health', 'studies', 'finance', 'analytics']
    return moduleKeys.every((key) => !get().isEnabled(key))
  },
}))
