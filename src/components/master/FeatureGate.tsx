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
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4 shadow-sm">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-black text-foreground">
            Sua conta ainda não tem módulos liberados
          </h2>
          <p className="text-sm font-semibold text-muted-foreground max-w-md mt-2 leading-relaxed">
            O administrador do sistema ainda não liberou módulos (Tarefas, Hábitos, Saúde, Estudos,
            Finanças ou Análises) para o seu perfil. Entre em contato com o suporte para ativação.
          </p>
        </div>
      )
    }

    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-black text-foreground">Módulo Temporariamente Indisponível</h2>
        <p className="text-sm font-semibold text-muted-foreground max-w-md mt-2">
          Esta funcionalidade está desativada no momento para a sua conta ou pela administração
          geral.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
