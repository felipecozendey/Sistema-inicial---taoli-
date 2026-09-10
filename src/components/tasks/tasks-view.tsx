import { useMemo, useState, useEffect } from 'react'
import { Task, useAppStore } from '@/stores/useAppStore'
import { useTaskSettingsStore } from '@/stores/useTaskSettingsStore'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskDateFilter, TimeFilterMode } from '@/components/tasks/task-date-filter'
import { cn } from '@/lib/utils'
import {
  ListTodo,
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  Hourglass,
  AlertTriangle,
} from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay,
  isPast,
  isToday as isDateToday,
  format,
  addDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TasksViewProps {
  selectedTags: string[]
  nearDeadlineOnly: boolean
}

// Utilitário seguro para parsing de string de data 'YYYY-MM-DD'
function parseSafeDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null
  const isoStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return null
  return d
}

// Formatação amigável para cabeçalho de agrupamento
function formatGroupHeader(dateKey: string): { title: string; subtitle: string; isToday: boolean } {
  const d = parseSafeDate(dateKey)
  if (!d) return { title: 'Sem data definida', subtitle: '', isToday: false }

  const today = new Date()
  const isCurrentDay = isSameDay(d, today)

  const capitalizedDayOfWeek = format(d, 'EEEE', { locale: ptBR })
  const formattedDay = capitalizedDayOfWeek.charAt(0).toUpperCase() + capitalizedDayOfWeek.slice(1)
  const fullDate = format(d, "dd 'de' MMMM", { locale: ptBR })

  return {
    title: isCurrentDay ? `Hoje, ${format(d, 'dd/MM')}` : `${formattedDay}, ${format(d, 'dd/MM')}`,
    subtitle: fullDate,
    isToday: isCurrentDay,
  }
}

export function TasksView({ selectedTags, nearDeadlineOnly }: TasksViewProps) {
  const { tasks } = useAppStore()
  const { settings, fetchSettings } = useTaskSettingsStore()
  const [filterMode, setFilterMode] = useState<TimeFilterMode>('today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Dias da semana atual (Seg a Dom)
  const today = useMemo(() => new Date(), [])
  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today])
  const weekEnd = useMemo(() => endOfWeek(today, { weekStartsOn: 1 }), [today])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      return {
        date,
        dateStr,
        dayName: format(date, 'EEE', { locale: ptBR }),
        dayNumber: format(date, 'd'),
        fullLabel: format(date, 'EEE, d/MM', { locale: ptBR }),
        isToday: isSameDay(date, today),
      }
    })
  }, [weekStart, today])

  // Dia selecionado nas abas da semana (padrão é hoje se cair na semana atual, senão primeiro dia da semana)
  const initialSelectedDay = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd')
    const hasToday = weekDays.some((d) => d.dateStr === todayStr)
    return hasToday ? todayStr : weekDays[0]?.dateStr || ''
  }, [today, weekDays])

  const [selectedWeekDay, setSelectedWeekDay] = useState<string>(initialSelectedDay)

  // 1. Filtragem Zero Lag com useMemo
  const filteredTasks = useMemo(() => {
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    const list = tasks.filter((t) => {
      // Filtro de Tags
      const taskTagIds = t.tagIds || (t.tagId ? [t.tagId] : [])
      const matchesTag =
        selectedTags.length === 0 || taskTagIds.some((id) => selectedTags.includes(id))
      if (!matchesTag) return false

      // Filtro de Prazo Próximo (< 24h)
      if (nearDeadlineOnly) {
        if (t.completed) return false
        const due = parseSafeDate(t.dueDate)
        if (!due) return false
        due.setHours(23, 59, 59, 999)
        const diff = due.getTime() - Date.now()
        if (diff <= 0 || diff >= 24 * 60 * 60 * 1000) return false
      }

      // Modos especiais "Agendado para" e "Prazo limite"
      if (filterMode === 'scheduled') {
        const scheduled = parseSafeDate(t.scheduledDate || t.dueDate)
        return scheduled !== null
      }

      if (filterMode === 'deadline') {
        const due = parseSafeDate(t.dueDate)
        return due !== null
      }

      // Filtro de Tempo padrão (hoje, week, month, custom)
      const taskDate = parseSafeDate(t.dueDate)
      if (!taskDate) return false

      if (filterMode === 'today') {
        return isSameDay(taskDate, today)
      }

      if (filterMode === 'week') {
        return isWithinInterval(taskDate, { start: weekStart, end: weekEnd })
      }

      if (filterMode === 'month') {
        return isWithinInterval(taskDate, { start: monthStart, end: monthEnd })
      }

      if (filterMode === 'custom') {
        if (!customRange?.from) return true
        if (!customRange.to) {
          return isSameDay(taskDate, customRange.from)
        }
        const from = new Date(customRange.from)
        from.setHours(0, 0, 0, 0)
        const to = new Date(customRange.to)
        to.setHours(23, 59, 59, 999)
        return taskDate >= from && taskDate <= to
      }

      return true
    })

    // Ordenação específica para scheduled e deadline
    if (filterMode === 'scheduled') {
      return [...list].sort((a, b) => {
        const dateA = parseSafeDate(a.scheduledDate || a.dueDate)
        const dateB = parseSafeDate(b.scheduledDate || b.dueDate)
        if (!dateA && !dateB) return 0
        if (!dateA) return 1
        if (!dateB) return -1
        return dateA.getTime() - dateB.getTime()
      })
    }

    if (filterMode === 'deadline') {
      return [...list].sort((a, b) => {
        // Tarefas não concluídas primeiro, depois ordenadas por proximidade da dueDate
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1
        }
        const dateA = parseSafeDate(a.dueDate)
        const dateB = parseSafeDate(b.dueDate)
        if (!dateA && !dateB) return 0
        if (!dateA) return 1
        if (!dateB) return -1
        return dateA.getTime() - dateB.getTime()
      })
    }

    return list
  }, [tasks, selectedTags, nearDeadlineOnly, filterMode, customRange, today, weekStart, weekEnd])

  // Contagem de tarefas para cada dia da semana (respeitando tags e filtro de prazo se ativos)
  const weekDayTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    weekDays.forEach((d) => {
      counts[d.dateStr] = 0
    })

    tasks.forEach((t) => {
      const taskTagIds = t.tagIds || (t.tagId ? [t.tagId] : [])
      const matchesTag =
        selectedTags.length === 0 || taskTagIds.some((id) => selectedTags.includes(id))
      if (!matchesTag) return

      if (nearDeadlineOnly) {
        if (t.completed) return
        const due = parseSafeDate(t.dueDate)
        if (!due) return
        due.setHours(23, 59, 59, 999)
        const diff = due.getTime() - Date.now()
        if (diff <= 0 || diff >= 24 * 60 * 60 * 1000) return
      }

      const d = parseSafeDate(t.dueDate)
      if (!d) return
      const dateKey = format(d, 'yyyy-MM-dd')
      if (counts[dateKey] !== undefined) {
        counts[dateKey]++
      }
    })

    return counts
  }, [tasks, weekDays, selectedTags, nearDeadlineOnly])

  // Tarefas da semana filtradas pelo dia selecionado (quando em modo abas de semana)
  const weekSelectedDayTasks = useMemo(() => {
    if (filterMode !== 'week') return []
    return filteredTasks.filter((t) => {
      const d = parseSafeDate(t.dueDate)
      if (!d) return false
      return format(d, 'yyyy-MM-dd') === selectedWeekDay
    })
  }, [filteredTasks, filterMode, selectedWeekDay])

  // 2. Agrupamento de tarefas por data quando em Semana empilhada, Mês ou Período Personalizado
  const groupedTasks = useMemo(() => {
    if (filterMode === 'today' || filterMode === 'scheduled' || filterMode === 'deadline') {
      return null
    }

    const groups: Record<string, Task[]> = {}
    for (const task of filteredTasks) {
      const key = task.dueDate || 'sem-data'
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    }

    // Ordenar as chaves de data cronologicamente
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const dateA = parseSafeDate(a)
      const dateB = parseSafeDate(b)
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1
      return dateA.getTime() - dateB.getTime()
    })

    return sortedKeys.map((key) => ({
      dateKey: key,
      tasks: groups[key],
    }))
  }, [filteredTasks, filterMode])

  // Status visual para itens do filtro "Prazo limite"
  const getDeadlineBadge = (dueDateStr: string | undefined, completed: boolean) => {
    if (completed) {
      return {
        label: 'Concluída',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: null,
      }
    }
    const d = parseSafeDate(dueDateStr)
    if (!d) return null

    if (isDateToday(d)) {
      return {
        label: 'Vence hoje',
        className:
          'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-black',
        icon: AlertTriangle,
      }
    }

    const endOfDueDate = new Date(d)
    endOfDueDate.setHours(23, 59, 59, 999)
    if (isPast(endOfDueDate)) {
      return {
        label: 'Vencida',
        className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 font-black',
        icon: AlertTriangle,
      }
    }

    return {
      label: `Vence ${format(d, "dd 'de' MMM", { locale: ptBR })}`,
      className: 'bg-muted text-muted-foreground border-border/50 font-bold',
      icon: Hourglass,
    }
  }

  // Contadores para o resumo do topo
  const completedCount = filteredTasks.filter((t) => t.completed).length
  const totalCount = filteredTasks.length

  const showWeekTabs = settings.show_week_day_tabs ?? true

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Datas com Duolingo 3D Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h3 className="font-extrabold text-base tracking-tight">Filtro Temporal</h3>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            {filterMode === 'today' && 'Exibindo tarefas agendadas para o dia de hoje'}
            {filterMode === 'week' &&
              (showWeekTabs
                ? 'Navegue pelos dias da semana pelas abas'
                : 'Tarefas da semana atual agrupadas dia a dia')}
            {filterMode === 'month' && 'Visão consolidada do mês atual por data'}
            {filterMode === 'scheduled' &&
              'Tarefas com data agendada, da mais próxima à mais distante'}
            {filterMode === 'deadline' && 'Tarefas com prazo limite com destaque de vencimento'}
            {filterMode === 'custom' && 'Período customizado selecionado no calendário'}
          </p>
        </div>

        <TaskDateFilter
          mode={filterMode}
          onModeChange={setFilterMode}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* Resumo de Conclusão estilo Duolingo */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#58CC02]/10 border-2 border-[#58CC02]/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#58CC02]" />
            <span className="text-xs sm:text-sm font-extrabold text-[#58CC02]">
              {completedCount === totalCount
                ? 'Todas as tarefas concluídas! Parabéns! 🎉'
                : `${completedCount} de ${totalCount} tarefas concluídas no período`}
            </span>
          </div>
          <span className="text-xs font-black text-[#58CC02]">
            {Math.round((completedCount / totalCount) * 100)}%
          </span>
        </div>
      )}

      {/* Modo Especial "Esta semana" com Abas por Dia (desktop lateral / mobile topo) */}
      {filterMode === 'week' && showWeekTabs ? (
        <div className="space-y-4">
          {/* Mobile: Barra de abas rolável horizontal */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {weekDays.map((d) => {
              const count = weekDayTaskCounts[d.dateStr] || 0
              const isSelected = selectedWeekDay === d.dateStr
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedWeekDay(d.dateStr)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded-2xl border-2 transition-all select-none',
                    isSelected
                      ? 'bg-[#58CC02] text-white border-b-4 border-[#46A302] shadow-sm'
                      : 'bg-card text-muted-foreground border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#58CC02]/50 hover:text-foreground',
                  )}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {d.dayName}
                  </span>
                  <span className="text-lg font-black">{d.dayNumber}</span>
                  <span
                    className={cn(
                      'text-[10px] font-extrabold px-1.5 py-0.2 rounded-full mt-0.5',
                      isSelected
                        ? 'bg-white/25 text-white'
                        : count > 0
                          ? 'bg-[#58CC02]/15 text-[#58CC02] dark:text-[#58CC02]'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Desktop & Conteúdo com layout de coluna lateral */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Coluna lateral esquerda no Desktop (7 dias da semana) */}
            <div className="hidden md:flex md:col-span-4 lg:col-span-3 flex-col gap-2 p-2 rounded-3xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Dias da semana
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {weekDays.map((d) => {
                  const count = weekDayTaskCounts[d.dateStr] || 0
                  const isSelected = selectedWeekDay === d.dateStr
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedWeekDay(d.dateStr)}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 text-left transition-all duration-150 select-none',
                        isSelected
                          ? 'bg-[#58CC02] text-white border-b-4 border-[#46A302] shadow-sm active:translate-y-0.5 active:border-b-2'
                          : 'bg-card text-foreground border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#58CC02]/50 hover:bg-muted/40 active:translate-y-0.5 active:border-b-2',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-xl flex flex-col items-center justify-center font-black text-xs leading-none border',
                            isSelected
                              ? 'bg-white/20 border-white/30 text-white'
                              : d.isToday
                                ? 'bg-[#58CC02]/15 border-[#58CC02]/30 text-[#58CC02]'
                                : 'bg-muted border-border/50 text-muted-foreground',
                          )}
                        >
                          <span className="text-[9px] uppercase font-bold">{d.dayName}</span>
                          <span className="text-xs font-extrabold">{d.dayNumber}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold capitalize">
                            {format(d.date, 'EEEE', { locale: ptBR })}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-semibold',
                              isSelected ? 'text-white/80' : 'text-muted-foreground',
                            )}
                          >
                            {format(d.date, "d 'de' MMMM", { locale: ptBR })}
                            {d.isToday && ' • Hoje'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-black px-2 py-0.5 rounded-full',
                          isSelected
                            ? 'bg-white/25 text-white'
                            : count > 0
                              ? 'bg-[#58CC02]/15 text-[#58CC02]'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Painel de Tarefas do dia selecionado */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-border/60">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-2xl bg-[#58CC02] text-white border-b-2 border-[#46A302] font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{formatGroupHeader(selectedWeekDay).title}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {weekSelectedDayTasks.length}{' '}
                    {weekSelectedDayTasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>
              </div>

              {weekSelectedDayTasks.length === 0 ? (
                <div className="text-center p-8 bg-card rounded-3xl border-2 border-b-4 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] space-y-3 animate-fade-in">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#58CC02]/10 flex items-center justify-center">
                    <ListTodo className="w-6 h-6 text-[#58CC02]" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-base font-extrabold">Sem tarefas para este dia</h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      Nenhuma pendência agendada para{' '}
                      {formatGroupHeader(selectedWeekDay).subtitle || 'esta data'}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {weekSelectedDayTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Estado Vazio Geral */
        <div className="text-center p-10 bg-card rounded-3xl border-2 border-b-4 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1CB0F6]/10 flex items-center justify-center">
            <ListTodo className="w-8 h-8 text-[#1CB0F6]" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-extrabold">Nenhuma tarefa encontrada</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
              {filterMode === 'today' &&
                'Nenhuma tarefa agendada para hoje. Aproveite o dia ou crie uma nova tarefa!'}
              {filterMode === 'scheduled' && 'Não há tarefas agendadas no momento.'}
              {filterMode === 'deadline' && 'Não há tarefas com prazo limite definido.'}
              {filterMode !== 'today' &&
                filterMode !== 'scheduled' &&
                filterMode !== 'deadline' &&
                'Não há tarefas cadastradas para o período ou filtros selecionados.'}
            </p>
          </div>
        </div>
      ) : filterMode === 'today' ? (
        /* Renderização linear para Hoje */
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : filterMode === 'scheduled' || filterMode === 'deadline' ? (
        /* Renderização ordenada para Agendado para ou Prazo limite */
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const badge =
              filterMode === 'deadline' ? getDeadlineBadge(task.dueDate, task.completed) : null
            const BadgeIcon = badge?.icon

            return (
              <div key={task.id} className="relative">
                {badge && (
                  <div className="absolute top-2 right-14 z-10 hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] shadow-xs pointer-events-none bg-background/90 backdrop-blur-xs">
                    {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                    <span className={badge.className}>{badge.label}</span>
                  </div>
                )}
                <TaskCard task={task} />
              </div>
            )
          })}
        </div>
      ) : (
        /* Renderização agrupada por data para Semana (empilhada se toggle off), Mês ou Período */
        <div className="space-y-8">
          {groupedTasks?.map(({ dateKey, tasks: dateTasks }) => {
            const headerInfo = formatGroupHeader(dateKey)
            return (
              <div key={dateKey} className="space-y-3">
                {/* Cabeçalho do Grupo de Data */}
                <div className="flex items-center gap-3 pb-1 border-b-2 border-border/60">
                  <div
                    className={cn(
                      'px-3 py-1 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border-b-2',
                      headerInfo.isToday
                        ? 'bg-[#58CC02] text-white border-[#46A302]'
                        : 'bg-card text-foreground border-[#E5E5E5] dark:border-[#3B4A55]',
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{headerInfo.title}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {dateTasks.length} {dateTasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>

                {/* Cards das Tarefas do Dia */}
                <div className="space-y-3 pl-1">
                  {dateTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
