import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Task, Habit, useAppStore } from '@/stores/useAppStore'
import { DailyFocusStats } from '@/components/focus-radar/focus-radar-provider'
import {
  AlertTriangle,
  Clock,
  Droplets,
  Flame,
  Radio,
  Smile,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { calculateStreak, isHabitScheduledOn } from '@/lib/habit-utils'
import { cn } from '@/lib/utils'

interface SmartRemindersProps {
  tasks: Task[]
  habits: Habit[]
  todayStats?: DailyFocusStats
  todayStr: string
  onGoToFocus: () => void
}

interface ContextReminder {
  id: string
  type: 'danger' | 'warning' | 'info' | 'purple'
  title: string
  description: string
  icon: any
  actionLabel: string
  actionTo?: string
  actionFn?: () => void
}

export function SmartReminders({
  tasks,
  habits,
  todayStats,
  todayStr,
  onGoToFocus,
}: SmartRemindersProps) {
  const { getHealthRecord, user, tags } = useAppStore()
  const healthRecord = getHealthRecord(todayStr)
  const waterGoal = user.waterGoal || 2000

  // 1. Lembretes contextuais
  const reminders = useMemo(() => {
    const list: ContextReminder[] = []

    // A. Tarefas atrasadas (dueDate < todayStr && !completed)
    const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr)
    if (overdueTasks.length > 0) {
      list.push({
        id: 'overdue-tasks',
        type: 'danger',
        title: `${overdueTasks.length} ${overdueTasks.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}`,
        description: `Exige sua atenção: "${overdueTasks[0].title}"${overdueTasks.length > 1 ? ` e +${overdueTasks.length - 1}` : ''}.`,
        icon: AlertTriangle,
        actionLabel: 'Resolver',
        actionTo: '/tasks',
      })
    }

    // B. Hábitos com streak em risco (streak > 0, agendado para hoje, mas ainda não concluído hoje)
    const todayObj = new Date()
    const habitsAtRisk = habits.filter((h) => {
      const streak = calculateStreak(h.completions, h.frozenDates)
      const scheduled = isHabitScheduledOn(h, todayObj)
      const doneToday = h.completions.includes(todayStr)
      return streak > 0 && scheduled && !doneToday
    })

    if (habitsAtRisk.length > 0) {
      const highestStreakHabit = [...habitsAtRisk].sort(
        (a, b) =>
          calculateStreak(b.completions, b.frozenDates) -
          calculateStreak(a.completions, a.frozenDates),
      )[0]
      const currentStreak = calculateStreak(
        highestStreakHabit.completions,
        highestStreakHabit.frozenDates,
      )

      list.push({
        id: 'habit-streak-risk',
        type: 'warning',
        title: `Sequência de ${currentStreak} dias em risco!`,
        description: `Conclua "${highestStreakHabit.title}" hoje para não perder a chama.`,
        icon: Flame,
        actionLabel: 'Ver Hábitos',
        actionTo: '/tasks?tab=habitos',
      })
    }

    // C. Hidratação abaixo do ritmo esperado
    // Ritmo esperado baseado na hora atual: entre 8h e 22h
    const currentHour = new Date().getHours()
    const hydration = healthRecord.hydration || 0
    let expectedHydrationRatio = 0
    if (currentHour >= 21) {
      expectedHydrationRatio = 0.9
    } else if (currentHour >= 16) {
      expectedHydrationRatio = 0.65
    } else if (currentHour >= 12) {
      expectedHydrationRatio = 0.4
    } else if (currentHour >= 9) {
      expectedHydrationRatio = 0.15
    }

    const expectedMl = Math.round(waterGoal * expectedHydrationRatio)
    if (expectedMl > 0 && hydration < expectedMl * 0.7) {
      list.push({
        id: 'hydration-low',
        type: 'info',
        title: 'Beba água agora 💧',
        description: `Você bebeu ${hydration}ml de ${waterGoal}ml da meta. Mantenha o corpo hidratado!`,
        icon: Droplets,
        actionLabel: 'Registrar',
        actionTo: '/health',
      })
    }

    // D. Nenhuma sessão de foco ainda hoje (se passou do meio-dia e 0 sessões)
    const focusMins = todayStats?.focusMinutes || 0
    const focusSessions = todayStats?.sessions || 0
    if (currentHour >= 11 && focusSessions === 0 && focusMins === 0) {
      list.push({
        id: 'no-focus-today',
        type: 'purple',
        title: 'Nenhum bloco de foco hoje',
        description: 'Faça um bloco rápido de 25 min para dar tração aos seus projetos.',
        icon: Radio,
        actionLabel: 'Iniciar Foco',
        actionFn: onGoToFocus,
      })
    }

    // E. Registro de humor pendente (se passou das 14h e ainda não registrou humor hoje)
    if (currentHour >= 14 && !healthRecord.mood) {
      list.push({
        id: 'mood-checkin-pending',
        type: 'info',
        title: 'Como você está se sentindo?',
        description: 'Faça seu check-in diário de humor e bem-estar em segundos.',
        icon: Smile,
        actionLabel: 'Registrar',
        actionTo: '/health',
      })
    }

    return list
  }, [tasks, habits, healthRecord, waterGoal, todayStats, todayStr, onGoToFocus])

  // 2. Sugestões inteligentes derivadas de dados
  const suggestions = useMemo(() => {
    const list: {
      id: string
      badge: string
      title: string
      text: string
      icon: any
      actionTo?: string
      actionFn?: () => void
      actionLabel: string
    }[] = []

    // Sugestão A: Próxima tarefa de alta energia pendente para hoje
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr && !t.completed)
    const highEnergyTask = todayTasks.find((t) => t.energyLevel === 3)
    if (highEnergyTask) {
      list.push({
        id: 'high-energy-task',
        badge: 'Pico de Energia ⚡',
        title: highEnergyTask.title,
        text: 'Tarefa de Alta Energia ideal para seu momento de maior concentração do dia.',
        icon: Zap,
        actionTo: '/tasks',
        actionLabel: 'Ver tarefa',
      })
    } else {
      // Ou qualquer tarefa pendente para hoje
      const anyTodayTask = todayTasks[0]
      if (anyTodayTask) {
        list.push({
          id: 'next-today-task',
          badge: 'Próxima Ação 🎯',
          title: anyTodayTask.title,
          text: anyTodayTask.estimatedTime
            ? `Estimativa de ${anyTodayTask.estimatedTime} min para concluir hoje.`
            : 'Foque nesta tarefa para avançar sua meta do dia.',
          icon: Clock,
          actionTo: '/tasks',
          actionLabel: 'Fazer agora',
        })
      }
    }

    // Sugestão B: Tag mais produtiva (reutiliza a inteligência de tags do usuário)
    const completedTasksWithTags = tasks.filter((t) => t.completed && t.tagId)
    const tagCounts: Record<string, number> = {}
    completedTasksWithTags.forEach((t) => {
      tagCounts[t.tagId!] = (tagCounts[t.tagId!] || 0) + 1
    })

    let topTagId = ''
    let topTagCount = 0
    Object.entries(tagCounts).forEach(([tagId, count]) => {
      if (count > topTagCount) {
        topTagCount = count
        topTagId = tagId
      }
    })

    const topTag = tags.find((t) => t.id === topTagId)
    if (topTag && topTagCount >= 2) {
      list.push({
        id: 'top-tag-insight',
        badge: 'Sua Tag Campeã 🏆',
        title: `${topTag.name} (${topTagCount} concluídas)`,
        text: `Você tem excelente fluidez em "${topTag.name}". Aproveite o ritmo!`,
        icon: TrendingUp,
        actionTo: '/tasks',
        actionLabel: 'Filtrar por tag',
      })
    }

    // Sugestão C: Hábito consistente para manter o embalo
    const bestHabit = [...habits]
      .filter((h) => h.completions && h.completions.length > 0)
      .sort((a, b) => b.completions.length - a.completions.length)[0]

    if (bestHabit) {
      const bestStreak = calculateStreak(bestHabit.completions, bestHabit.frozenDates)
      list.push({
        id: 'best-habit-celebration',
        badge: 'Constância de Campeão 🔥',
        title: bestHabit.title,
        text: `Você já completou ${bestHabit.completions.length} vezes (${bestStreak} dias seguidos). Continue!`,
        icon: Sparkles,
        actionTo: '/tasks?tab=habitos',
        actionLabel: 'Ver hábitos',
      })
    }

    return list
  }, [tasks, habits, tags, todayStr])

  // Se não houver nenhum lembrete nem sugestão, não ocupa espaço
  if (reminders.length === 0 && suggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Faixa de Lembretes Contextuais Rolável Horizontalmente */}
      {reminders.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <span>🔔</span>
              <span>Lembretes Importantes</span>
            </h2>
            <span className="text-[11px] font-bold text-muted-foreground">
              {reminders.length} {reminders.length === 1 ? 'pendência' : 'pendências'}
            </span>
          </div>

          <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
            <div className="inline-flex gap-3 min-w-full sm:min-w-0">
              {reminders.map((rem) => {
                const IconComponent = rem.icon

                // Estilos por tipo (Duolingo)
                const styleMap = {
                  danger: {
                    border: 'border-[#FF4B4B] bg-[#FF4B4B]/10 text-foreground',
                    iconBg: 'bg-[#FF4B4B] text-white',
                    btn: 'bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 border-[#CC3C3C]',
                  },
                  warning: {
                    border: 'border-[#FFC800] bg-[#FFC800]/15 text-foreground',
                    iconBg: 'bg-[#FFC800] text-black',
                    btn: 'bg-[#FFC800] text-black hover:bg-[#FFC800]/90 border-[#D9A700]',
                  },
                  info: {
                    border: 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-foreground',
                    iconBg: 'bg-[#1CB0F6] text-white',
                    btn: 'bg-[#1CB0F6] text-white hover:bg-[#1CB0F6]/90 border-[#1899D6]',
                  },
                  purple: {
                    border: 'border-[#CE82FF] bg-[#CE82FF]/10 text-foreground',
                    iconBg: 'bg-[#CE82FF] text-white',
                    btn: 'bg-[#CE82FF] text-white hover:bg-[#CE82FF]/90 border-[#A347DF]',
                  },
                }

                const s = styleMap[rem.type]

                return (
                  <div
                    key={rem.id}
                    className={cn(
                      'w-72 sm:w-80 shrink-0 p-4 rounded-3xl border-2 border-b-4 flex flex-col justify-between shadow-xs transition-all hover:scale-[1.01]',
                      s.border,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs',
                          s.iconBg,
                        )}
                      >
                        <IconComponent className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-black leading-tight truncate">
                          {rem.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-1 line-clamp-2 leading-relaxed">
                          {rem.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                      {rem.actionTo ? (
                        <Link
                          to={rem.actionTo}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-black border-b-2 flex items-center gap-1 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer shadow-xs',
                            s.btn,
                          )}
                        >
                          <span>{rem.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={rem.actionFn}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-black border-b-2 flex items-center gap-1 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer shadow-xs',
                            s.btn,
                          )}
                        >
                          <span>{rem.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sugestões Inteligentes */}
      {suggestions.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <span>💡</span>
              <span>Sugestões para o seu dia</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((sug) => {
              const IconComp = sug.icon
              return (
                <div
                  key={sug.id}
                  className="bg-card border-2 border-b-4 rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:border-[#1CB0F6]/60 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#1CB0F6]/15 text-[#1CB0F6]">
                        {sug.badge}
                      </span>
                      <IconComp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground truncate">{sug.title}</h4>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5 line-clamp-2">
                        {sug.text}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t flex justify-end">
                    {sug.actionTo ? (
                      <Link
                        to={sug.actionTo}
                        className="text-xs font-black text-[#1CB0F6] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {sug.actionLabel} <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={sug.actionFn}
                        className="text-xs font-black text-[#1CB0F6] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {sug.actionLabel} <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
