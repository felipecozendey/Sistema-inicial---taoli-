import { useMemo, useState } from 'react'
import { useFinanceStore, type Transaction } from '@/stores/useFinanceStore'
import { cn } from '@/lib/utils'
import { formatCurrency, filterByDateRange, formatSafeDateBR } from '@/lib/finance-utils'
import { Trash2, Pencil, Layers, CreditCard, Landmark, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionModal } from '@/components/finance/transaction-modal'
import { toast } from 'sonner'

export function TransactionsTab() {
  const transactions = useFinanceStore((s) => s.transactions)
  const startDate = useFinanceStore((s) => s.financeDateRange.startDate)
  const endDate = useFinanceStore((s) => s.financeDateRange.endDate)
  const financeCategories = useFinanceStore((s) => s.financeCategories)
  const paymentMethods = useFinanceStore((s) => s.paymentMethods)
  const bankAccounts = useFinanceStore((s) => s.bankAccounts)
  const toggleTransactionStatus = useFinanceStore((s) => s.toggleTransactionStatus)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const deleteInstallmentGroup = useFinanceStore((s) => s.deleteInstallmentGroup)

  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSubcategory, setFilterSubcategory] = useState('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all')
  const [filterBankAccount, setFilterBankAccount] = useState('all')
  const [filterOnlyInstallments, setFilterOnlyInstallments] = useState(false)

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
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory)
    }
    if (filterSubcategory !== 'all') {
      result = result.filter((t) => t.subcategory === filterSubcategory)
    }
    if (filterPaymentMethod !== 'all') {
      result = result.filter((t) => t.paymentMethodId === filterPaymentMethod)
    }
    if (filterBankAccount !== 'all') {
      result = result.filter((t) => t.bankAccountId === filterBankAccount)
    }
    if (filterOnlyInstallments) {
      result = result.filter((t) => !!t.isInstallment)
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [
    transactions,
    startDate,
    endDate,
    filterCategory,
    filterSubcategory,
    filterPaymentMethod,
    filterBankAccount,
    filterOnlyInstallments,
  ])

  const fmt = formatCurrency

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setModalOpen(true)
  }

  const handleModalChange = (open: boolean) => {
    setModalOpen(open)
    if (!open) setEditingTx(null)
  }

  const handleDelete = (tx: Transaction) => {
    if (tx.isInstallment) {
      // Se for parcela, oferecer apagar grupo inteiro ou apenas esta parcela
      const rootId = tx.parentId || tx.id
      const confirmGroup = window.confirm(
        `Esta é a parcela ${tx.installmentNumber || '?'}/${tx.totalInstallments || '?'}. Deseja excluir TODO o carnê/todas as parcelas desta compra?\n\n- Clique em "OK" para excluir TODAS as parcelas deste grupo.\n- Clique em "Cancelar" para excluir apenas esta parcela individual.`,
      )
      if (confirmGroup) {
        deleteInstallmentGroup(rootId)
        return
      }
    }
    deleteTransaction(tx.id)
    toast.success('Transação excluída! 🗑️')
  }

  return (
    <div className="space-y-4">
      {/* FILTROS CLIENT-SIDE (useMemo) */}
      <div className="p-4 rounded-3xl bg-card border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filtros Rápidos
          </span>
          <button
            type="button"
            onClick={() => setFilterOnlyInstallments(!filterOnlyInstallments)}
            className={cn(
              'px-3 py-1 rounded-xl text-xs font-extrabold border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-2 flex items-center gap-1.5',
              filterOnlyInstallments
                ? 'bg-[#1CB0F6] border-[#1899D6] text-white'
                : 'bg-muted border-border text-muted-foreground',
            )}
          >
            <Layers className="w-3.5 h-3.5" /> Somente Parceladas
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Categoria */}
          <Select
            value={filterCategory}
            onValueChange={(v) => {
              setFilterCategory(v)
              setFilterSubcategory('all')
            }}
          >
            <SelectTrigger className="rounded-xl font-bold text-xs h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subcategoria */}
          <Select
            value={filterSubcategory}
            onValueChange={setFilterSubcategory}
            disabled={filterCategory === 'all' || subcategoryOptions.length === 0}
          >
            <SelectTrigger className="rounded-xl font-bold text-xs h-9">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Subcategorias</SelectItem>
              {subcategoryOptions.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Método de Pagamento */}
          <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
            <SelectTrigger className="rounded-xl font-bold text-xs h-9">
              <SelectValue placeholder="Método de Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Métodos</SelectItem>
              {paymentMethods.map((pm) => (
                <SelectItem key={pm.id} value={pm.id}>
                  💳 {pm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Conta Bancária */}
          <Select value={filterBankAccount} onValueChange={setFilterBankAccount}>
            <SelectTrigger className="rounded-xl font-bold text-xs h-9">
              <SelectValue placeholder="Conta Bancária" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              {bankAccounts.map((ba) => (
                <SelectItem key={ba.id} value={ba.id}>
                  🏦 {ba.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LISTAGEM DE TRANSAÇÕES */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl p-8 bg-card border text-center">
          <p className="text-muted-foreground font-bold">
            Nenhuma transação encontrada para os filtros selecionados no período.
          </p>
        </div>
      ) : (
        filtered.map((t) => {
          const pm = paymentMethods.find((p) => p.id === t.paymentMethodId)
          const ba = bankAccounts.find((b) => b.id === t.bankAccountId)

          return (
            <div
              key={t.id}
              className={cn(
                'rounded-3xl p-4 bg-card border flex items-center gap-3 transition-all',
                t.isInstallment && 'border-l-4 border-l-[#1CB0F6]',
              )}
            >
              {/* Botão de Status Pago/Pendente */}
              <button
                type="button"
                onClick={() => toggleTransactionStatus(t.id)}
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg border-2 border-b-4 flex items-center justify-center transition-all duration-150 active:translate-y-1 active:border-b-2',
                  t.status === 'paid'
                    ? 'bg-[#58CC02] border-[#46A302] text-white'
                    : 'bg-muted border-muted-foreground/30 text-transparent',
                )}
                title={t.status === 'paid' ? 'Marcar como pendente' : 'Marcar como pago'}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm truncate">{t.description || t.category}</p>

                  {/* Badge de Parcela Identificadora */}
                  {t.isInstallment && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1CB0F6]/15 text-[#1CB0F6] border border-[#1CB0F6]/30 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Parcela {t.installmentNumber || 1}/{t.totalInstallments || 1}
                    </span>
                  )}

                  {t.isFixed && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF9600]/15 text-[#FF9600]">
                      🔒 Fixa
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mt-0.5">
                  <span>{formatSafeDateBR(t.date)}</span>
                  <span>·</span>
                  <span>{t.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}</span>
                  {t.subcategory && (
                    <>
                      <span>·</span>
                      <span>{t.subcategory}</span>
                    </>
                  )}
                  {pm && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <CreditCard className="w-3 h-3 text-[#1CB0F6]" />
                        {pm.name}
                      </span>
                    </>
                  )}
                  {ba && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <Landmark className="w-3 h-3 text-[#58CC02]" />
                        {ba.name}
                      </span>
                    </>
                  )}
                </div>
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
                  type="button"
                  onClick={() => handleEdit(t)}
                  className="text-muted-foreground hover:text-[#1CB0F6] transition-colors p-1"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  className="text-muted-foreground hover:text-[#FF4B4B] transition-colors p-1"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })
      )}

      <TransactionModal open={modalOpen} onOpenChange={handleModalChange} transaction={editingTx} />
    </div>
  )
}
