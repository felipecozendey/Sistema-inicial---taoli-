import { useState, useMemo } from 'react'
import {
  useFinanceStore,
  type FinanceCategory,
  type PaymentMethod,
  type BankAccount,
} from '@/stores/useFinanceStore'
import { FinanceCategoryModal } from '@/components/finance/finance-category-modal'
import { PaymentMethodModal } from '@/components/finance/payment-method-modal'
import { BankAccountModal } from '@/components/finance/bank-account-modal'
import { formatCurrency } from '@/lib/finance-utils'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  CreditCard,
  Landmark,
  Wallet,
  AlertTriangle,
} from 'lucide-react'

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'Pix',
  cash: 'Dinheiro',
  boleto: 'Boleto',
  other: 'Outro',
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  wallet: 'Carteira',
  investment: 'Investimentos',
}

export function FinanceSettingsTab() {
  const financeCategories = useFinanceStore((s) => s.financeCategories)
  const deleteFinanceCategory = useFinanceStore((s) => s.deleteFinanceCategory)

  const paymentMethods = useFinanceStore((s) => s.paymentMethods)
  const deletePaymentMethod = useFinanceStore((s) => s.deletePaymentMethod)

  const bankAccounts = useFinanceStore((s) => s.bankAccounts)
  const deleteBankAccount = useFinanceStore((s) => s.deleteBankAccount)

  const transactions = useFinanceStore((s) => s.transactions)

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null)
  const [parentCategory, setParentCategory] = useState<FinanceCategory | null>(null)

  // Payment Method Modal State
  const [pmModalOpen, setPmModalOpen] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)

  // Bank Account Modal State
  const [baModalOpen, setBaModalOpen] = useState(false)
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null)

  const { mainCategories, subcategoriesByParent } = useMemo(() => {
    const mains = financeCategories.filter((c) => !c.parentId)
    const subs: Record<string, FinanceCategory[]> = {}
    financeCategories
      .filter((c) => c.parentId)
      .forEach((c) => {
        if (c.parentId) {
          if (!subs[c.parentId]) subs[c.parentId] = []
          subs[c.parentId].push(c)
        }
      })
    return { mainCategories: mains, subcategoriesByParent: subs }
  }, [financeCategories])

  // Handlers Categorias
  const openNewCategory = () => {
    setEditingCategory(null)
    setParentCategory(null)
    setCatModalOpen(true)
  }

  const openNewSubcategory = (parent: FinanceCategory) => {
    setEditingCategory(null)
    setParentCategory(parent)
    setCatModalOpen(true)
  }

  const openEditCategory = (cat: FinanceCategory) => {
    setEditingCategory(cat)
    setParentCategory(null)
    setCatModalOpen(true)
  }

  const handleDeleteCategory = (cat: FinanceCategory) => {
    deleteFinanceCategory(cat.id)
    toast.success('Categoria removida! 🗑️')
  }

  // Handlers Métodos de Pagamento
  const openNewPaymentMethod = () => {
    setEditingPaymentMethod(null)
    setPmModalOpen(true)
  }

  const openEditPaymentMethod = (pm: PaymentMethod) => {
    setEditingPaymentMethod(pm)
    setPmModalOpen(true)
  }

  const handleDeletePaymentMethod = (pm: PaymentMethod) => {
    const linkedCount = transactions.filter((t) => t.paymentMethodId === pm.id).length
    if (linkedCount > 0) {
      const confirmDelete = window.confirm(
        `Atenção: existem ${linkedCount} transações vinculadas a este método de pagamento. Se continuar, as transações serão desvinculadas. Deseja excluir mesmo assim?`,
      )
      if (!confirmDelete) return
    }
    deletePaymentMethod(pm.id)
    toast.success('Método de pagamento removido! 🗑️')
  }

  // Handlers Contas Bancárias
  const openNewBankAccount = () => {
    setEditingBankAccount(null)
    setBaModalOpen(true)
  }

  const openEditBankAccount = (ba: BankAccount) => {
    setEditingBankAccount(ba)
    setBaModalOpen(true)
  }

  const handleDeleteBankAccount = (ba: BankAccount) => {
    const linkedCount = transactions.filter((t) => t.bankAccountId === ba.id).length
    if (linkedCount > 0) {
      const confirmDelete = window.confirm(
        `Atenção: existem ${linkedCount} transações vinculadas a esta conta bancária. Se continuar, as transações serão desvinculadas. Deseja excluir mesmo assim?`,
      )
      if (!confirmDelete) return
    }
    deleteBankAccount(ba.id)
    toast.success('Conta bancária removida! 🗑️')
  }

  return (
    <div className="space-y-8 pb-24">
      {/* SEÇÃO 1: CONTAS BANCÁRIAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#58CC02]" /> Contas Bancárias & Carteiras
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Bancos, carteiras físicas ou contas de investimentos para cálculo do saldo
              consolidado.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewBankAccount}
            className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Nova Conta
          </button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="rounded-3xl p-6 bg-card border text-center">
            <p className="text-muted-foreground font-bold text-sm">
              Nenhuma conta bancária cadastrada ainda. Adicione sua primeira conta!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bankAccounts.map((ba) => {
              // Calcular saldo atual estimado desta conta
              const income = transactions
                .filter(
                  (t) => t.bankAccountId === ba.id && t.type === 'income' && t.status === 'paid',
                )
                .reduce((s, t) => s + t.amount, 0)
              const expense = transactions
                .filter(
                  (t) => t.bankAccountId === ba.id && t.type === 'expense' && t.status === 'paid',
                )
                .reduce((s, t) => s + t.amount, 0)
              const estimatedBalance = ba.initialBalance + income - expense

              return (
                <div
                  key={ba.id}
                  className="rounded-3xl p-4 bg-card border flex items-center justify-between"
                  style={{ borderLeftWidth: 6, borderLeftColor: ba.color }}
                >
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-sm flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: ba.color }}
                      />
                      {ba.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {ACCOUNT_TYPE_LABELS[ba.accountType] || ba.accountType} · Saldo Inicial:{' '}
                      {formatCurrency(ba.initialBalance)}
                    </p>
                    <p className="text-xs font-extrabold text-[#58CC02]">
                      Saldo Atual Estimado: {formatCurrency(estimatedBalance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditBankAccount(ba)}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBankAccount(ba)}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-[#FF4B4B] hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: MÉTODOS DE PAGAMENTO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1CB0F6]" /> Métodos de Pagamento
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Cartões de crédito/débito, Pix, Dinheiro para vincular às despesas e parcelas.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewPaymentMethod}
            className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold text-sm border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Novo Método
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="rounded-3xl p-6 bg-card border text-center">
            <p className="text-muted-foreground font-bold text-sm">
              Nenhum método de pagamento cadastrado ainda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="rounded-3xl p-4 bg-card border flex items-center justify-between"
                style={{ borderLeftWidth: 6, borderLeftColor: pm.color }}
              >
                <div className="space-y-0.5">
                  <p className="font-extrabold text-sm flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: pm.color }}
                    />
                    {pm.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {PAYMENT_TYPE_LABELS[pm.type] || pm.type}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditPaymentMethod(pm)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePaymentMethod(pm)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-[#FF4B4B] hover:bg-red-50"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 3: CATEGORIAS FINANCEIRAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              🏷️ Categorias Financeiras
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Agrupamentos de receitas e despesas com subcategorias ilimitadas.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewCategory}
            className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Nova Categoria
          </button>
        </div>

        {mainCategories.length === 0 ? (
          <div className="rounded-3xl p-8 bg-card border text-center">
            <p className="text-muted-foreground font-bold">Nenhuma categoria criada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mainCategories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-3xl p-4 bg-card border"
                style={{ borderColor: cat.color + '40' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    {cat.icon}
                  </div>
                  <p className="font-extrabold text-sm flex-1">{cat.name}</p>
                  <button
                    type="button"
                    onClick={() => openEditCategory(cat)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-muted-foreground hover:text-[#FF4B4B] p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {subcategoriesByParent[cat.id]?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {subcategoriesByParent[cat.id].map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 pl-3 py-1.5 rounded-lg bg-muted/50"
                      >
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{sub.icon}</span>
                        <span className="font-bold text-xs flex-1">{sub.name}</span>
                        <button
                          type="button"
                          onClick={() => openEditCategory(sub)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(sub)}
                          className="text-muted-foreground hover:text-[#FF4B4B]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openNewSubcategory(cat)}
                  className="mt-2 w-full py-2 rounded-xl bg-muted/50 hover:bg-muted font-bold text-xs text-muted-foreground transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" strokeWidth={3} />
                  Subcategoria
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modais */}
      <FinanceCategoryModal
        open={catModalOpen}
        onOpenChange={setCatModalOpen}
        editingCategory={editingCategory}
        parentCategory={parentCategory}
      />

      <PaymentMethodModal
        open={pmModalOpen}
        onOpenChange={setPmModalOpen}
        editingMethod={editingPaymentMethod}
      />

      <BankAccountModal
        open={baModalOpen}
        onOpenChange={setBaModalOpen}
        editingAccount={editingBankAccount}
      />
    </div>
  )
}
