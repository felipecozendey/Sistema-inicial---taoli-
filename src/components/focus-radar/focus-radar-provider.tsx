import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useAppStore, FocusPhase, FocusMode, AdaFocusSettings } from '@/stores/useAppStore'
import { playFocusSound } from '@/lib/focus-sounds'
import { AdaFocusPopup } from '@/components/focus-radar/ada-focus-popup'

export interface DailyFocusStats {
  date: string
  sessions: number
  focusMinutes: number
}

export interface FocusRadarContextValue {
  // Pomodoro
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
  focusHistory: FocusHistoryMap
  taskSessionCounts: Record<string, number>

  // Ada Focus
  adaFocus: AdaFocusSettings
  adaFocusActive: boolean
  adaFocusTimeRemaining: number
  adaFocusPopupOpen: boolean
  dismissAdaFocusPopup: () => void
  triggerAdaFocusPreview: () => void
}

export type FocusHistoryMap = Record<string, { sessions: number; focusMinutes: number }>

const FocusRadarContext = createContext<FocusRadarContextValue | undefined>(undefined)

const STATS_KEY = 'vt_focus_stats'
const HISTORY_KEY = 'vt_focus_history'
const ACTIVE_STATE_KEY = 'vt_focus_active_state'
const TASK_COUNTS_KEY = 'vt_focus_task_counts'

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadFocusHistory(): FocusHistoryMap {
  const history: FocusHistoryMap = {}
  try {
    const rawHist = localStorage.getItem(HISTORY_KEY)
    if (rawHist) {
      const parsed = JSON.parse(rawHist)
      if (parsed && typeof parsed === 'object') {
        Object.assign(history, parsed)
      }
    }
  } catch {
    /* ignore */
  }

  // Retrocompatibilidade: migrar vt_focus_stats para o histórico se ainda não existir
  try {
    const rawSingle = localStorage.getItem(STATS_KEY)
    if (rawSingle) {
      const parsed = JSON.parse(rawSingle) as DailyFocusStats
      if (parsed && parsed.date) {
        if (!history[parsed.date]) {
          history[parsed.date] = {
            sessions: parsed.sessions || 0,
            focusMinutes: parsed.focusMinutes || 0,
          }
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
        }
      }
    }
  } catch {
    /* ignore */
  }

  return history
}

function saveFocusHistory(history: FocusHistoryMap) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    /* ignore */
  }
}

function loadTodayStats(history?: FocusHistoryMap): DailyFocusStats {
  const today = getTodayString()
  if (history && history[today]) {
    return {
      date: today,
      sessions: history[today].sessions || 0,
      focusMinutes: history[today].focusMinutes || 0,
    }
  }
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
  const [focusHistory, setFocusHistory] = useState<FocusHistoryMap>(() => loadFocusHistory())
  const [todayStats, setTodayStats] = useState<DailyFocusStats>(() => {
    const hist = loadFocusHistory()
    return loadTodayStats(hist)
  })
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

  // ESTADO DO MOTOR ADA FOCUS INDEPENDENTE
  const [adaFocusPopupOpen, setAdaFocusPopupOpen] = useState<boolean>(false)
  const [adaFocusTimeRemaining, setAdaFocusTimeRemaining] = useState<number>(0)
  const [adaFocusIsTesting, setAdaFocusIsTesting] = useState<boolean>(false)
  const adaTargetTimestampRef = useRef<number | null>(null)

  // Obter duração total em segundos para a fase atual do Pomodoro
  const getPhaseDurationSeconds = useCallback(
    (p: FocusPhase, m: FocusMode = settingsRef.current.mode): number => {
      const s = settingsRef.current
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

  // Alerta sonoro e notificação push do browser (para Pomodoro)
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
    const today = getTodayString()

    setTodayStats((prev) => {
      const base = prev.date === today ? prev : { date: today, sessions: 0, focusMinutes: 0 }
      const updated: DailyFocusStats = {
        date: today,
        sessions: base.sessions + 1,
        focusMinutes: base.focusMinutes + minutes,
      }
      saveTodayStats(updated)
      return updated
    })

    setFocusHistory((prev) => {
      const current = prev[today] || { sessions: 0, focusMinutes: 0 }
      const updatedMap: FocusHistoryMap = {
        ...prev,
        [today]: {
          sessions: current.sessions + 1,
          focusMinutes: current.focusMinutes + minutes,
        },
      }
      saveFocusHistory(updatedMap)
      return updatedMap
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

  // Função central: transição de fase quando o tempo chega a zero no Pomodoro
  const handlePhaseComplete = useCallback(() => {
    const s = settingsRef.current
    const currPhase = phaseRef.current
    const currCycle = cycleRef.current

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

  // Compatibilidade legada para switchMode (mantém Pomodoro)
  const switchMode = useCallback(
    (newMode: FocusMode) => {
      updateFocusRadar({ mode: 'pomodoro', enabled: false })
      const p = phase
      setPhase(p)
      phaseRef.current = p
      const dur = getPhaseDurationSeconds(p, 'pomodoro')
      targetTimestampRef.current = null
      pausedRemainingRef.current = dur
      setTimeRemaining(dur)
      saveActiveState({
        targetTimestamp: null,
        pausedRemaining: dur,
        mode: 'pomodoro',
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
    phase,
    focusRadar.mode,
    focusRadar.enabled,
    getPhaseDurationSeconds,
  ])

  // ==========================================
  // MOTOR ADA FOCUS INDEPENDENTE
  // ==========================================
  const adaSettings = focusRadar.adaFocus || {
    enabled: false,
    intervalMinutes: 30,
    message: 'Ainda focado? 👀',
    soundProfile: 'ding',
    autoDismissSeconds: 30,
    onlyDuringFocus: false,
  }

  // Verificar se o Ada Focus deve estar contando/ativo agora
  const isAdaFocusActive = Boolean(
    adaSettings.enabled &&
    (!adaSettings.onlyDuringFocus || (focusRadar.enabled && phase === 'focus')),
  )

  // Disparar o alerta Ada Focus
  const triggerAdaAlert = useCallback(() => {
    const currentAda = settingsRef.current.adaFocus || adaSettings
    // 1. Som selecionado
    playFocusSound(currentAda.soundProfile)

    // 2. Notificação push se permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Ada Focus', {
          body: currentAda.message || 'Ainda focado? 👀',
          icon: '/favicon.ico',
        })
      } catch {
        /* ignore */
      }
    }

    // 3. Abrir pop-up visual
    setAdaFocusIsTesting(false)
    setAdaFocusPopupOpen(true)
    setLastTriggered(new Date())

    // 4. Reiniciar ciclo para a próxima contagem
    const durSec = Math.max(1, currentAda.intervalMinutes) * 60
    adaTargetTimestampRef.current = Date.now() + durSec * 1000
    setAdaFocusTimeRemaining(durSec)
  }, [adaSettings])

  // Fechar pop-up Ada Focus e reiniciar ciclo de intervalo
  const dismissAdaFocusPopup = useCallback(() => {
    setAdaFocusPopupOpen(false)
    setAdaFocusIsTesting(false)
    if (isAdaFocusActive) {
      const currentAda = settingsRef.current.adaFocus || adaSettings
      const durSec = Math.max(1, currentAda.intervalMinutes) * 60
      adaTargetTimestampRef.current = Date.now() + durSec * 1000
      setAdaFocusTimeRemaining(durSec)
    }
  }, [isAdaFocusActive, adaSettings])

  // Botão de preview/teste: toca som e mostra o pop-up por 5s sem reiniciar o ciclo real
  const triggerAdaFocusPreview = useCallback(() => {
    const currentAda = settingsRef.current.adaFocus || adaSettings
    playFocusSound(currentAda.soundProfile)
    setAdaFocusIsTesting(true)
    setAdaFocusPopupOpen(true)
  }, [adaSettings])

  // Heartbeat do Ada Focus baseado em Date.now() com proteção contra rajadas
  useEffect(() => {
    if (!isAdaFocusActive) {
      adaTargetTimestampRef.current = null
      setAdaFocusTimeRemaining(0)
      return
    }

    const durSec = Math.max(1, adaSettings.intervalMinutes) * 60

    // Se o timer ainda não tem alvo definido ou foi desativado anteriormente, inicializa do zero (sem rajadas ao recarregar)
    if (!adaTargetTimestampRef.current) {
      adaTargetTimestampRef.current = Date.now() + durSec * 1000
      setAdaFocusTimeRemaining(durSec)
    }

    const intervalId = window.setInterval(() => {
      if (!adaTargetTimestampRef.current) return
      const now = Date.now()
      const diffSec = Math.round((adaTargetTimestampRef.current - now) / 1000)

      if (diffSec <= 0) {
        // Dispara uma única vez e redefine o ciclo
        triggerAdaAlert()
      } else {
        setAdaFocusTimeRemaining(diffSec)
      }
    }, 1000)

    const handleAdaVisibilityChange = () => {
      if (document.visibilityState === 'visible' && adaTargetTimestampRef.current) {
        const now = Date.now()
        const diffSec = Math.round((adaTargetTimestampRef.current - now) / 1000)
        if (diffSec <= 0) {
          // Voltou de background com tempo já esgotado: dispara uma única vez
          triggerAdaAlert()
        } else {
          setAdaFocusTimeRemaining(diffSec)
        }
      }
    }

    document.addEventListener('visibilitychange', handleAdaVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleAdaVisibilityChange)
    }
  }, [isAdaFocusActive, adaSettings.intervalMinutes, triggerAdaAlert])

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
        focusHistory,
        selectedTaskId,
        setSelectedTaskId,
        taskSessionCounts,

        // Ada Focus
        adaFocus: adaSettings,
        adaFocusActive: isAdaFocusActive,
        adaFocusTimeRemaining,
        adaFocusPopupOpen,
        dismissAdaFocusPopup,
        triggerAdaFocusPreview,
      }}
    >
      {children}
      {/* Pop-up global do Ada Focus (visível em qualquer aba e acima do Estúdio) */}
      <AdaFocusPopup
        open={adaFocusPopupOpen}
        message={adaSettings.message}
        autoDismissSeconds={adaFocusIsTesting ? 5 : adaSettings.autoDismissSeconds}
        onDismiss={dismissAdaFocusPopup}
        isTesting={adaFocusIsTesting}
      />
    </FocusRadarContext.Provider>
  )
}

export function useFocusRadar() {
  const ctx = useContext(FocusRadarContext)
  if (!ctx) throw new Error('useFocusRadar must be used within FocusRadarProvider')
  return ctx
}
