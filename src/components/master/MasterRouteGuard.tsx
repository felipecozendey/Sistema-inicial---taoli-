import { ReactNode, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react'
import { useIsMaster } from '@/stores/useMasterStore'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface MasterRouteGuardProps {
  children: ReactNode
}

export function MasterRouteGuard({ children }: MasterRouteGuardProps) {
  const { isMaster, status, errorMessage, refetch } = useIsMaster()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [retrying, setRetrying] = useState(false)

  // 1. Estado Loading: spinner com estilo amigável Duolingo / âmbar master
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-4 shadow-sm" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">
          Verificando credenciais Master...
        </p>
      </div>
    )
  }

  // 2. Estado Erro: feedback visual amigável Duolingo com botões 3D
  if (status === 'error') {
    const handleRetry = async () => {
      setRetrying(true)
      try {
        await refetch()
      } finally {
        setRetrying(false)
      }
    }

    const handleSignOut = async () => {
      await signOut()
      navigate('/', { replace: true })
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-6 shadow-inner">
            <AlertTriangle className="w-10 h-10 animate-bounce" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mb-2">
            Não conseguimos verificar seu acesso
          </h1>

          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Pode haver uma oscilação na conexão com a internet ou sua sessão precisa ser renovada.
            {errorMessage ? (
              <span className="block mt-2 text-xs text-amber-700/80 dark:text-amber-300/80 bg-amber-500/10 rounded-xl p-2 font-mono">
                {errorMessage}
              </span>
            ) : null}
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full rounded-2xl h-12 font-bold bg-amber-500 hover:bg-amber-600 text-white border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Verificando...' : 'Tentar novamente'}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full rounded-2xl h-12 font-bold border-2 border-muted hover:bg-muted active:border-b-0 active:translate-y-1 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Estado Ready + não master: redirecionar silenciosamente para o dashboard
  if (!isMaster) {
    return <Navigate to="/dashboard" replace />
  }

  // 4. Estado Ready + master: renderizar página normalmente
  return <>{children}</>
}
