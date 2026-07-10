import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AppStoreProvider } from '@/stores/useAppStore'
import { FocusRadarProvider } from '@/components/focus-radar/focus-radar-provider'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { AuthScreen } from '@/components/auth-screen'
import { useOnlineSync } from '@/hooks/use-online-sync'

import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/TasksAndHabits'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Health from './pages/Health'
import Studies from './pages/Studies'

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <AppStoreProvider>
      <OnlineSyncListener />
      <FocusRadarProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/health" element={<Health />} />
                <Route path="/studies" element={<Studies />} />
                <Route path="/analytics" element={<Analytics />} />
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
