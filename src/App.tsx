import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AppStoreProvider } from '@/stores/useAppStore'
import { FocusRadarProvider } from '@/components/focus-radar/focus-radar-provider'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { AuthProvider } from '@/hooks/use-auth'
import { RequireAuth } from '@/components/RequireAuth'
import { useOnlineSync } from '@/hooks/use-online-sync'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'
import { useIsMaster } from '@/stores/useMasterStore'
import { MasterRouteGuard } from '@/components/master/MasterRouteGuard'
import { FeatureGate } from '@/components/master/FeatureGate'
import { SuspendedScreen } from '@/components/master/SuspendedScreen'

import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/TasksAndHabits'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Health from './pages/Health'
import Studies from './pages/Studies'
import Finance from './pages/Finance'
import Master from './pages/Master'

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

  useEffect(() => {
    loadFlags(user?.id)
  }, [loadFlags, user?.id])

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
                <Route
                  path="/studies"
                  element={
                    <FeatureGate featureKey="studies">
                      <Studies />
                    </FeatureGate>
                  }
                />
                <Route
                  path="/finance"
                  element={
                    <FeatureGate featureKey="finance">
                      <Finance />
                    </FeatureGate>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <FeatureGate featureKey="analytics">
                      <Analytics />
                    </FeatureGate>
                  }
                />
                <Route
                  path="/master"
                  element={
                    <MasterRouteGuard>
                      <Master />
                    </MasterRouteGuard>
                  }
                />
                <Route path="/profile" element={<Profile />} />
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
