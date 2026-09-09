import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Droplet, CalendarX2 } from 'lucide-react'
import type { UnifiedHistoryEntry } from './types'

interface HistoryListProps {
  entries: UnifiedHistoryEntry[]
}

export function HistoryList({ entries }: HistoryListProps) {
  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <CalendarX2 className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-base font-extrabold text-foreground">Nenhum registro encontrado</p>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Não há registros correspondentes aos filtros selecionados. Experimente ampliar o intervalo
          de datas ou selecionar mais métricas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Linha do Tempo ({entries.length} {entries.length === 1 ? 'registro' : 'registros'})
        </p>
      </div>

      <div className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E5] dark:before:bg-[#3B4A55]">
        {entries.map((entry) => {
          const entryDate = new Date(entry.timestamp)
          const dateLabel = isValid(entryDate)
            ? format(entryDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
            : entry.date

          return (
            <div key={entry.id} className="relative flex items-start gap-3 pl-0">
              {/* Badge Circular do Ícone */}
              <div
                className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-b-4 bg-card"
                style={{
                  borderColor: entry.color,
                  borderBottomColor: entry.color,
                }}
              >
                {getCategoryIcon(entry.category, entry.color)}
              </div>

              {/* Card de Conteúdo */}
              <div className="flex-1 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3.5 hover:border-muted-foreground/30 transition-all shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{dateLabel}</span>
                  <span
                    className="text-xs font-black px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: entry.color + '18',
                      color: entry.color,
                      borderColor: entry.color + '40',
                    }}
                  >
                    {entry.badge}
                  </span>
                </div>

                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{entry.title}</p>
                    {entry.details && (
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        {entry.details}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-black tracking-tight" style={{ color: entry.color }}>
                    {entry.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getCategoryIcon(category: string, color: string) {
  switch (category) {
    case 'hydration':
      return <Droplet className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2.5} />
    case 'urine':
      return <span className="text-base">🟡</span>
    case 'digestion':
      return <span className="text-base">🚽</span>
    case 'quick_vitals':
      return <span className="text-base">⚡</span>
    default:
      return <span className="text-base">📋</span>
  }
}
