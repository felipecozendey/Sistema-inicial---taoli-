import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface FeatureCardItem {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

export interface HowItWorksStep {
  step: number
  title: string
  description: string
}

export interface SiteSettingsData {
  app_name: string
  hero_title: string
  hero_subtitle: string
  cta_primary_label: string
  cta_secondary_label: string
  login_title: string
  login_subtitle: string
  footer_message: string
  features: FeatureCardItem[]
  steps: HowItWorksStep[]
}

export interface ContentFlagsData {
  hero: boolean
  features_section: boolean
  how_it_works: boolean
  final_cta: boolean
  footer: boolean
  public_signup: boolean
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  app_name: 'VibeCoding Tarefas',
  hero_title: 'Organize sua vida com o poder do VibeCoding',
  hero_subtitle:
    'Tarefas, hábitos, saúde física e mental, estudos e finanças pessoais em um ecossistema gamificado e ultra-rápido.',
  cta_primary_label: 'Entrar',
  cta_secondary_label: 'Criar conta',
  login_title: 'Bem-vindo de volta!',
  login_subtitle: 'Acesse sua conta para continuar evoluindo suas metas.',
  footer_message: 'Desenvolvido com foco em alta performance e simplicidade.',
  features: [
    {
      id: 'tasks',
      title: 'Tarefas e Hábitos',
      description:
        'Gerencie afazeres diários com streaks gamificados, prioridades e escudo de hábitos.',
      icon: 'CheckSquare',
      color: '#58CC02',
    },
    {
      id: 'health',
      title: 'Saúde e Treinos',
      description: 'Acompanhe antropometria, nutrição, jejum intermitente, treinos e saúde mental.',
      icon: 'HeartPulse',
      color: '#FF4B4B',
    },
    {
      id: 'studies',
      title: 'Estudos e Flashcards',
      description:
        'Cadernos inteligentes com repetição espaçada (SRS) e decks dinâmicos de aprendizado.',
      icon: 'GraduationCap',
      color: '#FFC800',
    },
    {
      id: 'finance',
      title: 'Finanças Pessoais',
      description:
        'Transações, contas bancárias, metas de investimento e demonstrativos detalhados.',
      icon: 'Wallet',
      color: '#1CB0F6',
    },
    {
      id: 'analytics',
      title: 'Relatórios e Métricas',
      description:
        'Visão holística de sua evolução pessoal e produtividade com gráficos interativos.',
      icon: 'BarChart2',
      color: '#CE82FF',
    },
  ],
  steps: [
    {
      step: 1,
      title: 'Planeje seu dia',
      description:
        'Cadastre tarefas e defina hábitos essenciais para manter sua consistência diária.',
    },
    {
      step: 2,
      title: 'Monitore sua evolução',
      description:
        'Registre nutrição, treinos, estudos e finanças em uma interface veloz e intuitiva.',
    },
    {
      step: 3,
      title: 'Alcance novos patamares',
      description: 'Suba de nível com streaks contínuos e relatórios em tempo real sem atrito.',
    },
  ],
}

export const DEFAULT_CONTENT_FLAGS: ContentFlagsData = {
  hero: true,
  features_section: true,
  how_it_works: true,
  final_cta: true,
  footer: true,
  public_signup: true,
}

interface SiteSettingsState {
  settings: SiteSettingsData
  flags: ContentFlagsData
  loading: boolean
  initialized: boolean
  loadSiteData: () => Promise<void>
  updateSetting: <K extends keyof SiteSettingsData>(
    key: K,
    value: SiteSettingsData[K],
  ) => Promise<boolean>
  toggleContentFlag: (key: keyof ContentFlagsData, enabled: boolean) => Promise<boolean>
  restoreDefaults: () => Promise<boolean>
}

export const useSiteSettingsStore = create<SiteSettingsState>((set, get) => ({
  settings: DEFAULT_SITE_SETTINGS,
  flags: DEFAULT_CONTENT_FLAGS,
  loading: false,
  initialized: false,

  loadSiteData: async () => {
    set({ loading: true })
    try {
      const dbFrom = supabase.from as any
      const [settingsRes, flagsRes] = await Promise.all([
        dbFrom('site_settings').select('key, value'),
        dbFrom('content_flags').select('key, enabled'),
      ])

      const newSettings: SiteSettingsData = { ...DEFAULT_SITE_SETTINGS }
      if (settingsRes.data && Array.isArray(settingsRes.data)) {
        settingsRes.data.forEach((row: { key: string; value: any }) => {
          if (row.key in newSettings) {
            // Se vier parseado ou string json
            let val = row.value
            if (typeof val === 'string') {
              try {
                // Tenta decodificar se for string encapsulada
                val = JSON.parse(val)
              } catch {
                // mantem string pura
              }
            }
            ;(newSettings as any)[row.key] = val
          }
        })
      }

      const newFlags: ContentFlagsData = { ...DEFAULT_CONTENT_FLAGS }
      if (flagsRes.data && Array.isArray(flagsRes.data)) {
        flagsRes.data.forEach((row: { key: string; enabled: boolean }) => {
          if (row.key in newFlags) {
            ;(newFlags as any)[row.key] = Boolean(row.enabled)
          }
        })
      }

      set({
        settings: newSettings,
        flags: newFlags,
        loading: false,
        initialized: true,
      })
    } catch (err) {
      console.warn('[useSiteSettingsStore] Falha ao buscar dados do site, usando defaults:', err)
      set({ loading: false, initialized: true })
    }
  },

  updateSetting: async (key, value) => {
    const prevSettings = get().settings
    const updated = { ...prevSettings, [key]: value }

    // Atualização otimista
    set({ settings: updated })

    try {
      const dbFrom = supabase.from as any
      const { error } = await dbFrom('site_settings').upsert({
        key,
        value: value as any,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success('Configuração salva com sucesso!')
      return true
    } catch (err: any) {
      console.error('[useSiteSettingsStore] Erro ao salvar setting:', err)
      // Rollback
      set({ settings: prevSettings })
      toast.error(err.message || 'Erro ao salvar configuração')
      return false
    }
  },

  toggleContentFlag: async (key, enabled) => {
    const prevFlags = get().flags
    const updated = { ...prevFlags, [key]: enabled }

    // Otimista
    set({ flags: updated })

    try {
      const dbRpc = supabase.rpc as any
      const { error } = await dbRpc('set_content_flag', {
        p_key: key,
        p_enabled: enabled,
      })

      if (error) {
        // Fallback direto via upsert se rpc falhar
        const dbFrom = supabase.from as any
        const { error: upsertErr } = await dbFrom('content_flags').upsert({
          key,
          enabled,
          updated_at: new Date().toISOString(),
        })
        if (upsertErr) throw upsertErr
      }

      toast.success(`Seção ${enabled ? 'ativada' : 'desativada'} com sucesso!`)
      return true
    } catch (err: any) {
      console.error('[useSiteSettingsStore] Erro ao alternar content flag:', err)
      // Rollback
      set({ flags: prevFlags })
      toast.error(err.message || 'Erro ao atualizar flag de conteúdo')
      return false
    }
  },

  restoreDefaults: async () => {
    const prevSettings = get().settings
    const prevFlags = get().flags

    // Otimista
    set({
      settings: DEFAULT_SITE_SETTINGS,
      flags: DEFAULT_CONTENT_FLAGS,
    })

    try {
      const dbFrom = supabase.from as any
      const settingEntries = Object.entries(DEFAULT_SITE_SETTINGS).map(([k, v]) => ({
        key: k,
        value: v as any,
        updated_at: new Date().toISOString(),
      }))

      const flagEntries = Object.entries(DEFAULT_CONTENT_FLAGS).map(([k, v]) => ({
        key: k,
        enabled: v,
        updated_at: new Date().toISOString(),
      }))

      const [resSettings, resFlags] = await Promise.all([
        dbFrom('site_settings').upsert(settingEntries),
        dbFrom('content_flags').upsert(flagEntries),
      ])

      if (resSettings.error) throw resSettings.error
      if (resFlags.error) throw resFlags.error

      toast.success('Configurações do site restauradas para o padrão!')
      return true
    } catch (err: any) {
      console.error('[useSiteSettingsStore] Erro ao restaurar defaults:', err)
      set({ settings: prevSettings, flags: prevFlags })
      toast.error(err.message || 'Erro ao restaurar padrões')
      return false
    }
  },
}))
