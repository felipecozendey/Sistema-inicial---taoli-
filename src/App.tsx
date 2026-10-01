import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AppStoreProvider, useAppStore } from '@/stores/useAppStore'
import { FocusRadarProvider } from '@/components/focus-radar/focus-radar-provider'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { RequireAuth } from '@/components/RequireAuth'
import { useOnlineSync } from '@/hooks/use-online-sync'
import { useSiteSettingsStore, useBrandName } from '@/stores/useSiteSettingsStore'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'
import { useIsMaster } from '@/stores/useMasterStore'
import { supabase } from '@/lib/supabase/client'
import { MasterRouteGuard } from '@/components/master/MasterRouteGuard'
import { ProfessionalRouteGuard } from '@/components/professional/ProfessionalRouteGuard'
import { FeatureGate } from '@/components/master/FeatureGate'
import { SuspendedScreen } from '@/components/master/SuspendedScreen'
import { toast } from 'sonner'

import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/TasksAndHabits'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Social from './pages/Social'
import Health from './pages/Health'
import Finance from './pages/Finance'
import Master from './pages/Master'
import Professional from './pages/Professional'

function SuspendedGuard({ children }: { children: React.ReactNode }) {
  const { isSuspended } = useIsMaster()
  const location = useLocation()

  // Allow /settings even when suspended (item 7: cobrindo o app, exceto /settings para logout)
  if (isSuspended && location.pathname !== '/settings') {
    return <SuspendedScreen />
  }

  return <>{children}</>
}

function BootLoader() {
  const loadFlags = useFeatureFlagsStore((s) => s.loadFlags)
  const { user } = useAuth()
  const fetchTasks = useAppStore((s) => s.fetchTasks)
  const fetchHabits = useAppStore((s) => s.fetchHabits)
  const loadSiteData = useSiteSettingsStore((s) => s.loadSiteData)
  const { brandName } = useBrandName()
  const resetUserDataState = useAppStore((s) => s.resetUserDataState)
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const lastFocusFetchTimeRef = useRef<number>(0)
  const isCheckingResetRef = useRef(false)

  // Função auxiliar para verificar account_reset_at do usuário autenticado
  const checkAccountReset = async (userId: string) => {
    if (isCheckingResetRef.current) return
    isCheckingResetRef.current = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_reset_at')
        .eq('id', userId)
        .single()

      if (error || !data) return

      const accountResetAt = (data as any)?.account_reset_at
      if (!accountResetAt) return

      const resetTimestamp = new Date(accountResetAt).getTime()
      if (isNaN(resetTimestamp)) return

      const localSeen = localStorage.getItem('vt_last_reset_seen')
      const localSeenTimestamp = localSeen ? new Date(localSeen).getTime() : 0

      // Se o carimbo do banco for mais recente que o local visto
      if (resetTimestamp > localSeenTimestamp) {
        // Limpar as chaves vt_* relacionadas a dados (preservar preferências de sessão/tema/login)
        const keysToPreserve = new Set([
          'vt_last_reset_seen',
          'theme',
          'vite-ui-theme',
          'supabase.auth.token',
          'sb-',
        ])

        const toRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key) continue
          if (keysToPreserve.has(key)) continue
          if (key.startsWith('sb-')) continue // sessao supabase
          if (key.startsWith('vt_')) {
            // Preservar tours dismissed? vt_tour_dismissed_*
            if (key.startsWith('vt_tour_dismissed_')) continue
            toRemove.push(key)
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k))

        // Resetar o estado da useAppStore para vazio
        resetUserDataState()

        // Gravar vt_last_reset_seen com o carimbo atualizado
        localStorage.setItem('vt_last_reset_seen', accountResetAt)

        // Toast de aviso
        toast.info('Sua conta foi atualizada pelo administrador')

        // Sincronizar novamente do banco
        await fetchTasks()
        await fetchHabits()
      }
    } catch (err) {
      console.warn('Erro ao verificar account_reset_at:', err)
    } finally {
      isCheckingResetRef.current = false
    }
  }

  // 0. Carregar configurações de site_settings (whitelabel) e sincronizar document.title
  useEffect(() => {
    loadSiteData()
  }, [loadSiteData])

  useEffect(() => {
    if (brandName) {
      document.title = brandName
    }
  }, [brandName])

  // 1. Plug principal: fetchTasks e fetchHabits quando usuário autenticado fica disponível + checar reset
  useEffect(() => {
    loadFlags(user?.id)

    if (user?.id) {
      if (lastFetchedUserIdRef.current !== user.id) {
        lastFetchedUserIdRef.current = user.id
        checkAccountReset(user.id).then(() => {
          fetchTasks()
          fetchHabits()
        })
      }
    } else {
      lastFetchedUserIdRef.current = null
    }
  }, [loadFlags, user?.id, fetchTasks, fetchHabits])

  // 2. Frescor automático: listener de visibilitychange e focus com debounce (mínimo 15s) + checagem de reset
  useEffect(() => {
    if (!user?.id) return

    const handleFreshen = () => {
      if (document.visibilityState === 'hidden') return
      const now = Date.now()
      // Debounce de 15 segundos entre refetches acionados por visibilidade/foco
      if (now - lastFocusFetchTimeRef.current < 15000) return
      lastFocusFetchTimeRef.current = now
      checkAccountReset(user.id)
      fetchTasks()
      fetchHabits()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFreshen()
      }
    }

    window.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', handleFreshen)

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', handleFreshen)
    }
  }, [user?.id, fetchTasks, fetchHabits])

  return null
}

function AppInner() {
  return (
    <AppStoreProvider>
      <BootLoader />
      <OnlineSyncListener />
      <FocusRadarProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Rotas Protegidas dentro do Layout e SuspendedGuard */}
              <Route
                element={
                  <RequireAuth>
                    <SuspendedGuard>
                      <Layout />
                    </SuspendedGuard>
                  </RequireAuth>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/tasks"
                  element={
                    <FeatureGate featureKey="tasks">
                      <Tasks />
                    </FeatureGate>
                  }
                />
                <Route
                  path="/health"
                  element={
                    <FeatureGate featureKey="health">
                      <Health />
                    </FeatureGate>
                  }
                />
                <Route path="/studies" element={<Navigate to="/tasks?tab=estudos" replace />} />
                <Route
                  path="/finance"
                  element={
                    <FeatureGate featureKey="finance">
                      <Finance />
                    </FeatureGate>
                  }
                />
                <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/master"
                  element={
                    <MasterRouteGuard>
                      <Master />
                    </MasterRouteGuard>
                  }
                />
                <Route
                  path="/professional"
                  element={
                    <ProfessionalRouteGuard>
                      <Professional />
                    </ProfessionalRouteGuard>
                  }
                />
                <Route path="/social" element={<Social />} />
                <Route path="/profile" element={<Navigate to="/social?tab=perfil" replace />} />
                <Route path="/u/:usernameParam" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </FocusRadarProvider>
    </AppStoreProvider>
  )
}

function OnlineSyncListener() {
  useOnlineSync()
  return null
}

const App = () => {
  useServiceWorker()
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
