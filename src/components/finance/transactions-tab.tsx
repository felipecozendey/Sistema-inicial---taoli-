import { useMemo, useState } from 'react'
import { useFinanceStore, type Transaction } from '@/stores/useFinanceStore'
import { cn } from '@/lib/utils'
import { formatCurrency, filterByDateRange } from '@/lib/finance-utils'
import { Trash2, Pencil } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionModal } from '@/components/finance/transaction-modal'

export function TransactionsTab() {
  const transactions = useFinanceStore((s) => s.transactions)
  const startDate = useFinanceStore((s) => s.financeDateRange.startDate)
  const endDate = useFinanceStore((s) => s.financeDateRange.endDate)
  const financeCategories = useFinanceStore((s) => s.financeCategories)
  const toggleTransactionStatus = useFinanceStore((s) => s.toggleTransactionStatus)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSubcategory, setFilterSubcategory] = useState('all')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const categoryOptions = useMemo(
    () => financeCategories.filter((c) => !c.parentId).map((c) => `${c.icon} ${c.name}`),
    [financeCategories],
  )

  const subcategoryOptions = useMemo(() => {
    if (filterCategory === 'all') return []
    const parent = financeCategories.find((c) => `${c.icon} ${c.name}` === filterCategory)
    if (!parent) return []
    return financeCategories
      .filter((c) => c.parentId === parent.id)
      .map((c) => `${c.icon} ${c.name}`)
  }, [financeCategories, filterCategory])

  const filtered = useMemo(() => {
    let result = filterByDateRange(transactions, startDate, endDate)
    if (filterCategory !== 'all') result = result.filter((t) => t.category === filterCategory)
    if (filterSubcategory !== 'all')
      result = result.filter((t) => t.subcategory === filterSubcategory)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, startDate, endDate, filterCategory, filterSubcategory])

  const fmt = formatCurrency

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  const handleModalChange = (open: boolean) => {
    setModalOpen(open)
    if (!open) setEditingTx(null)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={filterCategory}
          onValueChange={(v) => {
            setFilterCategory(v)
            setFilterSubcategory('all')
          }}
        >
          <SelectTrigger className="rounded-xl font-bold">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterSubcategory}
          onValueChange={setFilterSubcategory}
          disabled={filterCategory === 'all' || subcategoryOptions.length === 0}
        >
          <SelectTrigger className="rounded-xl font-bold">
            <SelectValue placeholder="Subcategoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Subcategorias</SelectItem>
            {subcategoryOptions.map((sub) => (
              <SelectItem key={sub} value={sub}>
                {sub}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl p-8 bg-card border text-center">
          <p className="text-muted-foreground font-bold">
            Nenhuma transação encontrada no período.
          </p>
        </div>
      ) : (
        filtered.map((t) => (
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
                {t.isFixed && ' · 🔒 Fixa'}
                {t.subcategory && ` · ${t.subcategory}`}
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
                onClick={() => handleEdit(t)}
                className="text-muted-foreground hover:text-[#1CB0F6] transition-colors p-1"
              >
                <Pencil className="w-4 h-4" />
              </button>
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

      <TransactionModal open={modalOpen} onOpenChange={handleModalChange} transaction={editingTx} />
    </div>
  )
}
