import { HEALTH_METRIC_OPTIONS, type HealthMetricCategory } from './types'
import { cn } from '@/lib/utils'

interface MetricToggleGroupProps {
  selectedMetrics: HealthMetricCategory[]
  onChange: (metrics: HealthMetricCategory[]) => void
}

export function MetricToggleGroup({ selectedMetrics, onChange }: MetricToggleGroupProps) {
  const toggleMetric = (id: HealthMetricCategory) => {
    if (selectedMetrics.includes(id)) {
      // Don't allow unselecting everything: if length is 1, keep it or allow multi-toggle
      // User guideline: "O usuário pode ativar apenas uma opção para focar em um dado, ou múltiplas opções simultaneamente"
      // If user unselects the only one, allow empty state or keep at least one? Better allow empty with clear empty state message, or keep minimum 1. Let's allow toggling freely, but if all unselected, empty state shows "Selecione ao menos uma métrica".
      onChange(selectedMetrics.filter((m) => m !== id))
    } else {
      onChange([...selectedMetrics, id])
    }
  }

  const selectAll = () => {
    onChange(HEALTH_METRIC_OPTIONS.map((m) => m.id))
  }

  const isAllSelected = selectedMetrics.length === HEALTH_METRIC_OPTIONS.length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Filtrar Métricas:
        </span>
        <button
          type="button"
          onClick={selectAll}
          disabled={isAllSelected}
          className={cn(
            'text-[11px] font-extrabold transition-colors',
            isAllSelected
              ? 'text-muted-foreground/50 cursor-default'
              : 'text-[#1CB0F6] hover:underline',
          )}
        >
          {isAllSelected ? 'Todas ativas' : 'Selecionar todas'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {HEALTH_METRIC_OPTIONS.map((option) => {
          const isActive = selectedMetrics.includes(option.id)

          // Estilo Duolingo com border-b-4, rounded-3xl e paleta do projeto
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleMetric(option.id)}
              className={cn(
                'px-4 py-2 rounded-3xl font-black text-xs transition-all duration-150 flex items-center gap-2 select-none border-2 border-b-4',
                isActive
                  ? 'text-white shadow-sm active:translate-y-1 active:border-b-0'
                  : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground active:translate-y-0.5 active:border-b-2',
              )}
              style={
                isActive
                  ? {
                      backgroundColor: option.color,
                      borderColor: option.color,
                      borderBottomColor: getDarkerShade(option.color),
                    }
                  : undefined
              }
            >
              <span className="text-sm">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getDarkerShade(hex: string): string {
  // Cores Duolingo personalizadas com borda 3D
  switch (hex) {
    case '#1CB0F6':
      return '#0E8FCC'
    case '#FFC800':
      return '#CC9E00'
    case '#FF9600':
      return '#CC7A00'
    case '#58CC02':
      return '#46A302'
    case '#CE82FF':
      return '#9B54BA'
    case '#FF4B4B':
      return '#CC3838'
    case '#0E8FCC':
      return '#0A6A99'
    default:
      return '#3B4A55'
  }
}
