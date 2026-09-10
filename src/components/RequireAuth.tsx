import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-[#58CC02] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    const currentPath = location.pathname + location.search
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />
  }

  return <>{children}</>
}
