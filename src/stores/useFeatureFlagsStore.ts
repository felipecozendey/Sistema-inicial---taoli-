import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'
import { FeatureFlag } from './useMasterStore'

interface FeatureFlagsState {
  flags: Record<string, boolean>
  loading: boolean
  initialized: boolean
  loadFlags: () => Promise<void>
  isFeatureEnabled: (key: string) => boolean
}

// Default modules: all true initially
const DEFAULT_FLAGS: Record<string, boolean> = {
  tasks: true,
  health: true,
  studies: true,
  finance: true,
  analytics: true,
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: DEFAULT_FLAGS,
  loading: false,
  initialized: false,

  loadFlags: async () => {
    try {
      set({ loading: true })
      const { data, error } = await (supabase.from as any)('feature_flags').select('key, enabled')
      if (error) throw error

      if (data && data.length > 0) {
        const flagMap: Record<string, boolean> = { ...DEFAULT_FLAGS }
        data.forEach((row: any) => {
          flagMap[row.key] = Boolean(row.enabled)
        })
        set({ flags: flagMap, loading: false, initialized: true })
      } else {
        set({ loading: false, initialized: true })
      }
    } catch (err) {
      console.warn('[useFeatureFlagsStore] Erro ao carregar feature flags:', err)
      set({ loading: false, initialized: true })
    }
  },

  isFeatureEnabled: (key: string) => {
    const flags = get().flags
    return flags[key] !== undefined ? flags[key] : true
  },
}))
