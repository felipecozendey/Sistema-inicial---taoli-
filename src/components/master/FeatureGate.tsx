import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'

interface FeatureGateProps {
  featureKey: string
  children: ReactNode
}

export function FeatureGate({ featureKey, children }: FeatureGateProps) {
  const isEnabled = useFeatureFlagsStore((s) => s.isEnabled(featureKey))
  const areAllModulesDisabled = useFeatureFlagsStore((s) => s.areAllModulesDisabled())
  const navigate = useNavigate()

  useEffect(() => {
    // If not enabled and all modules are disabled, keep user on a friendly screen rather than bouncing loop
    if (!isEnabled && !areAllModulesDisabled) {
      navigate('/dashboard', { replace: true })
    }
  }, [isEnabled, areAllModulesDisabled, navigate])

  if (!isEnabled) {
    if (areAllModulesDisabled) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-black text-foreground">
            Sua conta ainda não tem módulos liberados
          </h2>
          <p className="text-sm font-semibold text-muted-foreground max-w-md mt-2">
            O administrador do sistema ainda não liberou módulos para o seu perfil. Entre em contato
            com o suporte para ativação.
          </p>
        </div>
      )
    }

    return null
  }

  return <>{children}</>
}
