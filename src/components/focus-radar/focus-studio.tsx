import React, { useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  X,
  Volume2,
  Coffee,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusRadar } from '@/components/focus-radar/focus-radar-provider'
import { useAppStore, FocusPhase } from '@/stores/useAppStore'
import { playFocusSound, SoundProfile } from '@/lib/focus-sounds'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FocusStudioProps {
  open: boolean
  onClose: () => void
}

const SOUNDS: { value: SoundProfile; label: string; emoji: string }[] = [
  { value: 'ding', label: 'Ding', emoji: '🔔' },
  { value: 'pop', label: 'Pop', emoji: '💥' },
  { value: 'tibetan', label: 'Sino Tibetano', emoji: '🪷' },
]

const RADAR_INTERVALS = [15, 30, 45, 60]
const FOCUS_PRESETS = [15, 25, 30, 50]
const SHORT_BREAK_PRESETS = [3, 5, 10]
const LONG_BREAK_PRESETS = [10, 15, 30]

export function FocusStudio({ open, onClose }: FocusStudioProps) {
  const {
    isRunning,
    timeRemaining,
    totalDuration,
    phase,
    mode,
    currentCycle,
    totalCycles,
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
  } = useFocusRadar()

  const { focusRadar, updateFocusRadar, tasks } = useAppStore()

  // Tabs de visualização dentro do estúdio: 'timer' ou 'settings'
  const [activeTab, setActiveTab] = useState<'timer' | 'settings'>('timer')

  // Inputs controlados para digitação livre (validação 1..180 inteiros)
  const [customFocus, setCustomFocus] = useState<string>('')
  const [customShort, setCustomShort] = useState<string>('')
  const [customLong, setCustomLong] = useState<string>('')
  const [customRadarInterval, setCustomRadarInterval] = useState<string>('')

  if (!open) return null

  // Filtro de tarefas pendentes para vincular à sessão
  const pendingTasks = tasks.filter((t) => !t.completed)
  const currentSelectedTask = tasks.find((t) => t.id === selectedTaskId)
  const currentTaskSessions = selectedTaskId ? taskSessionCounts[selectedTaskId] || 0 : 0

  // Formatação de mm:ss
  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Progresso do anel circular (0% a 100%)
  const progressPercent =
    totalDuration > 0
      ? Math.min(100, Math.max(0, ((totalDuration - timeRemaining) / totalDuration) * 100))
      : 0

  // Cores dinâmicas por fase
  const getPhaseTheme = () => {
    if (mode === 'radar') {
      return {
        name: 'Radar Periódico',
        color: '#58CC02',
        borderClass: 'border-[#46A302]',
        bgClass: 'bg-[#58CC02]',
        textClass: 'text-[#58CC02]',
        bgSoftClass: 'bg-[#58CC02]/10',
        strokeColor: '#58CC02',
        lightBg: 'bg-emerald-50 dark:bg-emerald-950/20',
      }
    }
    if (phase === 'short') {
      return {
        name: 'Pausa Curta',
        color: '#1CB0F6',
        borderClass: 'border-[#1899D6]',
        bgClass: 'bg-[#1CB0F6]',
        textClass: 'text-[#1CB0F6]',
        bgSoftClass: 'bg-[#1CB0F6]/10',
        strokeColor: '#1CB0F6',
        lightBg: 'bg-sky-50 dark:bg-sky-950/20',
      }
    }
    if (phase === 'long') {
      return {
        name: 'Pausa Longa',
        color: '#FFC800',
        borderClass: 'border-[#E5B400]',
        bgClass: 'bg-[#FFC800]',
        textClass: 'text-[#FFC800]',
        bgSoftClass: 'bg-[#FFC800]/10',
        strokeColor: '#FFC800',
        lightBg: 'bg-amber-50 dark:bg-amber-950/20',
      }
    }
    return {
      name: 'Foco Total',
      color: '#58CC02',
      borderClass: 'border-[#46A302]',
      bgClass: 'bg-[#58CC02]',
      textClass: 'text-[#58CC02]',
      bgSoftClass: 'bg-[#58CC02]/10',
      strokeColor: '#58CC02',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/20',
    }
  }

  const phaseTheme = getPhaseTheme()

  // Handler para preset de digitação livre com validação (1 - 180 min inteiros)
  const handleApplyDuration = (
    key: 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'interval',
    rawVal: string,
  ) => {
    const num = Math.round(Number(rawVal))
    if (!isNaN(num) && num >= 1 && num <= 180) {
      updateFocusRadar({ [key]: num })
    }
  }

  // Preset Pomodoro clássico de um toque: 25 / 5 / 15 com 4 ciclos
  const applyClassicPomodoro = () => {
    updateFocusRadar({
      mode: 'pomodoro',
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      cyclesBeforeLongBreak: 4,
    })
    setCustomFocus('')
    setCustomShort('')
    setCustomLong('')
  }

  // Raio do círculo SVG do timer
  const circleRadius = 126
  const circleCircumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circleCircumference - (progressPercent / 100) * circleCircumference

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-studio-title"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header Duolingo */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b-2 border-border px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-sm',
              phaseTheme.bgClass,
            )}
          >
            {mode === 'radar' ? (
              <Radio className="w-5 h-5 animate-pulse" />
            ) : phase === 'focus' ? (
              <Clock className="w-5 h-5" />
            ) : (
              <Coffee className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1
              id="focus-studio-title"
              className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight"
            >
              Estúdio de Foco
            </h1>
            <p className="text-xs font-bold text-muted-foreground">
              {mode === 'radar' ? 'Radar Periódico Ativo' : 'Gerenciador de Produtividade Humana'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador entre Timer e Ajustes */}
          <div className="flex bg-muted/60 p-1 rounded-2xl border-2 border-border">
            <button
              onClick={() => setActiveTab('timer')}
              className={cn(
                'px-3 py-1.5 rounded-xl font-bold text-xs transition-all',
                activeTab === 'timer'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Timer
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                'px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all',
                activeTab === 'settings'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustes</span>
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar Estúdio de Foco"
            className="w-10 h-10 rounded-2xl border-2 border-border border-b-4 hover:bg-muted active:border-b-0 active:translate-y-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 flex flex-col justify-between">
        {activeTab === 'timer' ? (
          <div className="space-y-6 flex flex-col items-center">
            {/* Segmented Control de Modos (Foco · Pausa Curta · Pausa Longa) no Pomodoro */}
            {mode === 'pomodoro' ? (
              <div className="w-full flex p-1 bg-muted/60 rounded-3xl border-2 border-border max-w-md">
                {(['focus', 'short', 'long'] as FocusPhase[]).map((p) => {
                  const isActive = phase === p
                  const label =
                    p === 'focus' ? 'Foco' : p === 'short' ? 'Pausa Curta' : 'Pausa Longa'
                  const minutes =
                    p === 'focus'
                      ? focusRadar.focusMinutes
                      : p === 'short'
                        ? focusRadar.shortBreakMinutes
                        : focusRadar.longBreakMinutes

                  return (
                    <button
                      key={p}
                      onClick={() => switchPhase(p)}
                      className={cn(
                        'flex-1 py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all text-center',
                        isActive
                          ? p === 'focus'
                            ? 'bg-[#58CC02] text-white shadow-md'
                            : p === 'short'
                              ? 'bg-[#1CB0F6] text-white shadow-md'
                              : 'bg-[#FFC800] text-black shadow-md'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div>{label}</div>
                      <div className="text-[10px] font-semibold opacity-80">{minutes}m</div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="w-full p-3 rounded-2xl bg-[#58CC02]/10 border-2 border-[#58CC02]/30 flex items-center justify-between max-w-md">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#58CC02] animate-pulse" />
                  <span className="text-xs font-bold text-[#58CC02]">
                    Modo Radar: Alerta a cada {focusRadar.interval} min
                  </span>
                </div>
                <button
                  onClick={() => switchMode('pomodoro')}
                  className="text-xs font-extrabold text-[#1CB0F6] underline"
                >
                  Usar Pomodoro
                </button>
              </div>
            )}

            {/* Contador de Ciclos (no modo pomodoro) */}
            {mode === 'pomodoro' && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-xs sm:text-sm font-extrabold">
                  <span>🍅</span>
                  <span>
                    Ciclo {currentCycle} de {totalCycles}
                  </span>
                </div>

                {/* Pontinhos indicando progresso dos ciclos */}
                <div className="flex items-center gap-2 pt-1">
                  {Array.from({ length: totalCycles }).map((_, idx) => {
                    const isDone = idx + 1 < currentCycle
                    const isCurrent = idx + 1 === currentCycle
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'w-3.5 h-3.5 rounded-full transition-all border-2',
                          isDone
                            ? 'bg-[#58CC02] border-[#46A302]'
                            : isCurrent
                              ? 'bg-[#58CC02]/30 border-[#58CC02] scale-125'
                              : 'bg-muted border-border',
                        )}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Vínculo com Tarefas (Select discreto opcional) */}
            <div className="w-full max-w-md bg-card/80 border-2 border-border rounded-2xl p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="focus-task-select"
                  className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#58CC02]" />
                  <span>Focando em:</span>
                </label>
                {currentSelectedTask && (
                  <span className="text-[11px] font-extrabold text-[#58CC02] bg-[#58CC02]/10 px-2 py-0.5 rounded-md">
                    🍅 {currentTaskSessions} {currentTaskSessions === 1 ? 'sessão' : 'sessões'}
                  </span>
                )}
              </div>
              <select
                id="focus-task-select"
                aria-label="Selecionar tarefa para a sessão de foco"
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value ? e.target.value : null)}
                className="w-full bg-muted/60 text-foreground font-semibold text-xs sm:text-sm rounded-xl p-2 border border-border focus:outline-none focus:ring-2 focus:ring-[#58CC02]"
              >
                <option value="">(Nenhuma tarefa selecionada — foco livre)</option>
                {pendingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Timer Central Grande (Círculo SVG Duolingo) */}
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90">
                {/* Trilho cinza */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  className="stroke-muted"
                  strokeWidth="14"
                  fill="transparent"
                />
                {/* Anel de progresso com cor da fase */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  stroke={phaseTheme.strokeColor}
                  strokeWidth="14"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-linear"
                />
              </svg>

              {/* Miolo com mm:ss em fonte extra-bold */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums font-mono drop-shadow-sm">
                  {formatTime(timeRemaining)}
                </span>
                <span
                  className={cn(
                    'mt-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider',
                    phaseTheme.bgSoftClass,
                    phaseTheme.textClass,
                  )}
                >
                  {phaseTheme.name}
                </span>

                {!isRunning && (
                  <span className="text-[11px] font-bold text-muted-foreground mt-1">
                    Pausado — toque para continuar
                  </span>
                )}
              </div>
            </div>

            {/* Botões de Ação 3D Duolingo (Iniciar/Pausar + Reiniciar + Pular) */}
            <div className="flex items-center gap-3 w-full max-w-sm">
              {/* Botão Reiniciar */}
              <button
                onClick={reset}
                title="Reiniciar timer"
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-border border-b-4 bg-card hover:bg-muted text-muted-foreground hover:text-foreground active:translate-y-1 active:border-b-0 transition-all font-bold"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Botão Central Principal Iniciar / Pausar */}
              <button
                onClick={isRunning ? pause : start}
                className={cn(
                  'flex-1 py-3.5 sm:py-4 px-6 rounded-2xl border-2 font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg transition-all active:translate-y-1 active:border-b-0',
                  isRunning
                    ? 'bg-[#FFC800] border-[#E5B400] border-b-4 text-black hover:brightness-105'
                    : 'bg-[#58CC02] border-[#46A302] border-b-4 text-white hover:brightness-105',
                )}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-6 h-6 fill-current" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>Iniciar</span>
                  </>
                )}
              </button>

              {/* Botão Pular Fase */}
              {mode === 'pomodoro' && (
                <button
                  onClick={skipPhase}
                  title="Pular para a próxima fase"
                  className="p-3.5 sm:p-4 rounded-2xl border-2 border-border border-b-4 bg-card hover:bg-muted text-muted-foreground hover:text-foreground active:translate-y-1 active:border-b-0 transition-all font-bold"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Mensagem atual / Notificação e Estatísticas do Dia */}
            <div className="w-full max-w-md space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Mensagem de Foco
                  </p>
                  <p className="text-xs sm:text-sm font-semibold truncate max-w-[240px]">
                    "{focusRadar.message}"
                  </p>
                </div>
                {lastTriggered && (
                  <span className="text-[10px] text-muted-foreground font-bold">
                    Último:{' '}
                    {lastTriggered.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Estatísticas do dia (total minutos focados) */}
              <div className="p-4 rounded-3xl bg-card border-2 border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/10 flex items-center justify-center text-[#58CC02]">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">Minutos focados hoje</p>
                    <p className="text-xl font-black text-foreground">
                      {todayStats.focusMinutes} min
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground">Sessões concluídas</p>
                  <p className="text-xl font-black text-[#58CC02]">{todayStats.sessions} 🍅</p>
                </div>
              </div>

              {todayStats.sessions === 0 && (
                <p className="text-center text-xs font-semibold text-muted-foreground">
                  Nenhuma sessão concluída ainda hoje. Inicie um ciclo e ganhe foco absoluto! 🚀
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Aba de Ajustes / Configuração completa */
          <div className="space-y-6 max-w-lg mx-auto w-full pb-6">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#1CB0F6]" />
                <h2 className="text-lg font-black">Ajustes de Produtividade</h2>
              </div>
              <button
                onClick={applyClassicPomodoro}
                className="px-3 py-1.5 rounded-xl bg-[#1CB0F6]/10 text-[#1CB0F6] border-2 border-[#1CB0F6]/30 font-bold text-xs hover:bg-[#1CB0F6]/20 transition-all active:scale-95"
              >
                Pomodoro Clássico (25/5/15)
              </button>
            </div>

            {/* Alternar Modo Radar vs Pomodoro */}
            <div className="p-4 rounded-2xl bg-muted/40 border-2 border-border flex items-center justify-between gap-4">
              <div>
                <Label className="font-extrabold text-sm block">
                  Modo Radar (lembrete periódico simples)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Dispara um alerta sonoro repetido a cada X minutos sem fases de descanso.
                </p>
              </div>
              <Switch
                checked={focusRadar.mode === 'radar'}
                onCheckedChange={(checked) => switchMode(checked ? 'radar' : 'pomodoro')}
              />
            </div>

            {focusRadar.mode === 'radar' ? (
              /* Configurações exclusivas do Modo Radar Legado */
              <div className="space-y-4 p-4 rounded-3xl bg-card border-2 border-border">
                <Label className="font-extrabold text-sm">Intervalo do Radar (minutos)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {RADAR_INTERVALS.map((min) => (
                    <button
                      key={min}
                      onClick={() => updateFocusRadar({ interval: min })}
                      className={cn(
                        'py-2.5 rounded-2xl font-black text-xs border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                        focusRadar.interval === min
                          ? 'bg-[#58CC02] border-[#46A302] text-white'
                          : 'bg-muted/60 border-border text-foreground hover:bg-muted',
                      )}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    placeholder="Outro (1-180 min)"
                    value={customRadarInterval}
                    onChange={(e) => setCustomRadarInterval(e.target.value)}
                    className="rounded-2xl bg-muted/50 font-bold text-xs"
                  />
                  <button
                    onClick={() => {
                      handleApplyDuration('interval', customRadarInterval)
                      setCustomRadarInterval('')
                    }}
                    disabled={!customRadarInterval}
                    className="px-4 py-2 rounded-2xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 text-white font-black text-xs disabled:opacity-50 active:translate-y-1 active:border-b-0"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              /* Configurações Pomodoro: Durações de Foco, Pausa Curta, Pausa Longa e Ciclos */
              <div className="space-y-5">
                {/* 1. Duração do Foco */}
                <div className="p-4 rounded-3xl bg-card border-2 border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-extrabold text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#58CC02]" />
                      Duração do Foco:{' '}
                      <span className="text-[#58CC02]">{focusRadar.focusMinutes} min</span>
                    </Label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {FOCUS_PRESETS.map((m) => (
                      <button
                        key={m}
                        onClick={() => updateFocusRadar({ focusMinutes: m })}
                        className={cn(
                          'py-2 rounded-2xl font-black text-xs border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                          focusRadar.focusMinutes === m
                            ? 'bg-[#58CC02] border-[#46A302] text-white'
                            : 'bg-muted/60 border-border text-foreground hover:bg-muted',
                        )}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      placeholder="Personalizado (1-180 min)"
                      value={customFocus}
                      onChange={(e) => setCustomFocus(e.target.value)}
                      className="rounded-2xl bg-muted/50 font-bold text-xs"
                    />
                    <button
                      onClick={() => {
                        handleApplyDuration('focusMinutes', customFocus)
                        setCustomFocus('')
                      }}
                      disabled={!customFocus}
                      className="px-4 py-2 rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 text-white font-black text-xs disabled:opacity-50 active:translate-y-1 active:border-b-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Duração da Pausa Curta */}
                <div className="p-4 rounded-3xl bg-card border-2 border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-extrabold text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1CB0F6]" />
                      Pausa Curta:{' '}
                      <span className="text-[#1CB0F6]">{focusRadar.shortBreakMinutes} min</span>
                    </Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SHORT_BREAK_PRESETS.map((m) => (
                      <button
                        key={m}
                        onClick={() => updateFocusRadar({ shortBreakMinutes: m })}
                        className={cn(
                          'py-2 rounded-2xl font-black text-xs border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                          focusRadar.shortBreakMinutes === m
                            ? 'bg-[#1CB0F6] border-[#1899D6] text-white'
                            : 'bg-muted/60 border-border text-foreground hover:bg-muted',
                        )}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      placeholder="Personalizado (1-180 min)"
                      value={customShort}
                      onChange={(e) => setCustomShort(e.target.value)}
                      className="rounded-2xl bg-muted/50 font-bold text-xs"
                    />
                    <button
                      onClick={() => {
                        handleApplyDuration('shortBreakMinutes', customShort)
                        setCustomShort('')
                      }}
                      disabled={!customShort}
                      className="px-4 py-2 rounded-2xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 text-white font-black text-xs disabled:opacity-50 active:translate-y-1 active:border-b-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3. Duração da Pausa Longa */}
                <div className="p-4 rounded-3xl bg-card border-2 border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-extrabold text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFC800]" />
                      Pausa Longa:{' '}
                      <span className="text-[#FFC800]">{focusRadar.longBreakMinutes} min</span>
                    </Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {LONG_BREAK_PRESETS.map((m) => (
                      <button
                        key={m}
                        onClick={() => updateFocusRadar({ longBreakMinutes: m })}
                        className={cn(
                          'py-2 rounded-2xl font-black text-xs border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                          focusRadar.longBreakMinutes === m
                            ? 'bg-[#FFC800] border-[#E5B400] text-black'
                            : 'bg-muted/60 border-border text-foreground hover:bg-muted',
                        )}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      placeholder="Personalizado (1-180 min)"
                      value={customLong}
                      onChange={(e) => setCustomLong(e.target.value)}
                      className="rounded-2xl bg-muted/50 font-bold text-xs"
                    />
                    <button
                      onClick={() => {
                        handleApplyDuration('longBreakMinutes', customLong)
                        setCustomLong('')
                      }}
                      disabled={!customLong}
                      className="px-4 py-2 rounded-2xl bg-[#FFC800] border-2 border-[#E5B400] border-b-4 text-black font-black text-xs disabled:opacity-50 active:translate-y-1 active:border-b-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4. Ciclos antes da pausa longa (Stepper 2-8) */}
                <div className="p-4 rounded-3xl bg-card border-2 border-border flex items-center justify-between">
                  <div>
                    <Label className="font-extrabold text-sm">Ciclos antes da pausa longa</Label>
                    <p className="text-xs text-muted-foreground">
                      Padrão 4 ciclos (2–8 configuráveis)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateFocusRadar({
                          cyclesBeforeLongBreak: Math.max(2, focusRadar.cyclesBeforeLongBreak - 1),
                        })
                      }
                      className="w-9 h-9 rounded-xl border-2 border-border border-b-4 bg-muted font-black text-lg flex items-center justify-center active:translate-y-1 active:border-b-0"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black text-lg tabular-nums">
                      {focusRadar.cyclesBeforeLongBreak}
                    </span>
                    <button
                      onClick={() =>
                        updateFocusRadar({
                          cyclesBeforeLongBreak: Math.min(8, focusRadar.cyclesBeforeLongBreak + 1),
                        })
                      }
                      className="w-9 h-9 rounded-xl border-2 border-border border-b-4 bg-muted font-black text-lg flex items-center justify-center active:translate-y-1 active:border-b-0"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 5. Autoplay Switch */}
                <div className="p-4 rounded-3xl bg-card border-2 border-border flex items-center justify-between gap-4">
                  <div>
                    <Label className="font-extrabold text-sm block">
                      Iniciar próximo ciclo automaticamente
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Avança automaticamente para pausas e novos ciclos sem precisar tocar no botão.
                    </p>
                  </div>
                  <Switch
                    checked={focusRadar.autoStartNext}
                    onCheckedChange={(val) => updateFocusRadar({ autoStartNext: val })}
                  />
                </div>
              </div>
            )}

            {/* Mensagem customizada e Som de Alerta (Preservados e retrocompatíveis) */}
            <div className="space-y-4 p-4 rounded-3xl bg-card border-2 border-border">
              <div className="space-y-1.5">
                <Label className="font-extrabold text-sm">Mensagem de Notificação</Label>
                <Input
                  value={focusRadar.message}
                  onChange={(e) => updateFocusRadar({ message: e.target.value })}
                  placeholder="Ex: Ainda focado? 👀"
                  className="rounded-2xl bg-muted/50 font-semibold"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="font-extrabold text-sm">Som de Alerta</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SOUNDS.map((sound) => (
                    <button
                      key={sound.value}
                      onClick={() => {
                        updateFocusRadar({ soundProfile: sound.value })
                        playFocusSound(sound.value)
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                        focusRadar.soundProfile === sound.value
                          ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-foreground'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <span className="text-2xl">{sound.emoji}</span>
                      <span className="text-xs font-bold">{sound.label}</span>
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('timer')}
                className="w-full py-3.5 rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 text-white font-black text-sm active:translate-y-1 active:border-b-0 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Salvar e Voltar ao Timer</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
