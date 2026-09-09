import { useMemo, useState } from 'react'
import { Task, useAppStore } from '@/stores/useAppStore'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskDateFilter, TimeFilterMode } from '@/components/tasks/task-date-filter'
import { safeFormatDateLong } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import {
  CalendarDays,
  CheckCircle2,
  ListTodo,
  CalendarCheck,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay,
  format,
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
  const [filterMode, setFilterMode] = useState<TimeFilterMode>('today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)

  // 1. Filtragem Zero Lag com useMemo
  const filteredTasks = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Começando na segunda
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    return tasks.filter((t) => {
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

      // Filtro de Tempo (Data)
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
        if (!customRange?.from) return true // Sem período custom selecionado: mostra tudo
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
  }, [tasks, selectedTags, nearDeadlineOnly, filterMode, customRange])

  // 2. Agrupamento de tarefas por data quando em Semana, Mês ou Período Personalizado
  const groupedTasks = useMemo(() => {
    if (filterMode === 'today') {
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

  // Contadores para o resumo do topo
  const completedCount = filteredTasks.filter((t) => t.completed).length
  const totalCount = filteredTasks.length

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
            {filterMode === 'week' && 'Tarefas da semana atual agrupadas dia a dia'}
            {filterMode === 'month' && 'Visão consolidada do mês atual por data'}
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

      {/* Lista de Tarefas ou Estado Vazio */}
      {filteredTasks.length === 0 ? (
        <div className="text-center p-10 bg-card rounded-3xl border-2 border-b-4 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1CB0F6]/10 flex items-center justify-center">
            <ListTodo className="w-8 h-8 text-[#1CB0F6]" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-extrabold">Nenhuma tarefa encontrada</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
              {filterMode === 'today'
                ? 'Nenhuma tarefa agendada para hoje. Aproveite o dia ou crie uma nova tarefa!'
                : 'Não há tarefas cadastradas para o período ou filtros selecionados.'}
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
      ) : (
        /* Renderização agrupada por data para Semana, Mês ou Período */
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
