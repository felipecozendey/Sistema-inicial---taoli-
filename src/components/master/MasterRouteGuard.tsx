import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsMaster } from '@/stores/useMasterStore'

interface MasterRouteGuardProps {
  children: ReactNode
}

export function MasterRouteGuard({ children }: MasterRouteGuardProps) {
  const { isMaster, loading } = useIsMaster()

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // Silent redirect to dashboard if not master
  if (!isMaster) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
