import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/finance-utils'
import { Trash2 } from 'lucide-react'

export function TransactionsTab() {
  const transactions = useAppStore((s) => s.transactions)
  const toggleTransactionStatus = useAppStore((s) => s.toggleTransactionStatus)
  const deleteTransaction = useAppStore((s) => s.deleteTransaction)

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions])

  const fmt = formatCurrency

  return (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <div className="rounded-3xl p-8 bg-card border text-center">
          <p className="text-muted-foreground font-bold">Nenhuma transação registrada ainda.</p>
        </div>
      ) : (
        sorted.map((t) => (
          <div key={t.id} className="rounded-3xl p-4 bg-card border flex items-center gap-3">
            <button
              onClick={() => toggleTransactionStatus(t.id)}
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-lg border-2 border-b-4 flex items-center justify-center transition-all duration-150 active:translate-y-1 active:border-b-2',
                t.status === 'paid'
                  ? 'bg-[#58CC02] border-[#46A302] text-white'
                  : 'bg-muted border-muted-foreground/30 text-transparent',
              )}
            >
              {t.status === 'paid' && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            <span className="text-2xl flex-shrink-0">{t.category.split(' ')[0]}</span>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{t.description || t.category}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')} ·{' '}
                {t.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={cn(
                  'font-extrabold text-sm',
                  t.type === 'income' ? 'text-[#58CC02]' : 'text-[#FF4B4B]',
                )}
              >
                {t.type === 'income' ? '+' : '-'}
                {fmt(t.amount)}
              </span>
              <button
                onClick={() => deleteTransaction(t.id)}
                className="text-muted-foreground hover:text-[#FF4B4B] transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
