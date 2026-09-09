import { useState, useMemo, useEffect } from 'react'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Droplet,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Activity,
  Ruler,
  Scale,
} from 'lucide-react'
import type { UnifiedHistoryEntry } from './types'
import { cn } from '@/lib/utils'

interface HistoryListProps {
  entries: UnifiedHistoryEntry[]
}

const ITEMS_PER_PAGE = 5

export function HistoryList({ entries }: HistoryListProps) {
  // Paginação client-side Zero Lag
  const [currentPage, setCurrentPage] = useState(1)

  // Calcular número total de páginas
  const totalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE))

  // Se o número de registros diminuir e a página atual ficar fora do intervalo, ajustar para a página 1
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Fatiar de forma puramente síncrona com useMemo
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return entries.slice(start, start + ITEMS_PER_PAGE)
  }, [entries, currentPage])

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

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, entries.length)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Linha do Tempo ({entries.length} {entries.length === 1 ? 'registro' : 'registros'})
        </p>
        {entries.length > ITEMS_PER_PAGE && (
          <span className="text-xs font-bold text-muted-foreground">
            Exibindo {startItem}-{endItem} de {entries.length}
          </span>
        )}
      </div>

      <div className="relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E5] dark:before:bg-[#3B4A55]">
        {paginatedEntries.map((entry) => {
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

      {/* Controles de Paginação Client-Side estilo Duolingo */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5] dark:border-[#3B4A55]/60">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={cn(
              'px-4 py-2 rounded-3xl font-extrabold text-xs transition-all duration-150 flex items-center gap-1.5 select-none border-2 border-b-4',
              currentPage === 1
                ? 'opacity-40 cursor-not-allowed bg-muted/40 border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground'
                : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-foreground hover:border-[#1CB0F6]/50 active:translate-y-1 active:border-b-0',
            )}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-muted-foreground">
              Página <span className="text-foreground font-black">{currentPage}</span> de{' '}
              <span className="text-foreground font-black">{totalPages}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              'px-4 py-2 rounded-3xl font-extrabold text-xs transition-all duration-150 flex items-center gap-1.5 select-none border-2 border-b-4',
              currentPage === totalPages
                ? 'opacity-40 cursor-not-allowed bg-muted/40 border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground'
                : 'bg-card border-[#E5E5E5] dark:border-[#3B4A55] text-foreground hover:border-[#1CB0F6]/50 active:translate-y-1 active:border-b-0',
            )}
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}

function getCategoryIcon(category: string, _color: string) {
  switch (category) {
    case 'heart_rate':
      return <HeartPulse className="w-5 h-5 text-[#FF4B4B]" strokeWidth={2.5} />
    case 'blood_pressure':
      return <Activity className="w-5 h-5 text-[#0E8FCC]" strokeWidth={2.5} />
    case 'glucose':
      return <span className="text-base">🩸</span>
    case 'weight':
      return <Scale className="w-5 h-5 text-[#58CC02]" strokeWidth={2.5} />
    case 'height':
      return <Ruler className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2.5} />
    case 'hydration':
      return <Droplet className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2.5} />
    case 'urine':
      return <span className="text-base">🟡</span>
    case 'digestion':
      return <span className="text-base">🚽</span>
    default:
      return <span className="text-base">📋</span>
  }
}
