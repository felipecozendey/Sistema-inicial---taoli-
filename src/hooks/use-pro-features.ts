import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

/**
 * Global architecture flag / helper for pro features.
 * "Pro hoje, todos amanhã"
 * Toda checagem de UI / ação das features novas de grupos passa por aqui.
 * Para liberar no futuro para todos os usuários, basta mudar a flag ou o retorno da função.
 */
export const FORCE_PRO_FEATURES_FOR_ALL = false

/**
 * Checks if a profile object represents a pro user
 */
export function isProUser(
  profile?: { is_professional?: boolean | null; role?: string | null } | null,
): boolean {
  if (FORCE_PRO_FEATURES_FOR_ALL) return true
  if (!profile) return false
  return Boolean(profile.is_professional || profile.role === 'master')
}

/**
 * React hook to verify if the currently authenticated user has Pro features enabled.
 * Uses profiles.is_professional / master status with cached state and reactive updates.
 */
export function useProFeatures() {
  const { user, loading: authLoading } = useAuth()
  const [isPro, setIsPro] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    if (FORCE_PRO_FEATURES_FOR_ALL) {
      setIsPro(true)
      setLoading(false)
      return
    }

    if (!user) {
      setIsPro(false)
      setLoading(false)
      return
    }

    const checkProStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_professional, role')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Erro ao verificar status profissional:', error)
          if (isMounted) {
            setIsPro(false)
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          setIsPro(isProUser(data as any))
          setLoading(false)
        }
      } catch (err) {
        console.error('Exceção ao checar features pro:', err)
        if (isMounted) {
          setIsPro(false)
          setLoading(false)
        }
      }
    }

    if (!authLoading) {
      checkProStatus()
    }

    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  return {
    isPro: FORCE_PRO_FEATURES_FOR_ALL || isPro,
    loading: FORCE_PRO_FEATURES_FOR_ALL ? false : loading || authLoading,
  }
}
