import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useMasterStore } from '@/stores/useMasterStore'
import { ShieldAlert, RefreshCw, LogOut, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MasterRouteGuardProps {
  children: React.ReactNode
}

export const MasterRouteGuard: React.FC<MasterRouteGuardProps> = ({ children }) => {
  const { user, loading: authLoading, signOut } = useAuth()
  const { status, isMaster, error, checkMasterStatus, reset } = useMasterStore()
  const navigate = useNavigate()

  // Contingência de timeout local para NUNCA manter spinner eterno
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (user?.id) {
      checkMasterStatus(user.id)
    }
  }, [user?.id, checkMasterStatus])

  useEffect(() => {
    if (status === 'loading' || (authLoading && status === 'idle')) {
      const timer = setTimeout(() => {
        setTimedOut(true)
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setTimedOut(false)
    }
  }, [status, authLoading])

  const handleRetry = () => {
    setTimedOut(false)
    reset()
    if (user?.id) {
      checkMasterStatus(user.id)
    }
  }

  // Se não está autenticado e auth terminou
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />
  }

  // Se excedeu o tempo limite tentando validar
  if (timedOut) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Tempo de verificação esgotado</h1>
            <p className="text-sm text-slate-400">
              A verificação de privilégios de Master demorou mais que o esperado. Verifique sua
              conexão e tente novamente.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl h-12 flex items-center justify-center gap-2 border-b-4 border-amber-600 active:border-b-0"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/tasks')}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-2xl h-12 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Carregando status ou auth
  if (authLoading || status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white mb-2">Verificando credenciais Master</h1>
            <p className="text-xs text-slate-400">
              Validando permissões de acesso com segurança...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se não é master
  if (status === 'forbidden' || !isMaster) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-3xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Acesso Restrito</h1>
            <p className="text-sm text-slate-400">
              Esta área é restrita exclusivamente a administradores Master do sistema.
            </p>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/tasks')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl h-12 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </Button>
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="w-full border-slate-700 text-slate-400 hover:bg-slate-800 rounded-2xl h-12 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
