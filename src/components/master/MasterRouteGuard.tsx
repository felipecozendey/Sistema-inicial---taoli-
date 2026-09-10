import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MasterRouteGuardProps {
  children?: React.ReactNode
}

export const MasterRouteGuard: React.FC<MasterRouteGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [isMaster, setIsMaster] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [timedOut, setTimedOut] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true
    let timer: ReturnType<typeof setTimeout> | null = null

    setLoading(true)
    setTimedOut(false)

    // Timeout máximo de segurança (5 segundos) para nunca prender o usuário em spinner eterno
    timer = setTimeout(() => {
      if (isMounted) {
        setTimedOut(true)
        setLoading(false)
      }
    }, 5000)

    const checkMasterRole = async () => {
      try {
        if (!user) {
          if (isMounted) {
            setIsMaster(false)
            setLoading(false)
          }
          if (timer) clearTimeout(timer)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error checking master role:', error)
          if (isMounted) {
            setIsMaster(false)
            setLoading(false)
          }
        } else {
          if (isMounted) {
            setIsMaster(data?.role === 'master')
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Master check failed:', err)
        if (isMounted) {
          setIsMaster(false)
          setLoading(false)
        }
      } finally {
        if (timer) clearTimeout(timer)
      }
    }

    if (!authLoading) {
      checkMasterRole()
    }

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
    }
  }, [user, authLoading, retryCount])

  // Se excedeu o tempo, exibir tela de erro com ação clara de retry
  if (timedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center max-w-md mx-auto animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-800 shadow-sm">
          <AlertCircle className="w-8 h-8" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black text-foreground">Tempo de verificação esgotado</h3>
        <p className="text-sm font-semibold text-muted-foreground">
          A validação do acesso master demorou mais que o esperado ou sua conexão oscilou.
        </p>
        <Button
          onClick={() => {
            setTimedOut(false)
            setLoading(true)
            setRetryCount((prev) => prev + 1)
          }}
          className="bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 rounded-2xl font-black text-sm gap-2 mt-2 px-6 h-12 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#58CC02]" />
        <p className="text-sm text-muted-foreground font-black animate-pulse">
          Verificando permissões de acesso...
        </p>
      </div>
    )
  }

  if (!user || !isMaster) {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default MasterRouteGuard
