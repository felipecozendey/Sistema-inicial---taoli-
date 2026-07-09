import { useAppStore } from '@/stores/useAppStore'
import { Droplets, Smile } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const MOOD_EMOJIS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😩', label: 'Péssimo', color: '#FF4B4B' },
  2: { emoji: '😕', label: 'Ruim', color: '#FF9600' },
  3: { emoji: '😐', label: 'Neutro', color: '#FFC800' },
  4: { emoji: '🙂', label: 'Bom', color: '#1CB0F6' },
  5: { emoji: '😄', label: 'Excelente', color: '#58CC02' },
}

const HYDRATION_GOAL = 2000

export function HealthSummary() {
  const { getHealthRecord, user } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const record = getHealthRecord(today)

  const hydrationGoal = user.waterGoal || HYDRATION_GOAL
  const hydration = record.hydration || 0
  const hydrationPercent = Math.min(100, Math.round((hydration / hydrationGoal) * 100))
  const moodLevel = record.mood?.level || 3
  const moodInfo = MOOD_EMOJIS[moodLevel]

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Resumo de Saúde</h2>
        <Link to="/health" className="text-sm font-bold text-[#1CB0F6] hover:underline">
          Ver mais
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/health"
          className="flex items-center gap-3 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1CB0F6]/15 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">Hidratação</p>
            <p className="text-lg font-extrabold text-[#1CB0F6]">
              {hydrationPercent}%
              <span className="text-xs text-muted-foreground font-bold"> da meta</span>
            </p>
          </div>
        </Link>

        <Link
          to="/health"
          className="flex items-center gap-3 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div
            className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl')}
            style={{ backgroundColor: moodInfo.color + '20' }}
          >
            {moodInfo.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">Humor</p>
            <p className="text-lg font-extrabold" style={{ color: moodInfo.color }}>
              {moodInfo.label}
            </p>
          </div>
        </Link>
      </div>
    </section>
  )
}
