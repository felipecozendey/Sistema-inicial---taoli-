import { ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'
import { toast } from 'sonner'

interface FeatureGateProps {
  featureKey: string
  children: ReactNode
}

export function FeatureGate({ featureKey, children }: FeatureGateProps) {
  const flags = useFeatureFlagsStore((s) => s.flags)
  const isEnabled = flags[featureKey] !== false

  useEffect(() => {
    if (!isEnabled) {
      toast.info('Este módulo está desativado pelo administrador.')
    }
  }, [isEnabled])

  if (!isEnabled) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
