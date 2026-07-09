import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { playFocusSound } from '@/lib/focus-sounds'

interface FocusRadarContextValue {
  isRunning: boolean
  timeRemaining: number
  toggle: () => void
  lastTriggered: Date | null
}

const FocusRadarContext = createContext<FocusRadarContextValue | undefined>(undefined)

export function FocusRadarProvider({ children }: { children: ReactNode }) {
  const { focusRadar, updateFocusRadar } = useAppStore()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [lastTriggered, setLastTriggered] = useState<Date | null>(null)
  const settingsRef = useRef(focusRadar)
  settingsRef.current = focusRadar

  const triggerAlert = useCallback(() => {
    const settings = settingsRef.current
    playFocusSound(settings.soundProfile)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Radar de Foco', {
        body: settings.message,
        icon: '/favicon.ico',
      })
    }
    setLastTriggered(new Date())
  }, [])

  useEffect(() => {
    if (!focusRadar.enabled) {
      setTimeRemaining(0)
      return
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const intervalMs = focusRadar.interval * 60 * 1000
    setTimeRemaining(Math.floor(intervalMs / 1000))

    const mainInterval = window.setInterval(() => {
      triggerAlert()
      setTimeRemaining(Math.floor(intervalMs / 1000))
    }, intervalMs)

    const countdownInterval = window.setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearInterval(mainInterval)
      clearInterval(countdownInterval)
    }
  }, [focusRadar.enabled, focusRadar.interval, triggerAlert])

  const toggle = useCallback(() => {
    updateFocusRadar({ enabled: !settingsRef.current.enabled })
  }, [updateFocusRadar])

  return (
    <FocusRadarContext.Provider
      value={{ isRunning: focusRadar.enabled, timeRemaining, toggle, lastTriggered }}
    >
      {children}
    </FocusRadarContext.Provider>
  )
}

export function useFocusRadar() {
  const ctx = useContext(FocusRadarContext)
  if (!ctx) throw new Error('useFocusRadar must be used within FocusRadarProvider')
  return ctx
}
