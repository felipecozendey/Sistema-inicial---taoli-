import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables, TablesUpdate } from '@/lib/supabase/types'

export type AiProviderSettingsRow = Tables<'ai_provider_settings'>
export type AiProviderSettingsUpdate = TablesUpdate<'ai_provider_settings'>
export type AiConfigRow = Tables<'ai_config'>
export type AiUsageLogRow = Tables<'ai_usage_logs'>
export type AiPricingRow = Tables<'ai_pricing'>

export interface FeatureAccess {
  common: boolean
  pro: boolean
}

export interface AiFeatureItem {
  key: string
  label: string
  description: string
  access: FeatureAccess
}

export interface AiProvider {
  id: string
  provider: 'openai' | 'gemini' | 'anthropic'
  displayName: string
  baseUrl: string
  defaultModel: string
  enabled: boolean
  hasKey: boolean
  apiKeyMasked: string // Ex.: "••••••••1234" ou vazia
  updatedAt: string
}

export interface AiPricingItem {
  provider: string
  model: string
  inputUsdPer1k: number
  outputUsdPer1k: number
  updatedAt: string
}

export interface AiUsageLogItem {
  id: string
  userId: string | null
  userName?: string
  userEmail?: string
  provider: string
  model: string | null
  feature: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
  status: 'success' | 'error'
  errorMessage: string | null
  createdAt: string
}

export interface AiGeneralConfig {
  id: string
  aiEnabled: boolean
  featuresEnabled: Record<string, FeatureAccess>
  quotaProDaily: number
  quotaProMonthly: number
  quotaCommonDaily: number
  quotaCommonMonthly: number
  updatedAt: string
}

// Cotação fixa configurável simples para estimativa em BRL sem chamada externa
export const USD_TO_BRL_RATE = 5.5

export const DEFAULT_AI_FEATURES: Array<{ key: string; label: string; description: string }> = [
  {
    key: 'resumo_prontuario',
    label: 'Resumo de Prontuário',
    description: 'Síntese clínica e histórico automatizado para profissionais de saúde.',
  },
  {
    key: 'gerar_treino',
    label: 'Gerar Treino Inteligente',
    description: 'Sugestões de fichas de treino adaptadas à frequência e objetivos.',
  },
  {
    key: 'assistente_estudos',
    label: 'Assistente de Estudos',
    description: 'Geração de resumos, perguntas e flashcards a partir de anotações.',
  },
  {
    key: 'analise_financeira',
    label: 'Análise Financeira',
    description: 'Insights de gastos, metas de investimento e categorização de despesas.',
  },
]

interface AiState {
  config: AiGeneralConfig | null
  providers: AiProvider[]
  pricing: AiPricingItem[]
  logs: AiUsageLogItem[]
  loading: boolean
  testingProvider: string | null // Nome do provedor sendo testado no momento

  // Ações de carregamento
  loadAiData: () => Promise<void>

  // Ações de Provedores
  updateProviderSettings: (
    provider: 'openai' | 'gemini' | 'anthropic',
    data: {
      enabled?: boolean
      baseUrl?: string
      defaultModel?: string
      newApiKey?: string
    },
  ) => Promise<boolean>

  testProviderKey: (
    provider: 'openai' | 'gemini' | 'anthropic',
    apiKeyOverride?: string,
  ) => Promise<{ ok: boolean; message: string }>

  // Ações de Configuração Geral / Recursos / Quotas
  toggleAiEnabled: (enabled: boolean) => Promise<boolean>
  toggleFeatureAccess: (
    featureKey: string,
    roleType: 'common' | 'pro',
    enabled: boolean,
  ) => Promise<boolean>
  updateQuotas: (quotas: {
    quotaProDaily: number
    quotaProMonthly: number
    quotaCommonDaily: number
    quotaCommonMonthly: number
  }) => Promise<boolean>

  // Ações de Preços
  updatePricing: (
    provider: string,
    model: string,
    inputUsdPer1k: number,
    outputUsdPer1k: number,
  ) => Promise<boolean>
}

// Helper para mascarar chaves de API com segurança
function maskApiKey(key: string | null | undefined): string {
  if (!key) return ''
  const trimmed = key.trim()
  if (trimmed.length <= 4) return '••••'
  const last4 = trimmed.slice(-4)
  return `••••••••${last4}`
}

export const useAiStore = create<AiState>((set, get) => ({
  config: null,
  providers: [],
  pricing: [],
  logs: [],
  loading: false,
  testingProvider: null,

  loadAiData: async () => {
    set({ loading: true })
    try {
      const [configRes, providersRes, pricingRes, logsRes, profilesRes] = await Promise.all([
        supabase.from('ai_config').select('*').eq('id', 'default').maybeSingle(),
        supabase.from('ai_provider_settings').select('*').order('provider', { ascending: true }),
        supabase.from('ai_pricing').select('*').order('provider', { ascending: true }),
        supabase
          .from('ai_usage_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('profiles').select('id, display_name, email'),
      ])

      if (configRes.error) throw configRes.error
      if (providersRes.error) throw providersRes.error
      if (pricingRes.error) throw pricingRes.error
      if (logsRes.error) throw logsRes.error

      const profileMap = new Map<string, { display_name: string | null; email: string | null }>()
      if (profilesRes.data) {
        profilesRes.data.forEach((p) => profileMap.set(p.id, p))
      }

      // 1. Mapear ai_config
      let mappedConfig: AiGeneralConfig | null = null
      if (configRes.data) {
        const rawFeatures = (configRes.data.features_enabled || {}) as Record<string, any>
        const parsedFeatures: Record<string, FeatureAccess> = {}

        // Preenche com as features padrão
        DEFAULT_AI_FEATURES.forEach((f) => {
          const raw = rawFeatures[f.key]
          if (typeof raw === 'boolean') {
            parsedFeatures[f.key] = { common: raw, pro: raw }
          } else if (raw && typeof raw === 'object') {
            parsedFeatures[f.key] = {
              common: Boolean(raw.common),
              pro: Boolean(raw.pro),
            }
          } else {
            parsedFeatures[f.key] = { common: false, pro: false }
          }
        })

        // Inclui qualquer outra feature presente no JSON
        Object.keys(rawFeatures).forEach((k) => {
          if (!parsedFeatures[k]) {
            const raw = rawFeatures[k]
            if (typeof raw === 'boolean') {
              parsedFeatures[k] = { common: raw, pro: raw }
            } else if (raw && typeof raw === 'object') {
              parsedFeatures[k] = { common: Boolean(raw.common), pro: Boolean(raw.pro) }
            }
          }
        })

        mappedConfig = {
          id: configRes.data.id,
          aiEnabled: Boolean(configRes.data.ai_enabled),
          featuresEnabled: parsedFeatures,
          quotaProDaily: configRes.data.quota_pro_daily ?? 50,
          quotaProMonthly: configRes.data.quota_pro_monthly ?? 1000,
          quotaCommonDaily: configRes.data.quota_common_daily ?? 5,
          quotaCommonMonthly: configRes.data.quota_common_monthly ?? 50,
          updatedAt: configRes.data.updated_at,
        }
      }

      // 2. Mapear provedores (com chave mascarada na UI)
      const mappedProviders: AiProvider[] = (providersRes.data || []).map((p) => {
        const hasKey = Boolean(p.api_key_encrypted && p.api_key_encrypted.trim().length > 0)
        return {
          id: p.id,
          provider: p.provider as 'openai' | 'gemini' | 'anthropic',
          displayName: p.display_name,
          baseUrl: p.base_url,
          defaultModel: p.default_model,
          enabled: Boolean(p.enabled),
          hasKey,
          apiKeyMasked: maskApiKey(p.api_key_encrypted),
          updatedAt: p.updated_at,
        }
      })

      // 3. Mapear precificação
      const mappedPricing: AiPricingItem[] = (pricingRes.data || []).map((pr) => ({
        provider: pr.provider,
        model: pr.model,
        inputUsdPer1k: Number(pr.input_usd_per_1k || 0),
        outputUsdPer1k: Number(pr.output_usd_per_1k || 0),
        updatedAt: pr.updated_at,
      }))

      // 4. Mapear logs de uso
      const mappedLogs: AiUsageLogItem[] = (logsRes.data || []).map((l) => {
        const user = l.user_id ? profileMap.get(l.user_id) : null
        return {
          id: l.id,
          userId: l.user_id,
          userName:
            user?.display_name || user?.email?.split('@')[0] || (l.user_id ? 'Usuário' : 'Sistema'),
          userEmail: user?.email || '',
          provider: l.provider,
          model: l.model,
          feature: l.feature,
          promptTokens: l.prompt_tokens || 0,
          completionTokens: l.completion_tokens || 0,
          totalTokens: l.total_tokens || 0,
          costUsd: Number(l.cost_usd || 0),
          status: l.status === 'success' ? 'success' : 'error',
          errorMessage: l.error_message,
          createdAt: l.created_at,
        }
      })

      set({
        config: mappedConfig,
        providers: mappedProviders,
        pricing: mappedPricing,
        logs: mappedLogs,
        loading: false,
      })
    } catch (err: any) {
      set({ loading: false })
      const msg = err?.message || 'Falha ao carregar dados de IA.'
      toast.error(msg)
    }
  },

  updateProviderSettings: async (provider, data) => {
    const prevProviders = get().providers
    const target = prevProviders.find((p) => p.provider === provider)
    if (!target) return false

    // Optimistic update
    const updated = prevProviders.map((p) => {
      if (p.provider === provider) {
        return {
          ...p,
          enabled: data.enabled !== undefined ? data.enabled : p.enabled,
          baseUrl: data.baseUrl !== undefined ? data.baseUrl : p.baseUrl,
          defaultModel: data.defaultModel !== undefined ? data.defaultModel : p.defaultModel,
          hasKey: data.newApiKey !== undefined ? Boolean(data.newApiKey.trim()) : p.hasKey,
          apiKeyMasked: data.newApiKey !== undefined ? maskApiKey(data.newApiKey) : p.apiKeyMasked,
        }
      }
      return p
    })
    set({ providers: updated })

    try {
      const updatePayload: AiProviderSettingsUpdate = {
        updated_at: new Date().toISOString(),
      }
      if (data.enabled !== undefined) updatePayload.enabled = data.enabled
      if (data.baseUrl !== undefined) updatePayload.base_url = data.baseUrl.trim()
      if (data.defaultModel !== undefined) updatePayload.default_model = data.defaultModel.trim()
      if (data.newApiKey !== undefined) {
        updatePayload.api_key_encrypted = data.newApiKey.trim() || null
      }

      const { error } = await supabase
        .from('ai_provider_settings')
        .update(updatePayload)
        .eq('provider', provider)

      if (error) throw error

      toast.success(`Configurações de ${target.displayName} atualizadas com sucesso!`)
      return true
    } catch (err: any) {
      // Rollback
      set({ providers: prevProviders })
      toast.error(err?.message || `Falha ao salvar configurações de ${target.displayName}.`)
      return false
    }
  },

  testProviderKey: async (provider, apiKeyOverride) => {
    set({ testingProvider: provider })
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          action: 'test_key',
          provider,
          api_key: apiKeyOverride ? apiKeyOverride.trim() : undefined,
        },
      })

      set({ testingProvider: null })

      if (error || !data?.ok) {
        const errorMsg = data?.error || error?.message || 'Falha ao validar chave de API.'
        toast.error(errorMsg)
        return { ok: false, message: errorMsg }
      }

      const successMsg =
        data?.message || 'Chave validada com sucesso! O provedor respondeu à chamada de teste.'
      toast.success(successMsg)
      return { ok: true, message: successMsg }
    } catch (err: any) {
      set({ testingProvider: null })
      const msg = err?.message || 'Erro inesperado ao testar conexão.'
      toast.error(msg)
      return { ok: false, message: msg }
    }
  },

  toggleAiEnabled: async (enabled) => {
    const prevConfig = get().config
    if (!prevConfig) return false

    // Optimistic update
    set({ config: { ...prevConfig, aiEnabled: enabled } })

    try {
      const { error } = await supabase
        .from('ai_config')
        .update({ ai_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', 'default')

      if (error) throw error

      toast.success(
        enabled
          ? 'Inteligência Artificial ativada no app!'
          : 'Inteligência Artificial desativada no app.',
      )
      return true
    } catch (err: any) {
      // Rollback
      set({ config: prevConfig })
      toast.error(err?.message || 'Falha ao alterar status global da IA.')
      return false
    }
  },

  toggleFeatureAccess: async (featureKey, roleType, enabled) => {
    const prevConfig = get().config
    if (!prevConfig) return false

    const currentAccess = prevConfig.featuresEnabled[featureKey] || { common: false, pro: false }
    const updatedAccess: FeatureAccess = {
      ...currentAccess,
      [roleType]: enabled,
    }

    const nextFeatures = {
      ...prevConfig.featuresEnabled,
      [featureKey]: updatedAccess,
    }

    // Optimistic update
    set({
      config: {
        ...prevConfig,
        featuresEnabled: nextFeatures,
      },
    })

    try {
      const { error } = await supabase
        .from('ai_config')
        .update({
          features_enabled: nextFeatures as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default')

      if (error) throw error

      toast.success(`Permissão de "${featureKey}" atualizada.`)
      return true
    } catch (err: any) {
      // Rollback
      set({ config: prevConfig })
      toast.error(err?.message || 'Falha ao salvar permissão do recurso.')
      return false
    }
  },

  updateQuotas: async (quotas) => {
    const prevConfig = get().config
    if (!prevConfig) return false

    // Optimistic update
    set({
      config: {
        ...prevConfig,
        ...quotas,
      },
    })

    try {
      const { error } = await supabase
        .from('ai_config')
        .update({
          quota_pro_daily: quotas.quotaProDaily,
          quota_pro_monthly: quotas.quotaProMonthly,
          quota_common_daily: quotas.quotaCommonDaily,
          quota_common_monthly: quotas.quotaCommonMonthly,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default')

      if (error) throw error

      toast.success('Limites de requisições salvos com sucesso!')
      return true
    } catch (err: any) {
      // Rollback
      set({ config: prevConfig })
      toast.error(err?.message || 'Falha ao salvar limites de quotas.')
      return false
    }
  },

  updatePricing: async (provider, model, inputUsdPer1k, outputUsdPer1k) => {
    const prevPricing = get().pricing
    const nextPricing = prevPricing.map((pr) => {
      if (pr.provider === provider && pr.model === model) {
        return { ...pr, inputUsdPer1k, outputUsdPer1k }
      }
      return pr
    })

    // Optimistic update
    set({ pricing: nextPricing })

    try {
      const { error } = await supabase.from('ai_pricing').upsert({
        provider,
        model,
        input_usd_per_1k: inputUsdPer1k,
        output_usd_per_1k: outputUsdPer1k,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success(`Preço para ${model} atualizado com sucesso!`)
      return true
    } catch (err: any) {
      // Rollback
      set({ pricing: prevPricing })
      toast.error(err?.message || 'Falha ao atualizar tabela de preços.')
      return false
    }
  },
}))
