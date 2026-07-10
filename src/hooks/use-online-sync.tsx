import { useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { replayQueue } from '@/lib/sync-engine'
import { toast } from '@/hooks/use-toast'

export function useOnlineSync() {
  const { offlineQueue, clearOfflineQueue } = useAppStore()

  useEffect(() => {
    const handleOnline = async () => {
      if (offlineQueue.length === 0) return
      const success = await replayQueue(offlineQueue)
      if (success) {
        clearOfflineQueue()
        toast({
          title: 'Você está online de volta!',
          description: 'Seus dados de progresso foram sincronizados com a nuvem. ☁️✨',
        })
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [offlineQueue, clearOfflineQueue])
}
