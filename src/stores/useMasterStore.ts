import { create } from './create-store'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettingsStore } from './useSiteSettingsStore'
import type { Tables } from '@/lib/supabase/types'

export type ProfileRow = Tables<'profiles'>
export type BillingRow = Tables<'billings'>
export type FeatureFlagRow = Tables<'feature_flags'>
export type AdminAuditLogRow = Tables<'admin_audit_logs'>

export interface Profile {
  id: string
  email: string
  displayName: string | null
  role: 'master' | 'user'
  status: 'active' | 'suspended'
  createdAt: string
  updatedAt: string
}

export interface Billing {
  id: string
  userId: string
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
  paidAt: string | null
  createdBy: string | null
  createdAt: string
  userName?: string
  userEmail?: string
}

export interface FeatureFlag {
  id: string
  key: string
  label: string
  description: string | null
  enabled: boolean
  updatedAt: string
}

export interface AdminAuditLog {
  id: string
  actorId: string | null
  actorEmail: string | null
  action: string
  targetUserId: string | null
  targetEmail: string | null
  details: Record<string, unknown>
  createdAt: string
}

export interface MasterStats {
  totalUsers: number
  totalMasters: number
  totalActive: number
  totalSuspended: number
  newUsers7d: number
  newUsers30d: number
}

export interface CreateUserData {
  email: string
  displayName?: string
  password?: string | null
  sendEmail: boolean
}

export interface CreateUserResult {
  user: Profile
  passwordGenerated: boolean
  generatedPassword: string | null
  emailSent: boolean
  hasEmailProvider: boolean
}

export interface MasterGlobalFinanceRow {
  userId: string
  email: string
  displayName: string | null
  totalIncome: number
  totalExpense: number
  balance: number
  totalInvested: number
  transactionsCount: number
}

interface MasterState {
  profiles: Profile[]
  billings: Billing[]
  featureFlags: FeatureFlag[]
  auditLogs: AuditLogRecord[]
  globalFinance: MasterGlobalFinanceRow[]
  loading: boolean
  error: string | null

  // Fetch
  loadMasterData: () => Promise<void>
  loadGlobalFinance: () => Promise<void>

  // User management
  createUser: (data: CreateUserData) => Promise<CreateUserResult | null>
  setRole: (userId: string, newRole: 'master' | 'user') => Promise<boolean>
  suspendUser: (userId: string) => Promise<boolean>
  reactivateUser: (userId: string) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>

  // Billings
  createBilling: (data: {
    userId: string
    description: string
    amount: number
    dueDate: string
  }) => Promise<boolean>
  markBillingPaid: (id: string) => Promise<boolean>

  // Feature flags
  toggleFeature: (key: string, enabled: boolean) => Promise<boolean>
}

export type AuditLogRecord = AdminAuditLog

function mapProfile(
  data:
    | ProfileRow
    | {
        id: string
        email: string
        display_name?: string | null
        role?: string
        status?: string
        created_at: string
        updated_at: string
      },
): Profile {
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name ?? null,
    role: data.role === 'master' ? 'master' : 'user',
    status: data.status === 'suspended' ? 'suspended' : 'active',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapBilling(data: BillingRow): Billing {
  return {
    id: data.id,
    userId: data.user_id,
    description: data.description,
    amount: Number(data.amount || 0),
    dueDate: data.due_date,
    status: (data.status as Billing['status']) || 'pending',
    paidAt: data.paid_at ?? null,
    createdBy: data.created_by ?? null,
    createdAt: data.created_at,
  }
}

function mapFeatureFlag(data: FeatureFlagRow): FeatureFlag {
  return {
    id: data.id,
    key: data.key,
    label: data.label,
    description: data.description ?? null,
    enabled: Boolean(data.enabled),
    updatedAt: data.updated_at,
  }
}

function mapAuditLog(data: AdminAuditLogRow): AdminAuditLog {
  return {
    id: data.id,
    actorId: data.actor_id ?? null,
    actorEmail: data.actor_email ?? null,
    action: data.action,
    targetUserId: data.target_user_id ?? null,
    targetEmail: data.target_email ?? null,
    details:
      typeof data.details === 'object' && data.details !== null
        ? (data.details as Record<string, unknown>)
        : {},
    createdAt: data.created_at,
  }
}

export const useMasterStore = create<MasterState>((set, get) => ({
  profiles: [],
  billings: [],
  featureFlags: [],
  auditLogs: [],
  globalFinance: [],
  loading: false,
  error: null,

  loadMasterData: async () => {
    set({ loading: true, error: null })
    try {
      const [profilesRes, billingsRes, flagsRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('billings').select('*').order('due_date', { ascending: false }),
        supabase.from('feature_flags').select('*').order('label', { ascending: true }),
        supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      // Also trigger loading of site_settings and content_flags for the Master panel
      useSiteSettingsStore.getState().loadSiteData()

      if (profilesRes.error) throw profilesRes.error
      if (billingsRes.error) throw billingsRes.error
      if (flagsRes.error) throw flagsRes.error

      const mappedProfiles = (profilesRes.data || []).map(mapProfile)
      const profileMap = new Map<string, Profile>(mappedProfiles.map((p) => [p.id, p]))

      const mappedBillings = (billingsRes.data || []).map((b) => {
        const item = mapBilling(b)
        const user = profileMap.get(item.userId)
        item.userName = user?.displayName || user?.email || 'Usuário'
        item.userEmail = user?.email || ''
        return item
      })

      const mappedFlags = (flagsRes.data || []).map(mapFeatureFlag)
      const mappedLogs = (logsRes.data || []).map(mapAuditLog)

      set({
        profiles: mappedProfiles,
        billings: mappedBillings,
        featureFlags: mappedFlags,
        auditLogs: mappedLogs,
        loading: false,
      })

      // Also trigger global finance in background
      get().loadGlobalFinance()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados do painel Master'
      set({ error: message, loading: false })
      toast.error('Erro ao carregar dados do painel Master')
    }
  },

  loadGlobalFinance: async () => {
    try {
      const { data: txData } = await supabase.from('transactions').select('user_id, type, amount')
      const { data: invData } = await supabase
        .from('investments')
        .select('user_id, current_amount, invested_amount, initial_amount')

      const profiles = get().profiles
      const financeMap = new Map<string, MasterGlobalFinanceRow>()

      profiles.forEach((p) => {
        financeMap.set(p.id, {
          userId: p.id,
          email: p.email,
          displayName: p.displayName,
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          totalInvested: 0,
          transactionsCount: 0,
        })
      })

      if (txData) {
        txData.forEach((tx) => {
          const uid = tx.user_id
          let row = financeMap.get(uid)
          if (!row) {
            row = {
              userId: uid,
              email: 'Desconhecido',
              displayName: null,
              totalIncome: 0,
              totalExpense: 0,
              balance: 0,
              totalInvested: 0,
              transactionsCount: 0,
            }
            financeMap.set(uid, row)
          }
          const amt = Number(tx.amount || 0)
          row.transactionsCount += 1
          if (tx.type === 'income') {
            row.totalIncome += amt
          } else if (tx.type === 'expense') {
            row.totalExpense += amt
          }
          row.balance = row.totalIncome - row.totalExpense
        })
      }

      if (invData) {
        invData.forEach((inv) => {
          const uid = inv.user_id
          let row = financeMap.get(uid)
          if (row) {
            const val = Number(inv.current_amount ?? inv.invested_amount ?? inv.initial_amount ?? 0)
            row.totalInvested += val
          }
        })
      }

      set({ globalFinance: Array.from(financeMap.values()) })
    } catch {
      // Falha silenciosa para dados secundários de finanças
    }
  },

  createUser: async (data: CreateUserData) => {
    try {
      const { data: resData, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create_user',
          email: data.email,
          display_name: data.displayName,
          password: data.password,
          send_email: data.sendEmail,
        },
      })

      if (error || !resData?.ok) {
        const errorMsg = resData?.error || error?.message || 'Falha ao criar usuário'
        toast.error(errorMsg)
        return null
      }

      const createdUser = mapProfile(resData.data.user)

      // Optimistic/immediate add to state
      set((state) => ({
        profiles: [createdUser, ...state.profiles.filter((p) => p.id !== createdUser.id)],
        auditLogs: [
          {
            id: 'temp-' + Date.now(),
            actorId: null,
            actorEmail: 'Você (Master)',
            action: 'create_user',
            targetUserId: createdUser.id,
            targetEmail: createdUser.email,
            details: {
              email_sent: resData.data.email_sent,
              password_generated: resData.data.password_generated,
            },
            createdAt: new Date().toISOString(),
          },
          ...state.auditLogs,
        ],
      }))

      toast.success(`Usuário ${createdUser.email} criado com sucesso!`)
      return {
        user: createdUser,
        passwordGenerated: Boolean(resData.data.password_generated),
        generatedPassword: resData.data.generated_password || null,
        emailSent: Boolean(resData.data.email_sent),
        hasEmailProvider: Boolean(resData.data.has_email_provider),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao criar usuário'
      toast.error(message)
      return null
    }
  },

  setRole: async (userId: string, newRole: 'master' | 'user') => {
    const prevProfiles = get().profiles
    const target = prevProfiles.find((p) => p.id === userId)
    if (!target) return false

    // Optimistic update
    set({
      profiles: prevProfiles.map((p) => (p.id === userId ? { ...p, role: newRole } : p)),
    })

    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'set_role', user_id: userId, role: newRole },
      })

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || 'Erro ao alterar papel')
      }

      toast.success(`Papel do usuário alterado para ${newRole === 'master' ? 'Master' : 'Comum'}`)
      return true
    } catch (err) {
      // Rollback
      set({ profiles: prevProfiles })
      const message = err instanceof Error ? err.message : 'Falha ao alterar papel do usuário'
      toast.error(message)
      return false
    }
  },

  suspendUser: async (userId: string) => {
    const prevProfiles = get().profiles
    set({
      profiles: prevProfiles.map((p) => (p.id === userId ? { ...p, status: 'suspended' } : p)),
    })

    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'suspend_user', user_id: userId },
      })

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || 'Erro ao suspender usuário')
      }

      toast.success('Usuário suspenso com sucesso!')
      return true
    } catch (err) {
      set({ profiles: prevProfiles })
      const message = err instanceof Error ? err.message : 'Falha ao suspender usuário'
      toast.error(message)
      return false
    }
  },

  reactivateUser: async (userId: string) => {
    const prevProfiles = get().profiles
    set({
      profiles: prevProfiles.map((p) => (p.id === userId ? { ...p, status: 'active' } : p)),
    })

    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'reactivate_user', user_id: userId },
      })

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || 'Erro ao reativar usuário')
      }

      toast.success('Usuário reativado com sucesso!')
      return true
    } catch (err) {
      set({ profiles: prevProfiles })
      const message = err instanceof Error ? err.message : 'Falha ao reativar usuário'
      toast.error(message)
      return false
    }
  },

  deleteUser: async (userId: string) => {
    const prevProfiles = get().profiles
    const target = prevProfiles.find((p) => p.id === userId)
    if (!target) return false

    // Optimistic removal
    set({
      profiles: prevProfiles.filter((p) => p.id !== userId),
      billings: get().billings.filter((b) => b.userId !== userId),
      globalFinance: get().globalFinance.filter((g) => g.userId !== userId),
    })

    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete_user', user_id: userId },
      })

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || 'Erro ao excluir usuário')
      }

      toast.success('Usuário e todos os seus dados foram excluídos com sucesso!')
      return true
    } catch (err) {
      // Rollback
      set({ profiles: prevProfiles })
      const message = err instanceof Error ? err.message : 'Falha ao excluir usuário'
      toast.error(message)
      return false
    }
  },

  createBilling: async ({ userId, description, amount, dueDate }) => {
    const tempId = 'temp-' + Date.now()
    const targetProfile = get().profiles.find((p) => p.id === userId)

    const optimisticBilling: Billing = {
      id: tempId,
      userId,
      description,
      amount,
      dueDate,
      status: 'pending',
      paidAt: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      userName: targetProfile?.displayName || targetProfile?.email || 'Usuário',
      userEmail: targetProfile?.email || '',
    }

    set((state) => ({ billings: [optimisticBilling, ...state.billings] }))

    try {
      const { data, error } = await supabase
        .from('billings')
        .insert({
          user_id: userId,
          description,
          amount,
          due_date: dueDate,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      // Swap tempId
      const realBilling = mapBilling(data)
      realBilling.userName = optimisticBilling.userName
      realBilling.userEmail = optimisticBilling.userEmail

      set((state) => ({
        billings: state.billings.map((b) => (b.id === tempId ? realBilling : b)),
      }))

      toast.success('Cobrança gerada com sucesso!')
      return true
    } catch (err) {
      // Rollback
      set((state) => ({ billings: state.billings.filter((b) => b.id !== tempId) }))
      const message = err instanceof Error ? err.message : 'Erro ao gerar cobrança'
      toast.error(message)
      return false
    }
  },

  markBillingPaid: async (id: string) => {
    const prevBillings = get().billings
    const target = prevBillings.find((b) => b.id === id)
    if (!target) return false

    const nowIso = new Date().toISOString()
    set({
      billings: prevBillings.map((b) =>
        b.id === id ? { ...b, status: 'paid', paidAt: nowIso } : b,
      ),
    })

    try {
      const { error } = await supabase
        .from('billings')
        .update({ status: 'paid', paid_at: nowIso })
        .eq('id', id)

      if (error) throw error
      toast.success('Cobrança marcada como paga!')
      return true
    } catch (err) {
      set({ billings: prevBillings })
      const message = err instanceof Error ? err.message : 'Erro ao atualizar cobrança'
      toast.error(message)
      return false
    }
  },

  toggleFeature: async (key: string, enabled: boolean) => {
    const prevFlags = get().featureFlags
    set({
      featureFlags: prevFlags.map((f) => (f.key === key ? { ...f, enabled } : f)),
    })

    try {
      const { error } = await supabase.rpc('set_feature_flag', {
        p_key: key,
        p_enabled: enabled,
      })

      if (error) throw error
      toast.success(`Módulo ${enabled ? 'ativado' : 'desativado'} com sucesso!`)
      return true
    } catch (err) {
      set({ featureFlags: prevFlags })
      const message = err instanceof Error ? err.message : 'Erro ao alternar feature flag'
      toast.error(message)
      return false
    }
  },
}))

export type MasterAuthStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface UseIsMasterResult {
  isMaster: boolean
  isSuspended: boolean
  loading: boolean
  status: MasterAuthStatus
  errorMessage: string | null
  userProfile: Profile | null
  refetch: () => Promise<void>
}

// In-memory session cache for master status check to avoid re-fetching on every re-render/nav
let cachedUserId: string | null = null
let cachedProfile: Profile | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60000 // 1 minute in memory cache

export function clearMasterProfileCache(): void {
  cachedUserId = null
  cachedProfile = null
  cacheTimestamp = 0
}

const TIMEOUT_MS = 10000
const RETRY_DELAY_MS = 1500

function timeoutPromise<T>(ms: number, message: string): Promise<T> {
  return new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(message))
    }, ms)
  })
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchValidatedMasterProfile(uid: string): Promise<Profile> {
  // 1. Validar / renovar token via getUser()
  const userPromise = (async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      throw new Error(userError?.message || 'Sessão inválida ou expirada.')
    }
    return userData.user
  })()

  const validUser = await Promise.race([
    userPromise,
    timeoutPromise<never>(TIMEOUT_MS, 'Tempo limite esgotado ao validar a sessão.'),
  ])

  // 2. Buscar perfil na tabela profiles
  const profilePromise = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', validUser.id || uid)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Perfil não encontrado no sistema.')
    return mapProfile(data)
  })()

  return await Promise.race([
    profilePromise,
    timeoutPromise<never>(TIMEOUT_MS, 'Tempo limite esgotado ao buscar o perfil.'),
  ])
}

// Hook useIsMaster: reads current user's profile role with neutral initial state to prevent flash
export function useIsMaster(): UseIsMasterResult {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (
      user &&
      cachedUserId === user.id &&
      cachedProfile &&
      Date.now() - cacheTimestamp < CACHE_TTL_MS
    ) {
      return cachedProfile
    }
    return null
  })
  const [status, setStatus] = useState<MasterAuthStatus>(() => {
    if (!user) return 'idle'
    if (cachedUserId === user.id && cachedProfile && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return 'ready'
    }
    return 'loading'
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeFetchId = useRef(0)

  const loadProfile = useCallback(
    async (forceRefresh = false) => {
      const fetchId = ++activeFetchId.current

      if (!user) {
        clearMasterProfileCache()
        setProfile(null)
        setStatus('idle')
        setErrorMessage(null)
        return
      }

      // Check cache
      const now = Date.now()
      if (
        !forceRefresh &&
        cachedUserId === user.id &&
        cachedProfile &&
        now - cacheTimestamp < CACHE_TTL_MS
      ) {
        setProfile(cachedProfile)
        setStatus('ready')
        setErrorMessage(null)
        return
      }

      setStatus('loading')
      setErrorMessage(null)

      let lastError: Error | null = null

      // Attempt 1 + 1 retry (max 2 attempts)
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (activeFetchId.current !== fetchId) return

        try {
          const loaded = await fetchValidatedMasterProfile(user.id)
          if (activeFetchId.current !== fetchId) return

          cachedUserId = user.id
          cachedProfile = loaded
          cacheTimestamp = Date.now()

          setProfile(loaded)
          setStatus('ready')
          setErrorMessage(null)
          return
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))

          // If attempt 1 fails, wait before retry
          if (attempt === 1) {
            await wait(RETRY_DELAY_MS)
          }
        }
      }

      if (activeFetchId.current !== fetchId) return

      // Definitive error after retry
      clearMasterProfileCache()
      setStatus('error')
      setErrorMessage(
        lastError?.message ||
          'Falha na comunicação com o servidor. Verifique sua conexão e tente novamente.',
      )
    },
    [user],
  )

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const refetch = useCallback(async () => {
    await loadProfile(true)
  }, [loadProfile])

  const isLoading = status === 'loading'
  // When ready, check role; never assume false silently if status is error
  const isMaster = status === 'ready' && profile?.role === 'master'
  const isSuspended = status === 'ready' && profile?.status === 'suspended'

  return {
    isMaster,
    isSuspended,
    loading: isLoading,
    status,
    errorMessage,
    userProfile: profile,
    refetch,
  }
}
