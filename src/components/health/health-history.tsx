import { useMemo } from 'react'
import {
  HeartPulse,
  Activity,
  Droplet,
  Scale,
  Utensils,
  Smile,
  Dumbbell,
  Calendar,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HistoryEntry {
  id: string
  date: string
  icon: typeof HeartPulse
  color: string
  label: string
  value: string
  badge: string
}

export function HealthHistory() {
  const { bodyMetrics, mealLogs } = useAppStore()

  const entries = useMemo<HistoryEntry[]>(() => {
    const all: HistoryEntry[] = []

    bodyMetrics?.forEach((bm: any) => {
      if (bm.heart_rate_rest) {
        all.push({
          id: `${bm.id}-hr`,
          date: bm.date,
          icon: HeartPulse,
          color: '#FF4B4B',
          label: 'Frequência Cardíaca',
          value: `${bm.heart_rate_rest} BPM`,
          badge: 'BPM',
        })
      }
      if (bm.blood_pressure) {
        all.push({
          id: `${bm.id}-bp`,
          date: bm.date,
          icon: Activity,
          color: '#1CB0F6',
          label: 'Pressão Arterial',
          value: `${bm.blood_pressure} mmHg`,
          badge: 'PA',
        })
      }
      if (bm.glucose) {
        all.push({
          id: `${bm.id}-gl`,
          date: bm.date,
          icon: Droplet,
          color: '#FF9600',
          label: 'Glicose',
          value: `${bm.glucose} mg/dL`,
          badge: 'Glicose',
        })
      }
      if (bm.weight) {
        all.push({
          id: `${bm.id}-w`,
          date: bm.date,
          icon: Scale,
          color: '#58CC02',
          label: 'Peso Corporal',
          value: `${bm.weight} kg`,
          badge: 'Peso',
        })
      }
      if (bm.muscle_mass) {
        all.push({
          id: `${bm.id}-mm`,
          date: bm.date,
          icon: Dumbbell,
          color: '#CE82FF',
          label: 'Massa Muscular',
          value: `${bm.muscle_mass} kg`,
          badge: 'M. Muscular',
        })
      }
    })

    mealLogs?.forEach((ml: any) => {
      all.push({
        id: ml.id,
        date: ml.created_at,
        icon: Utensils,
        color: '#CE82FF',
        label: `Refeição - ${ml.meal_type || ''}`.trim(),
        value: ml.description || `${ml.calories || 0} kcal`,
        badge: 'Nutrição',
      })
    })

    return all.sort((a, b) => {
      const timeA = new Date(a.date).getTime()
      const timeB = new Date(b.date).getTime()
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA)
    })
  }, [bodyMetrics, mealLogs])

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-bold">Nenhum registro de saúde encontrado.</p>
        <p className="text-sm text-muted-foreground">
          Comece a registrar seus dados para ver seu histórico aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E5] dark:before:bg-[#3B4A55]">
      {entries.map((entry) => {
        const Icon = entry.icon
        return (
          <div key={entry.id} className="relative flex items-start gap-3 pl-0">
            <div
              className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-b-4"
              style={{ backgroundColor: entry.color + '20', borderColor: entry.color + '40' }}
            >
              <Icon className="w-5 h-5" style={{ color: entry.color }} strokeWidth={2.5} />
            </div>
            <div className="flex-1 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {isValid(new Date(entry.date))
                    ? format(new Date(entry.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
                    : 'Data indisponível'}
                </span>
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: entry.color + '20', color: entry.color }}
                >
                  {entry.badge}
                </span>
              </div>
              <p className="text-sm font-bold mt-1">{entry.label}</p>
              <p className="text-lg font-extrabold" style={{ color: entry.color }}>
                {entry.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
