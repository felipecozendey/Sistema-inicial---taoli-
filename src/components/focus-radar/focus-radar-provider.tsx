import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useAppStore, FocusPhase, FocusMode } from '@/stores/useAppStore'
import { playFocusSound } from '@/lib/focus-sounds'

export interface DailyFocusStats {
  date: string
  sessions: number
  focusMinutes: number
}

interface FocusRadarContextValue {
  isRunning: boolean
  timeRemaining: number
  totalDuration: number
  phase: FocusPhase
  mode: FocusMode
  currentCycle: number
  totalCycles: number
  toggle: () => void
  start: () => void
  pause: () => void
  reset: () => void
  skipPhase: () => void
  switchMode: (newMode: FocusMode) => void
  switchPhase: (newPhase: FocusPhase) => void
  lastTriggered: Date | null
  todayStats: DailyFocusStats
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  taskSessionCounts: Record<string, number>
}

const FocusRadarContext = createContext<FocusRadarContextValue | undefined>(undefined)

const STATS_KEY = 'vt_focus_stats'
const ACTIVE_STATE_KEY = 'vt_focus_active_state'
const TASK_COUNTS_KEY = 'vt_focus_task_counts'

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadTodayStats(): DailyFocusStats {
  const today = getTodayString()
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DailyFocusStats
      if (parsed && parsed.date === today) {
        return parsed
      }
    }
  } catch {
    /* ignore */
  }
  return { date: today, sessions: 0, focusMinutes: 0 }
}

function saveTodayStats(stats: DailyFocusStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {
    /* ignore */
  }
}

interface ActiveTimerState {
  targetTimestamp: number | null
  pausedRemaining: number | null
  mode: FocusMode
  phase: FocusPhase
  cycle: number
}

function loadActiveState(): ActiveTimerState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_STATE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

function saveActiveState(state: ActiveTimerState | null) {
  try {
    if (!state) {
      localStorage.removeItem(ACTIVE_STATE_KEY)
    } else {
      localStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(state))
    }
  } catch {
    /* ignore */
  }
}

function loadTaskCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TASK_COUNTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {}
}

function saveTaskCounts(counts: Record<string, number>) {
  try {
    localStorage.setItem(TASK_COUNTS_KEY, JSON.stringify(counts))
  } catch {
    /* ignore */
  }
}

export function FocusRadarProvider({ children }: { children: ReactNode }) {
  const { focusRadar, updateFocusRadar } = useAppStore()

  // Sincronizar fases e ciclos locais ou restaurados
  const [phase, setPhase] = useState<FocusPhase>(focusRadar.phase || 'focus')
  const [currentCycle, setCurrentCycle] = useState<number>(focusRadar.currentCycle || 1)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [lastTriggered, setLastTriggered] = useState<Date | null>(null)
  const [todayStats, setTodayStats] = useState<DailyFocusStats>(() => loadTodayStats())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskSessionCounts, setTaskSessionCounts] = useState<Record<string, number>>(() =>
    loadTaskCounts(),
  )

  const settingsRef = useRef(focusRadar)
  settingsRef.current = focusRadar

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const cycleRef = useRef(currentCycle)
  cycleRef.current = currentCycle

  const selectedTaskIdRef = useRef(selectedTaskId)
  selectedTaskIdRef.current = selectedTaskId

  const targetTimestampRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number | null>(null)

  // Obter duração total em segundos para a fase atual
  const getPhaseDurationSeconds = useCallback(
    (p: FocusPhase, m: FocusMode = settingsRef.current.mode): number => {
      const s = settingsRef.current
      if (m === 'radar') {
        return Math.max(1, s.interval) * 60
      }
      if (p === 'short') {
        return Math.max(1, s.shortBreakMinutes) * 60
      }
      if (p === 'long') {
        return Math.max(1, s.longBreakMinutes) * 60
      }
      return Math.max(1, s.focusMinutes) * 60
    },
    [],
  )

  const currentDurationSeconds = getPhaseDurationSeconds(phase, focusRadar.mode)

  // Alerta sonoro e notificação push do browser
  const triggerNotification = useCallback(
    (title: string, body: string, soundOverride?: boolean) => {
      const s = settingsRef.current
      playFocusSound(s.soundProfile)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          })
        } catch {
          /* ignore */
        }
      }
      setLastTriggered(new Date())
    },
    [],
  )

  // Adicionar sessão concluída às estatísticas
  const registerCompletedFocusSession = useCallback((minutes: number) => {
    setTodayStats((prev) => {
      const today = getTodayString()
      const base = prev.date === today ? prev : { date: today, sessions: 0, focusMinutes: 0 }
      const updated: DailyFocusStats = {
        date: today,
        sessions: base.sessions + 1,
        focusMinutes: base.focusMinutes + minutes,
      }
      saveTodayStats(updated)
      return updated
    })

    const taskId = selectedTaskIdRef.current
    if (taskId) {
      setTaskSessionCounts((prev) => {
        const next = { ...prev, [taskId]: (prev[taskId] || 0) + 1 }
        saveTaskCounts(next)
        return next
      })
    }
  }, [])

  // Inicialização / restauração do timer ao montar
  useEffect(() => {
    const savedActive = loadActiveState()
    const mode = focusRadar.mode || 'pomodoro'

    if (savedActive && focusRadar.enabled) {
      setPhase(savedActive.phase)
      setCurrentCycle(savedActive.cycle)

      if (savedActive.targetTimestamp) {
        const remaining = Math.max(0, Math.round((savedActive.targetTimestamp - Date.now()) / 1000))
        targetTimestampRef.current = savedActive.targetTimestamp
        pausedRemainingRef.current = null
        setTimeRemaining(remaining)
      } else if (savedActive.pausedRemaining !== null) {
        targetTimestampRef.current = null
        pausedRemainingRef.current = savedActive.pausedRemaining
        setTimeRemaining(savedActive.pausedRemaining)
      } else {
        const dur = getPhaseDurationSeconds(savedActive.phase, mode)
        setTimeRemaining(dur)
      }
    } else {
      const dur = getPhaseDurationSeconds(focusRadar.phase || 'focus', mode)
      setTimeRemaining(dur)
      if (!focusRadar.enabled) {
        targetTimestampRef.current = null
        pausedRemainingRef.current = null
        saveActiveState(null)
      }
    }
  }, [])

  // Função central: transição de fase quando o tempo chega a zero
  const handlePhaseComplete = useCallback(() => {
    const s = settingsRef.current
    const currPhase = phaseRef.current
    const currCycle = cycleRef.current

    if (s.mode === 'radar') {
      // Modo Radar: dispara alerta a cada X minutos e reinicia
      triggerNotification('Radar de Foco', s.message || 'Ainda focado? 👀')
      const dur = Math.max(1, s.interval) * 60
      targetTimestampRef.current = Date.now() + dur * 1000
      setTimeRemaining(dur)
      saveActiveState({
        targetTimestamp: targetTimestampRef.current,
        pausedRemaining: null,
        mode: 'radar',
        phase: 'focus',
        cycle: 1,
      })
      return
    }

    // Modo Pomodoro
    if (currPhase === 'focus') {
      // Registrar tempo de foco concluído
      registerCompletedFocusSession(s.focusMinutes)

      // Próxima fase: se atingiu os ciclos antes da pausa longa, entra pausa longa; senão, pausa curta
      const isLongBreak = currCycle >= s.cyclesBeforeLongBreak
      const nextPhase: FocusPhase = isLongBreak ? 'long' : 'short'
      const nextDuration = isLongBreak
        ? Math.max(1, s.longBreakMinutes) * 60
        : Math.max(1, s.shortBreakMinutes) * 60

      triggerNotification(
        '🍅 Ciclo de Foco Concluído!',
        isLongBreak
          ? 'Parabéns! Você concluiu todos os ciclos. Hora de uma pausa longa relaxante 🌟'
          : 'Excelente trabalho! Hora de uma pausa curta para recarregar as energias ☕',
      )

      setPhase(nextPhase)
      phaseRef.current = nextPhase
      updateFocusRadar({ phase: nextPhase })

      if (s.autoStartNext) {
        targetTimestampRef.current = Date.now() + nextDuration * 1000
        pausedRemainingRef.current = null
        setTimeRemaining(nextDuration)
        saveActiveState({
          targetTimestamp: targetTimestampRef.current,
          pausedRemaining: null,
          mode: 'pomodoro',
          phase: nextPhase,
          cycle: currCycle,
        })
      } else {
        targetTimestampRef.current = null
        pausedRemainingRef.current = nextDuration
        setTimeRemaining(nextDuration)
        updateFocusRadar({ enabled: false })
        saveActiveState({
          targetTimestamp: null,
          pausedRemaining: nextDuration,
          mode: 'pomodoro',
          phase: nextPhase,
          cycle: currCycle,
        })
      }
    } else {
      // Fim de pausa (curta ou longa)
      const nextCycle = currPhase === 'long' ? 1 : currCycle + 1
      const nextPhase: FocusPhase = 'focus'
      const nextDuration = Math.max(1, s.focusMinutes) * 60

      triggerNotification('🎯 Pausa encerrada', 'Hora de focar novamente com força total!')

      setCurrentCycle(nextCycle)
      cycleRef.current = nextCycle
      setPhase(nextPhase)
      phaseRef.current = nextPhase
      updateFocusRadar({ phase: nextPhase, currentCycle: nextCycle })

      if (s.autoStartNext) {
        targetTimestampRef.current = Date.now() + nextDuration * 1000
        pausedRemainingRef.current = null
        setTimeRemaining(nextDuration)
        saveActiveState({
          targetTimestamp: targetTimestampRef.current,
          pausedRemaining: null,
          mode: 'pomodoro',
          phase: nextPhase,
          cycle: nextCycle,
        })
      } else {
        targetTimestampRef.current = null
        pausedRemainingRef.current = nextDuration
        setTimeRemaining(nextDuration)
        updateFocusRadar({ enabled: false })
        saveActiveState({
          targetTimestamp: null,
          pausedRemaining: nextDuration,
          mode: 'pomodoro',
          phase: nextPhase,
          cycle: nextCycle,
        })
      }
    }
  }, [triggerNotification, registerCompletedFocusSession, updateFocusRadar])

  // Heartbeat do timer baseado em Date.now()
  useEffect(() => {
    if (!focusRadar.enabled) {
      return
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Se não há targetTimestamp ativo, define a partir do tempo restante ou duração padrão
    if (!targetTimestampRef.current) {
      const remaining =
        pausedRemainingRef.current !== null
          ? pausedRemainingRef.current
          : getPhaseDurationSeconds(phaseRef.current, focusRadar.mode)
      targetTimestampRef.current = Date.now() + remaining * 1000
      pausedRemainingRef.current = null
      setTimeRemaining(remaining)
      saveActiveState({
        targetTimestamp: targetTimestampRef.current,
        pausedRemaining: null,
        mode: focusRadar.mode,
        phase: phaseRef.current,
        cycle: cycleRef.current,
      })
    }

    const intervalId = window.setInterval(() => {
      if (!targetTimestampRef.current) return
      const now = Date.now()
      const diffSec = Math.round((targetTimestampRef.current - now) / 1000)

      if (diffSec <= 0) {
        setTimeRemaining(0)
        targetTimestampRef.current = null
        handlePhaseComplete()
      } else {
        setTimeRemaining(diffSec)
      }
    }, 500)

    // Listener para visibilitychange: previne derrapagem quando a aba volta do background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && targetTimestampRef.current) {
        const now = Date.now()
        const diffSec = Math.round((targetTimestampRef.current - now) / 1000)
        if (diffSec <= 0) {
          setTimeRemaining(0)
          targetTimestampRef.current = null
          handlePhaseComplete()
        } else {
          setTimeRemaining(diffSec)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [focusRadar.enabled, focusRadar.mode, getPhaseDurationSeconds, handlePhaseComplete])

  // Iniciar timer
  const start = useCallback(() => {
    if (focusRadar.enabled) return
    const remaining =
      pausedRemainingRef.current !== null
        ? pausedRemainingRef.current
        : timeRemaining > 0
          ? timeRemaining
          : getPhaseDurationSeconds(phase, focusRadar.mode)

    targetTimestampRef.current = Date.now() + remaining * 1000
    pausedRemainingRef.current = null
    setTimeRemaining(remaining)
    updateFocusRadar({ enabled: true })
    saveActiveState({
      targetTimestamp: targetTimestampRef.current,
      pausedRemaining: null,
      mode: focusRadar.mode,
      phase,
      cycle: currentCycle,
    })
  }, [
    focusRadar.enabled,
    focusRadar.mode,
    phase,
    currentCycle,
    timeRemaining,
    getPhaseDurationSeconds,
    updateFocusRadar,
  ])

  // Pausar timer
  const pause = useCallback(() => {
    if (!focusRadar.enabled) return
    let remaining = timeRemaining
    if (targetTimestampRef.current) {
      remaining = Math.max(0, Math.round((targetTimestampRef.current - Date.now()) / 1000))
    }
    targetTimestampRef.current = null
    pausedRemainingRef.current = remaining
    setTimeRemaining(remaining)
    updateFocusRadar({ enabled: false })
    saveActiveState({
      targetTimestamp: null,
      pausedRemaining: remaining,
      mode: focusRadar.mode,
      phase,
      cycle: currentCycle,
    })
  }, [focusRadar.enabled, focusRadar.mode, phase, currentCycle, timeRemaining, updateFocusRadar])

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (settingsRef.current.enabled) {
      pause()
    } else {
      start()
    }
  }, [pause, start])

  // Reiniciar a fase atual
  const reset = useCallback(() => {
    const dur = getPhaseDurationSeconds(phase, focusRadar.mode)
    targetTimestampRef.current = null
    pausedRemainingRef.current = dur
    setTimeRemaining(dur)
    updateFocusRadar({ enabled: false })
    saveActiveState({
      targetTimestamp: null,
      pausedRemaining: dur,
      mode: focusRadar.mode,
      phase,
      cycle: currentCycle,
    })
  }, [phase, focusRadar.mode, currentCycle, getPhaseDurationSeconds, updateFocusRadar])

  // Pular fase atual manualmente
  const skipPhase = useCallback(() => {
    const s = settingsRef.current
    if (s.mode === 'radar') {
      reset()
      return
    }

    if (phase === 'focus') {
      const isLong = currentCycle >= s.cyclesBeforeLongBreak
      const nextPhase: FocusPhase = isLong ? 'long' : 'short'
      const dur = getPhaseDurationSeconds(nextPhase, s.mode)
      setPhase(nextPhase)
      phaseRef.current = nextPhase
      updateFocusRadar({ phase: nextPhase, enabled: false })
      targetTimestampRef.current = null
      pausedRemainingRef.current = dur
      setTimeRemaining(dur)
      saveActiveState({
        targetTimestamp: null,
        pausedRemaining: dur,
        mode: 'pomodoro',
        phase: nextPhase,
        cycle: currentCycle,
      })
    } else {
      const nextCycle = phase === 'long' ? 1 : currentCycle + 1
      const dur = getPhaseDurationSeconds('focus', s.mode)
      setCurrentCycle(nextCycle)
      cycleRef.current = nextCycle
      setPhase('focus')
      phaseRef.current = 'focus'
      updateFocusRadar({ phase: 'focus', currentCycle: nextCycle, enabled: false })
      targetTimestampRef.current = null
      pausedRemainingRef.current = dur
      setTimeRemaining(dur)
      saveActiveState({
        targetTimestamp: null,
        pausedRemaining: dur,
        mode: 'pomodoro',
        phase: 'focus',
        cycle: nextCycle,
      })
    }
  }, [phase, currentCycle, reset, getPhaseDurationSeconds, updateFocusRadar])

  // Trocar de fase manualmente
  const switchPhase = useCallback(
    (newPhase: FocusPhase) => {
      setPhase(newPhase)
      phaseRef.current = newPhase
      updateFocusRadar({ phase: newPhase, enabled: false })
      const dur = getPhaseDurationSeconds(newPhase, focusRadar.mode)
      targetTimestampRef.current = null
      pausedRemainingRef.current = dur
      setTimeRemaining(dur)
      saveActiveState({
        targetTimestamp: null,
        pausedRemaining: dur,
        mode: focusRadar.mode,
        phase: newPhase,
        cycle: currentCycle,
      })
    },
    [focusRadar.mode, currentCycle, getPhaseDurationSeconds, updateFocusRadar],
  )

  // Alternar entre Pomodoro e Radar legado
  const switchMode = useCallback(
    (newMode: FocusMode) => {
      updateFocusRadar({ mode: newMode, enabled: false })
      const p = newMode === 'radar' ? 'focus' : phase
      setPhase(p)
      phaseRef.current = p
      const dur = getPhaseDurationSeconds(p, newMode)
      targetTimestampRef.current = null
      pausedRemainingRef.current = dur
      setTimeRemaining(dur)
      saveActiveState({
        targetTimestamp: null,
        pausedRemaining: dur,
        mode: newMode,
        phase: p,
        cycle: currentCycle,
      })
    },
    [phase, currentCycle, getPhaseDurationSeconds, updateFocusRadar],
  )

  // Atualizar timeRemaining se as configurações de minutos mudarem enquanto pausado
  useEffect(() => {
    if (!focusRadar.enabled && pausedRemainingRef.current === null) {
      const dur = getPhaseDurationSeconds(phase, focusRadar.mode)
      setTimeRemaining(dur)
    }
  }, [
    focusRadar.focusMinutes,
    focusRadar.shortBreakMinutes,
    focusRadar.longBreakMinutes,
    focusRadar.interval,
    phase,
    focusRadar.mode,
    focusRadar.enabled,
    getPhaseDurationSeconds,
  ])

  return (
    <FocusRadarContext.Provider
      value={{
        isRunning: focusRadar.enabled,
        timeRemaining,
        totalDuration: currentDurationSeconds,
        phase,
        mode: focusRadar.mode,
        currentCycle,
        totalCycles: focusRadar.cyclesBeforeLongBreak,
        toggle,
        start,
        pause,
        reset,
        skipPhase,
        switchMode,
        switchPhase,
        lastTriggered,
        todayStats,
        selectedTaskId,
        setSelectedTaskId,
        taskSessionCounts,
      }}
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
