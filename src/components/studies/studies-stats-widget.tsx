import { useMemo } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { Flame, CheckCircle2, Target, Sparkles } from 'lucide-react'

export function StudiesStatsWidget() {
  const { reviewLogs } = useStudiesStore()

  const stats = useMemo(() => {
    if (!reviewLogs || reviewLogs.length === 0) {
      return { reviewsToday: 0, streak: 0, accuracy7Days: 0, totalLogs: 0 }
    }

    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Distinct calendar days with reviews
    const reviewDates = new Set<string>()
    let reviewsToday = 0

    const sevenDaysAgoTime = Date.now() - 7 * 86400000
    let totalLast7Days = 0
    let correctLast7Days = 0

    for (const log of reviewLogs) {
      const d = new Date(log.reviewed_at)
      if (isNaN(d.getTime())) continue
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      reviewDates.add(dateKey)

      if (dateKey === todayStr) {
        reviewsToday++
      }

      const logTime = d.getTime()
      if (logTime >= sevenDaysAgoTime) {
        totalLast7Days++
        if (log.feedback === 'GOOD' || log.feedback === 'HARD') {
          correctLast7Days++
        }
      }
    }

    // Calculate streak
    let streak = 0
    let checkDate = new Date(now)
    // If no reviews today yet, check if there was review yesterday to keep streak active
    const hasToday = reviewDates.has(todayStr)
    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    while (true) {
      const yStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      if (reviewDates.has(yStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    const accuracy7Days =
      totalLast7Days > 0 ? Math.round((correctLast7Days / totalLast7Days) * 100) : 0

    return {
      reviewsToday,
      streak,
      accuracy7Days,
      totalLogs: reviewLogs.length,
    }
  }, [reviewLogs])

  if (stats.totalLogs === 0) {
    return (
      <div className="bg-card rounded-3xl border-2 border-b-4 border-border p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold">Estatísticas de Estudo</h4>
            <p className="text-xs text-muted-foreground font-semibold">
              Complete suas primeiras revisões para ativar o streak e taxa de acerto.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Revisões Hoje */}
      <div className="bg-card rounded-3xl border-2 border-b-4 border-border p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Hoje</span>
          <div className="w-7 h-7 rounded-xl bg-[#1CB0F6]/15 flex items-center justify-center text-[#1CB0F6]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black">{stats.reviewsToday}</span>
          <p className="text-[11px] font-bold text-muted-foreground">revisões</p>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-card rounded-3xl border-2 border-b-4 border-border p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Streak</span>
          <div className="w-7 h-7 rounded-xl bg-[#FF9600]/15 flex items-center justify-center text-[#FF9600]">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black">{stats.streak}</span>
          <p className="text-[11px] font-bold text-muted-foreground">
            {stats.streak === 1 ? 'dia' : 'dias'}
          </p>
        </div>
      </div>

      {/* Taxa de Acerto (7 dias) */}
      <div className="bg-card rounded-3xl border-2 border-b-4 border-border p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Acerto (7d)</span>
          <div className="w-7 h-7 rounded-xl bg-[#58CC02]/15 flex items-center justify-center text-[#58CC02]">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black">{stats.accuracy7Days}%</span>
          <p className="text-[11px] font-bold text-muted-foreground">taxa média</p>
        </div>
      </div>
    </div>
  )
}
