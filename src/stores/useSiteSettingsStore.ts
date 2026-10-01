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

export interface NavItemCustomization {
  key: string
  label: string
  icon: string
  order: number
  visible: boolean
}

export interface TutorialStep {
  step: number
  title?: string
  content: string
  target?: string // seletor ou descrição do elemento alvo
}

export interface TutorialItem {
  id: string
  audience: 'user' | 'professional' // Sistema do usuário ou Painel Pro
  target_page: string // ex: 'dashboard', 'health', 'tasks', 'finance', 'social', 'studies', 'appointments', etc.
  title: string
  content: string // texto curto / descrição
  type: 'tour' | 'popup' | 'tip'
  trigger: 'first_access' | 'always' | 'help_button'
  active: boolean
  steps: TutorialStep[]
}

export interface SiteSettingsData {
  app_name: string
  brand_name: string
  pro_brand_name: string
  hero_title: string
  hero_subtitle: string
  cta_primary_label: string
  cta_secondary_label: string
  login_title: string
  login_subtitle: string
  login_button_label?: string
  login_footer_text?: string
  final_cta_title?: string
  final_cta_subtitle?: string
  footer_message: string
  copyright_text?: string
  features: FeatureCardItem[]
  steps: HowItWorksStep[]
  nav_customization: NavItemCustomization[]
  pro_nav_customization: NavItemCustomization[]
  tutorials: TutorialItem[]
}

export interface ContentFlagsData {
  hero: boolean
  features_section: boolean
  how_it_works: boolean
  final_cta: boolean
  footer: boolean
  public_signup: boolean
}

export const DEFAULT_USER_NAV_ITEMS: NavItemCustomization[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', order: 0, visible: true },
  { key: 'tasks', label: 'Performance', icon: 'CheckSquare', order: 1, visible: true },
  { key: 'social', label: 'Social', icon: 'Share2', order: 2, visible: true },
  { key: 'health', label: 'Saúde', icon: 'HeartPulse', order: 3, visible: true },
  { key: 'finance', label: 'Finanças', icon: 'Wallet', order: 4, visible: true },
  { key: 'professional', label: 'Painel Pro', icon: 'StethoscopeIcon', order: 5, visible: true },
]

export const DEFAULT_PRO_NAV_ITEMS: NavItemCustomization[] = [
  { key: 'overview', label: 'Visão Geral', icon: 'LayoutDashboard', order: 0, visible: true },
  { key: 'patients', label: 'Pacientes', icon: 'Users', order: 1, visible: true },
  { key: 'appointments', label: 'Consultas', icon: 'Calendar', order: 2, visible: true },
  { key: 'notes', label: 'Anotações Clínicas', icon: 'FileText', order: 3, visible: true },
  { key: 'groups_pro', label: 'Grupos Pro', icon: 'MessageCircle', order: 4, visible: true },
]

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  app_name: 'VibeCoding Tarefas',
  brand_name: 'VibeCoding Tarefas',
  pro_brand_name: 'Painel Pro',
  hero_title: 'Organize sua vida com o poder do VibeCoding',
  hero_subtitle:
    'Tarefas, hábitos, saúde física e mental, estudos e finanças pessoais em um ecossistema gamificado e ultra-rápido.',
  cta_primary_label: 'Entrar',
  cta_secondary_label: 'Criar conta',
  login_title: 'Bem-vindo de volta!',
  login_subtitle: 'Acesse sua conta para continuar evoluindo suas metas.',
  login_button_label: 'Entrar',
  login_footer_text: 'Dúvidas ou suporte? Entre em contato com o suporte da sua organização.',
  final_cta_title: 'Pronto para elevar seu ritmo diário?',
  final_cta_subtitle:
    'Comece agora mesmo a centralizar suas tarefas, hábitos, saúde e estudos com o ecossistema VibeCoding.',
  footer_message: 'Desenvolvido com foco em alta performance e simplicidade.',
  copyright_text: 'Todos os direitos reservados.',
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
  nav_customization: DEFAULT_USER_NAV_ITEMS,
  pro_nav_customization: DEFAULT_PRO_NAV_ITEMS,
  tutorials: [],
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
  restorePageDefaults: (
    page: 'landing' | 'login' | 'system' | 'system_pro' | 'tutorials',
  ) => Promise<boolean>
}

export const useSiteSettingsStore = create<SiteSettingsState>((set, get) => ({
  settings: DEFAULT_SITE_SETTINGS,
  flags: DEFAULT_CONTENT_FLAGS,
  loading: false,
  initialized: false,

  loadSiteData: async () => {
    set({ loading: true })
    try {
      const [settingsRes, flagsRes] = await Promise.all([
        (supabase as any).from('site_settings').select('key, value'),
        (supabase as any).from('content_flags').select('key, enabled'),
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

            // Merge inteligente para itens de menu: garantir que chaves novas apareçam
            if (row.key === 'nav_customization' && Array.isArray(val)) {
              val = mergeNavCustomization(DEFAULT_USER_NAV_ITEMS, val)
            } else if (row.key === 'tutorials' && Array.isArray(val)) {
              val = val.filter(Boolean)
            } else if (row.key === 'pro_nav_customization' && Array.isArray(val)) {
              val = mergeNavCustomization(DEFAULT_PRO_NAV_ITEMS, val)
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
      const { error } = await (supabase as any).from('site_settings').upsert({
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
      const { error } = await (supabase as any).rpc('set_content_flag', {
        p_key: key,
        p_enabled: enabled,
      })

      if (error) {
        // Fallback direto via upsert se rpc falhar
        const { error: upsertErr } = await (supabase as any).from('content_flags').upsert({
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
        (supabase as any).from('site_settings').upsert(settingEntries),
        (supabase as any).from('content_flags').upsert(flagEntries),
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

  restorePageDefaults: async (
    page: 'landing' | 'login' | 'system' | 'system_pro' | 'tutorials',
  ) => {
    const prevSettings = get().settings
    const prevFlags = get().flags

    let keysToReset: (keyof SiteSettingsData)[] = []
    let flagsToReset: (keyof ContentFlagsData)[] = []

    if (page === 'landing') {
      keysToReset = [
        'app_name',
        'hero_title',
        'hero_subtitle',
        'cta_primary_label',
        'cta_secondary_label',
        'final_cta_title',
        'final_cta_subtitle',
        'footer_message',
        'copyright_text',
        'features',
        'steps',
      ]
      flagsToReset = ['hero', 'features_section', 'how_it_works', 'final_cta', 'footer']
    } else if (page === 'login') {
      keysToReset = ['login_title', 'login_subtitle', 'login_button_label', 'login_footer_text']
      flagsToReset = ['public_signup']
    } else if (page === 'system') {
      keysToReset = ['brand_name', 'nav_customization']
    } else if (page === 'system_pro') {
      keysToReset = ['pro_brand_name', 'pro_nav_customization']
    } else if (page === 'tutorials') {
      keysToReset = ['tutorials']
    }

    const nextSettings: SiteSettingsData = { ...prevSettings }
    keysToReset.forEach((k) => {
      ;(nextSettings as any)[k] = DEFAULT_SITE_SETTINGS[k]
    })

    const nextFlags: ContentFlagsData = { ...prevFlags }
    flagsToReset.forEach((f) => {
      ;(nextFlags as any)[f] = DEFAULT_CONTENT_FLAGS[f]
    })

    set({ settings: nextSettings, flags: nextFlags })

    try {
      const settingEntries = keysToReset.map((k) => ({
        key: k,
        value: DEFAULT_SITE_SETTINGS[k] as any,
        updated_at: new Date().toISOString(),
      }))

      const flagEntries = flagsToReset.map((f) => ({
        key: f,
        enabled: DEFAULT_CONTENT_FLAGS[f],
        updated_at: new Date().toISOString(),
      }))

      const promises: Promise<any>[] = [
        (supabase as any).from('site_settings').upsert(settingEntries),
      ]
      if (flagEntries.length > 0) {
        promises.push((supabase as any).from('content_flags').upsert(flagEntries))
      }

      const results = await Promise.all(promises)
      for (const res of results) {
        if (res.error) throw res.error
      }

      const pageLabels: Record<string, string> = {
        landing: 'Landing Page',
        login: 'Página de Login',
        system: 'Sistema Ada',
        system_pro: 'Sistema Ada Pro',
        tutorials: 'Tutoriais',
      }

      toast.success(`Padrões de ${pageLabels[page] || page} restaurados!`)
      return true
    } catch (err: any) {
      set({ settings: prevSettings, flags: prevFlags })
      toast.error(err.message || 'Erro ao restaurar padrões da página')
      return false
    }
  },
}))

/**
 * Função utilitária para merge de personalizações de navegação:
 * - Preserva chaves salvas com rótulos, ícones, ordem e visibilidade
 * - Adiciona chaves default que não estavam presentes no JSON salvo
 * - Garante ordenação estável pelo campo 'order'
 */
export function mergeNavCustomization(
  defaultItems: NavItemCustomization[],
  savedItems: NavItemCustomization[] = [],
): NavItemCustomization[] {
  const savedMap = new Map<string, NavItemCustomization>()
  savedItems.forEach((item) => {
    if (item && item.key) {
      savedMap.set(item.key, item)
    }
  })

  // Para cada item default, pega a personalização salva ou o default
  const merged: NavItemCustomization[] = defaultItems.map((defItem) => {
    const saved = savedMap.get(defItem.key)
    if (!saved) return defItem
    return {
      key: defItem.key,
      label: typeof saved.label === 'string' && saved.label.trim() ? saved.label : defItem.label,
      icon: saved.icon || defItem.icon,
      order: typeof saved.order === 'number' ? saved.order : defItem.order,
      visible: typeof saved.visible === 'boolean' ? saved.visible : defItem.visible,
    }
  })

  return merged.sort((a, b) => a.order - b.order)
}

/**
 * Hook para consumo único e padronizado do nome do sistema e Pro:
 * Devolve brandName com fallback para app_name e depois 'VibeCoding Tarefas',
 * e proBrandName com fallback para 'Painel Pro'.
 */
export function useBrandName() {
  const settings = useSiteSettingsStore((s) => s.settings)
  const brandName = (settings.brand_name || settings.app_name || 'VibeCoding Tarefas').trim()
  const proBrandName = (settings.pro_brand_name || 'Painel Pro').trim()

  return {
    brandName,
    proBrandName,
    appName: brandName,
  }
}
