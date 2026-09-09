import { useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getMonthsAgoDate, getTodayDate, addMonthsClamped } from '@/lib/finance-utils'
import { toast } from 'sonner'

export interface PaymentMethod {
  id: string
  name: string
  type: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'boleto' | 'other'
  color: string
  createdAt: string
}

export interface BankAccount {
  id: string
  name: string
  accountType: 'checking' | 'savings' | 'wallet' | 'investment'
  initialBalance: number
  color: string
  createdAt: string
}

export type YieldFrequency = 'monthly' | 'weekly' | 'daily'
export type InvestmentTransactionKind = 'contribution' | 'withdrawal'

export interface InvestmentTransaction {
  id: string
  userId: string
  investmentId: string | null
  goalId: string | null
  kind: InvestmentTransactionKind
  amount: number
  date: string // ISO timestamptz
  notes: string | null
  createdAt: string
}

export interface InvestmentGoal {
  id: string
  name: string
  targetAmount: number
  initialAmount: number
  currentAmount: number // derivado: initialAmount + sum(contributions) - sum(withdrawals)
  deadline: string | null
  createdAt: string
}

export interface Investment {
  id: string
  name: string
  type: string // Ações, Fundos, CDB, Tesouro, Cripto, Imóveis, Outros
  initialAmount: number
  investedAmount: number // saldo aportado líquido (initial + aportes - retiradas)
  currentAmount: number // valor atual derivado
  yieldRate: number | null // ex: 10 para 10%
  yieldFrequency: YieldFrequency | null
  date: string
  bankAccountId: string | null
  goalId: string | null
  notes: string | null
  createdAt: string
}

export interface Transaction {
  id: string
  type: string
  amount: number
  category: string
  subcategory: string | null
  description: string | null
  date: string
  status: string
  isRecurring: boolean
  recurrencePeriod: string | null
  parentId: string | null
  isFixed: boolean
  isVirtual?: boolean
  isInstallment?: boolean
  installmentNumber?: number | null
  totalInstallments?: number | null
  paymentMethodId?: string | null
  bankAccountId?: string | null
}

export interface FinanceCategory {
  id: string
  name: string
  icon: string
  color: string
  parentId: string | null
  createdAt: string
}

export interface Password {
  id: string
  title: string
  username: string
  password: string
  url: string | null
  category: string
  createdAt: string
}

export interface FinanceDateRange {
  startDate: string
  endDate: string
}

export interface NewTransaction {
  type: string
  amount: number
  category: string
  subcategory?: string
  description?: string
  date: string
  status?: string
  isRecurring?: boolean
  recurrencePeriod?: string
  recurrenceMonths?: number
  isFixed?: boolean
  isInstallment?: boolean
  totalInstallments?: number
  installmentAmount?: number
  paymentMethodId?: string | null
  bankAccountId?: string | null
}

export interface NewPaymentMethod {
  name: string
  type: 'credit_card' | 'debit_card' | 'pix' | 'cash' | 'boleto' | 'other'
  color?: string
}

export interface NewBankAccount {
  name: string
  accountType: 'checking' | 'savings' | 'wallet' | 'investment'
  initialBalance: number
  color?: string
}

export interface NewInvestmentGoal {
  name: string
  targetAmount: number
  initialAmount?: number
  deadline?: string | null
}

export interface NewInvestment {
  name: string
  type: string
  initialAmount: number
  yieldRate?: number | null
  yieldFrequency?: YieldFrequency | null
  date: string
  bankAccountId?: string | null
  goalId?: string | null
  notes?: string
}

export interface NewInvestmentTransaction {
  investmentId?: string | null
  goalId?: string | null
  kind: InvestmentTransactionKind
  amount: number
  date?: string
  notes?: string
}

interface FinanceStoreState {
  transactions: Transaction[]
  passwords: Password[]
  financeCategories: FinanceCategory[]
  paymentMethods: PaymentMethod[]
  bankAccounts: BankAccount[]
  investments: Investment[]
  investmentGoals: InvestmentGoal[]
  investmentTransactions: InvestmentTransaction[]
  financeDateRange: FinanceDateRange
  // Fetchers
  fetchTransactions: () => Promise<void>
  fetchPasswords: () => Promise<void>
  fetchFinanceCategories: () => Promise<void>
  fetchPaymentMethods: () => Promise<void>
  fetchBankAccounts: () => Promise<void>
  fetchInvestments: () => Promise<void>
  fetchInvestmentGoals: () => Promise<void>
  fetchInvestmentTransactions: () => Promise<void>
  fetchAllFinanceData: () => Promise<void>
  // Investment Transactions (Aportes e Retiradas)
  addInvestmentTransaction: (tx: NewInvestmentTransaction) => Promise<void>
  deleteInvestmentTransaction: (id: string) => Promise<void>
  // Transactions
  addTransaction: (tx: NewTransaction) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  deleteInstallmentGroup: (parentId: string) => Promise<void>
  toggleTransactionStatus: (id: string) => Promise<void>
  setFinanceDateRange: (range: Partial<FinanceDateRange>) => void
  // Passwords
  addPassword: (pwd: {
    title: string
    username: string
    password: string
    url?: string
    category: string
  }) => Promise<void>
  deletePassword: (id: string) => Promise<void>
  // Categories
  addFinanceCategory: (cat: {
    name: string
    icon: string
    color: string
    parentId: string | null
  }) => Promise<void>
  updateFinanceCategory: (id: string, updates: Partial<FinanceCategory>) => Promise<void>
  deleteFinanceCategory: (id: string) => Promise<void>
  // Payment methods
  addPaymentMethod: (pm: NewPaymentMethod) => Promise<void>
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<void>
  deletePaymentMethod: (id: string) => Promise<void>
  // Bank accounts
  addBankAccount: (ba: NewBankAccount) => Promise<void>
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>
  deleteBankAccount: (id: string) => Promise<void>
  // Investments
  addInvestment: (inv: NewInvestment) => Promise<void>
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  // Investment Goals
  addInvestmentGoal: (goal: NewInvestmentGoal) => Promise<void>
  updateInvestmentGoal: (id: string, updates: Partial<InvestmentGoal>) => Promise<void>
  deleteInvestmentGoal: (id: string) => Promise<void>
}

type Listener = () => void
const listeners = new Set<Listener>()

function mapTransaction(data: Record<string, unknown>): Transaction {
  return {
    id: data.id as string,
    type: data.type as string,
    amount: Number(data.amount),
    category: data.category as string,
    subcategory: (data.subcategory as string) ?? null,
    description: (data.description as string) ?? null,
    date: (data.date as string).split('T')[0],
    status: data.status as string,
    isRecurring: (data.is_recurring as boolean) ?? false,
    recurrencePeriod: (data.recurrence_period as string) ?? null,
    parentId: (data.parent_id as string) ?? null,
    isFixed: (data.is_fixed as boolean) ?? false,
    isInstallment: (data.is_installment as boolean) ?? false,
    installmentNumber: data.installment_number != null ? Number(data.installment_number) : null,
    totalInstallments: data.total_installments != null ? Number(data.total_installments) : null,
    paymentMethodId: (data.payment_method_id as string) ?? null,
    bankAccountId: (data.bank_account_id as string) ?? null,
  }
}

function mapCategory(data: Record<string, unknown>): FinanceCategory {
  return {
    id: data.id as string,
    name: data.name as string,
    icon: data.icon as string,
    color: data.color as string,
    parentId: (data.parent_id as string) ?? null,
    createdAt: data.created_at as string,
  }
}

function mapPassword(data: Record<string, unknown>): Password {
  return {
    id: data.id as string,
    title: data.title as string,
    username: data.username as string,
    password: data.password as string,
    url: (data.url as string) ?? null,
    category: data.category as string,
    createdAt: data.created_at as string,
  }
}

function mapPaymentMethod(data: Record<string, unknown>): PaymentMethod {
  return {
    id: data.id as string,
    name: data.name as string,
    type: (data.type as any) || 'credit_card',
    color: (data.color as string) || '#1CB0F6',
    createdAt: data.created_at as string,
  }
}

function mapBankAccount(data: Record<string, unknown>): BankAccount {
  return {
    id: data.id as string,
    name: data.name as string,
    accountType: (data.account_type as any) || 'checking',
    initialBalance: Number(data.initial_balance || 0),
    color: (data.color as string) || '#58CC02',
    createdAt: data.created_at as string,
  }
}

function mapInvestmentTransaction(data: Record<string, unknown>): InvestmentTransaction {
  return {
    id: data.id as string,
    userId: (data.user_id as string) || '',
    investmentId: (data.investment_id as string) ?? null,
    goalId: (data.goal_id as string) ?? null,
    kind: data.kind as InvestmentTransactionKind,
    amount: Number(data.amount || 0),
    date: data.date as string,
    notes: (data.notes as string) ?? null,
    createdAt: data.created_at as string,
  }
}

function computeDerivedInvestment(inv: any, allTransactions: InvestmentTransaction[]): Investment {
  const id = inv.id as string
  const initial = Number(
    (inv.initial_amount !== undefined
      ? inv.initial_amount
      : inv.initialAmount !== undefined
        ? inv.initialAmount
        : inv.invested_amount !== undefined
          ? inv.invested_amount
          : inv.investedAmount) ?? 0,
  )
  const yieldRate =
    inv.yield_rate !== undefined
      ? inv.yield_rate != null
        ? Number(inv.yield_rate)
        : null
      : inv.yieldRate !== undefined
        ? inv.yieldRate != null
          ? Number(inv.yieldRate)
          : null
        : null
  const yieldFrequency =
    inv.yield_frequency !== undefined
      ? ((inv.yield_frequency as YieldFrequency | null) ?? null)
      : inv.yieldFrequency !== undefined
        ? ((inv.yieldFrequency as YieldFrequency | null) ?? null)
        : null

  const itemTxs = allTransactions.filter((tx) => tx.investmentId === id)
  const totalContributions = itemTxs
    .filter((tx) => tx.kind === 'contribution')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalWithdrawals = itemTxs
    .filter((tx) => tx.kind === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Saldo líquido atual = initial + aportes - retiradas (nunca negativo)
  const derivedAmount = Math.max(0, initial + totalContributions - totalWithdrawals)

  const dateVal =
    typeof inv.date === 'string' ? inv.date.split('T')[0] : new Date().toISOString().split('T')[0]
  const bankAccountId =
    inv.bank_account_id !== undefined
      ? (inv.bank_account_id as string | null)
      : (inv.bankAccountId ?? null)
  const goalId = inv.goal_id !== undefined ? (inv.goal_id as string | null) : (inv.goalId ?? null)
  const notes = inv.notes !== undefined ? (inv.notes as string | null) : null
  const createdAt = (inv.created_at as string) || inv.createdAt || new Date().toISOString()

  return {
    id,
    name: inv.name as string,
    type: (inv.type as string) || 'Outros',
    initialAmount: initial,
    investedAmount: derivedAmount,
    currentAmount: derivedAmount,
    yieldRate,
    yieldFrequency,
    date: dateVal,
    bankAccountId,
    goalId,
    notes,
    createdAt,
  }
}

function computeDerivedGoal(goal: any, allTransactions: InvestmentTransaction[]): InvestmentGoal {
  const id = goal.id as string
  const initial = Number(
    (goal.initial_amount !== undefined ? goal.initial_amount : goal.initialAmount) ?? 0,
  )
  const itemTxs = allTransactions.filter((tx) => tx.goalId === id)
  const totalContributions = itemTxs
    .filter((tx) => tx.kind === 'contribution')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalWithdrawals = itemTxs
    .filter((tx) => tx.kind === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const derivedAmount = Math.max(0, initial + totalContributions - totalWithdrawals)
  const target = Number(
    (goal.target_amount !== undefined ? goal.target_amount : goal.targetAmount) || 0,
  )
  const deadline = goal.deadline ? (goal.deadline as string).split('T')[0] : null
  const createdAt = (goal.created_at as string) || goal.createdAt || new Date().toISOString()

  return {
    id,
    name: goal.name as string,
    targetAmount: target,
    initialAmount: initial,
    currentAmount: derivedAmount,
    deadline,
    createdAt,
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function setState(partial: Partial<FinanceStoreState>) {
  state = { ...state, ...partial }
  emit()
}

function incrementMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

let state: FinanceStoreState = {
  transactions: [],
  passwords: [],
  financeCategories: [],
  paymentMethods: [],
  bankAccounts: [],
  investments: [],
  investmentGoals: [],
  investmentTransactions: [],
  financeDateRange: { startDate: getMonthsAgoDate(1), endDate: getTodayDate() },

  fetchTransactions: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
    if (data) {
      setState({ transactions: data.map(mapTransaction) })
    }
  },

  fetchPasswords: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('passwords')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) {
      setState({ passwords: data.map(mapPassword) })
    }
  },

  fetchFinanceCategories: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) {
      setState({ financeCategories: data.map(mapCategory) })
    }
  },

  fetchPaymentMethods: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase as any)
      .from('payment_methods')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (data) {
      setState({ paymentMethods: data.map(mapPaymentMethod) })
    }
  },

  fetchBankAccounts: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase as any)
      .from('bank_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (data) {
      setState({ bankAccounts: data.map(mapBankAccount) })
    }
  },

  fetchInvestmentTransactions: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase as any)
      .from('investment_transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
    if (data) {
      const txs = data.map(mapInvestmentTransaction)
      setState({
        investmentTransactions: txs,
        investments: state.investments.map((inv) => computeDerivedInvestment(inv, txs)),
        investmentGoals: state.investmentGoals.map((g) => computeDerivedGoal(g, txs)),
      })
    }
  },

  fetchInvestments: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase as any)
      .from('investments')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
    if (data) {
      setState({
        investments: data.map((d: any) =>
          computeDerivedInvestment(d, state.investmentTransactions),
        ),
      })
    }
  },

  fetchInvestmentGoals: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase as any)
      .from('investment_goals')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (data) {
      setState({
        investmentGoals: data.map((d: any) => computeDerivedGoal(d, state.investmentTransactions)),
      })
    }
  },

  fetchAllFinanceData: async () => {
    // Busca movimentações primeiro para derivar os saldos corretamente
    await state.fetchInvestmentTransactions()
    await Promise.all([
      state.fetchTransactions(),
      state.fetchPasswords(),
      state.fetchFinanceCategories(),
      state.fetchPaymentMethods(),
      state.fetchBankAccounts(),
      state.fetchInvestments(),
      state.fetchInvestmentGoals(),
    ])
  },

  // Aportes e Retiradas (Zero Lag, otimista com swap de tempId e recálculo síncrono do currentAmount)
  addInvestmentTransaction: async (tx: NewInvestmentTransaction) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const nowIso = tx.date ? new Date(tx.date).toISOString() : new Date().toISOString()
    const optimisticTx: InvestmentTransaction = {
      id: tempId,
      userId: session.user.id,
      investmentId: tx.investmentId || null,
      goalId: tx.goalId || null,
      kind: tx.kind,
      amount: tx.amount,
      date: nowIso,
      notes: tx.notes || null,
      createdAt: nowIso,
    }

    const nextTxs = [optimisticTx, ...state.investmentTransactions]
    // Recálculo síncrono dos saldos antes do await
    const nextInvestments = state.investments.map((inv) => computeDerivedInvestment(inv, nextTxs))
    const nextGoals = state.investmentGoals.map((g) => computeDerivedGoal(g, nextTxs))

    setState({
      investmentTransactions: nextTxs,
      investments: nextInvestments,
      investmentGoals: nextGoals,
    })

    // Persistir no Supabase
    const { data, error } = await (supabase as any)
      .from('investment_transactions')
      .insert({
        user_id: session.user.id,
        investment_id: tx.investmentId || null,
        goal_id: tx.goalId || null,
        kind: tx.kind,
        amount: tx.amount,
        date: nowIso,
        notes: tx.notes || null,
      })
      .select()
      .single()

    if (error || !data) {
      // Rollback silencioso com toast.error
      const rollbackTxs = state.investmentTransactions.filter((t) => t.id !== tempId)
      setState({
        investmentTransactions: rollbackTxs,
        investments: state.investments.map((inv) => computeDerivedInvestment(inv, rollbackTxs)),
        investmentGoals: state.investmentGoals.map((g) => computeDerivedGoal(g, rollbackTxs)),
      })
      toast.error('Erro ao registrar movimentação')
      return
    }

    // Atualizar no banco os campos current_amount / invested_amount da entidade para consistência server-side
    const realTx = mapInvestmentTransaction(data)
    const swappedTxs = state.investmentTransactions.map((t) => (t.id === tempId ? realTx : t))
    const recomputedInv = state.investments.map((inv) => computeDerivedInvestment(inv, swappedTxs))
    const recomputedGoals = state.investmentGoals.map((g) => computeDerivedGoal(g, swappedTxs))

    setState({
      investmentTransactions: swappedTxs,
      investments: recomputedInv,
      investmentGoals: recomputedGoals,
    })

    // Atualização em background no banco de dados para sincronizar current_amount (sem bloquear o cliente)
    if (tx.investmentId) {
      const targetInv = recomputedInv.find((i) => i.id === tx.investmentId)
      if (targetInv) {
        supabase
          .from('investments')
          .update({
            invested_amount: targetInv.investedAmount,
            current_amount: targetInv.currentAmount,
          } as any)
          .eq('id', tx.investmentId)
          .then()
      }
    }
    if (tx.goalId) {
      const targetGoal = recomputedGoals.find((g) => g.id === tx.goalId)
      if (targetGoal) {
        supabase
          .from('investment_goals')
          .update({
            current_amount: targetGoal.currentAmount,
          } as any)
          .eq('id', tx.goalId)
          .then()
      }
    }
  },

  deleteInvestmentTransaction: async (id: string) => {
    const prevTxs = state.investmentTransactions
    const targetTx = prevTxs.find((t) => t.id === id)
    if (!targetTx) return

    const nextTxs = prevTxs.filter((t) => t.id !== id)
    const nextInvestments = state.investments.map((inv) => computeDerivedInvestment(inv, nextTxs))
    const nextGoals = state.investmentGoals.map((g) => computeDerivedGoal(g, nextTxs))

    setState({
      investmentTransactions: nextTxs,
      investments: nextInvestments,
      investmentGoals: nextGoals,
    })

    const { error } = await (supabase as any).from('investment_transactions').delete().eq('id', id)

    if (error) {
      // Rollback
      setState({
        investmentTransactions: prevTxs,
        investments: state.investments.map((inv) => computeDerivedInvestment(inv, prevTxs)),
        investmentGoals: state.investmentGoals.map((g) => computeDerivedGoal(g, prevTxs)),
      })
      toast.error('Erro ao excluir movimentação')
      return
    }

    // Sincroniza current_amount no banco
    if (targetTx.investmentId) {
      const targetInv = nextInvestments.find((i) => i.id === targetTx.investmentId)
      if (targetInv) {
        supabase
          .from('investments')
          .update({
            invested_amount: targetInv.investedAmount,
            current_amount: targetInv.currentAmount,
          } as any)
          .eq('id', targetTx.investmentId)
          .then()
      }
    }
    if (targetTx.goalId) {
      const targetGoal = nextGoals.find((g) => g.id === targetTx.goalId)
      if (targetGoal) {
        supabase
          .from('investment_goals')
          .update({
            current_amount: targetGoal.currentAmount,
          } as any)
          .eq('id', targetTx.goalId)
          .then()
      }
    }
    toast.success('Movimentação removida do histórico! 🗑️')
  },

  addPassword: async (pwd: {
    title: string
    username: string
    password: string
    url?: string
    category: string
  }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await (supabase.from('passwords') as any)
      .insert({
        user_id: session.user.id,
        title: pwd.title,
        username: pwd.username,
        password: pwd.password,
        url: pwd.url || null,
        category: pwd.category,
      })
      .select()
      .single()

    if (data) {
      setState({ passwords: [mapPassword(data), ...state.passwords] })
    } else if (error) {
      toast.error('Erro ao salvar senha')
    }
  },

  deletePassword: async (id: string) => {
    const prev = state.passwords
    setState({ passwords: prev.filter((p) => p.id !== id) })
    const { error } = await supabase.from('passwords').delete().eq('id', id)
    if (error) {
      setState({ passwords: prev })
      toast.error('Erro ao remover senha')
    }
  },

  addTransaction: async (tx: NewTransaction) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    // CASO 1: PARCELAMENTO DE COMPRAS
    if (tx.isInstallment && (tx.totalInstallments || 0) > 1) {
      const n = Math.min(Math.max(tx.totalInstallments || 2, 2), 48)
      const perInstallmentAmount =
        tx.installmentAmount && tx.installmentAmount > 0
          ? tx.installmentAmount
          : Number((tx.amount / n).toFixed(2))

      const tempParentId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const tempIds: string[] = [tempParentId]

      // Lote otimista
      const optimisticBatch: Transaction[] = []
      // 1ª parcela (a "pai")
      optimisticBatch.push({
        id: tempParentId,
        type: tx.type,
        amount: perInstallmentAmount,
        category: tx.category,
        subcategory: tx.subcategory ?? null,
        description: tx.description ?? null,
        date: tx.date,
        status: tx.status ?? 'pending',
        isRecurring: false,
        recurrencePeriod: null,
        parentId: null,
        isFixed: tx.isFixed ?? false,
        isInstallment: true,
        installmentNumber: 1,
        totalInstallments: n,
        paymentMethodId: tx.paymentMethodId ?? null,
        bankAccountId: tx.bankAccountId ?? null,
      })

      // Parcelas subsequentes (2 até n) com status pending e datas clamped
      for (let i = 2; i <= n; i++) {
        const nextTempId = `temp-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`
        tempIds.push(nextTempId)
        optimisticBatch.push({
          id: nextTempId,
          type: tx.type,
          amount: perInstallmentAmount,
          category: tx.category,
          subcategory: tx.subcategory ?? null,
          description: tx.description ?? null,
          date: addMonthsClamped(tx.date, i - 1),
          status: 'pending',
          isRecurring: false,
          recurrencePeriod: null,
          parentId: tempParentId,
          isFixed: tx.isFixed ?? false,
          isInstallment: true,
          installmentNumber: i,
          totalInstallments: n,
          paymentMethodId: tx.paymentMethodId ?? null,
          bankAccountId: tx.bankAccountId ?? null,
        })
      }

      // Aplica otimisticamente
      setState({ transactions: [...optimisticBatch, ...state.transactions] })

      try {
        // 1. Inserir a parcela pai no Supabase
        const { data: parentData, error: parentError } = await (
          supabase.from('transactions') as any
        )
          .insert({
            user_id: session.user.id,
            type: tx.type,
            amount: perInstallmentAmount,
            category: tx.category,
            subcategory: tx.subcategory ?? null,
            description: tx.description ?? null,
            date: tx.date,
            status: tx.status ?? 'pending',
            is_recurring: false,
            recurrence_period: null,
            is_fixed: tx.isFixed ?? false,
            is_installment: true,
            installment_number: 1,
            total_installments: n,
            payment_method_id: tx.paymentMethodId || null,
            bank_account_id: tx.bankAccountId || null,
          })
          .select()
          .single()

        if (parentError || !parentData) {
          throw parentError || new Error('Falha ao criar primeira parcela')
        }

        const realParent = mapTransaction(parentData)

        // 2. Inserir as filhas referenciando parentData.id
        const childRecords: Record<string, unknown>[] = []
        for (let i = 2; i <= n; i++) {
          childRecords.push({
            user_id: session.user.id,
            type: tx.type,
            amount: perInstallmentAmount,
            category: tx.category,
            subcategory: tx.subcategory ?? null,
            description: tx.description ?? null,
            date: addMonthsClamped(tx.date, i - 1),
            status: 'pending',
            is_recurring: false,
            recurrence_period: null,
            parent_id: realParent.id,
            is_fixed: tx.isFixed ?? false,
            is_installment: true,
            installment_number: i,
            total_installments: n,
            payment_method_id: tx.paymentMethodId || null,
            bank_account_id: tx.bankAccountId || null,
          })
        }

        const { data: childrenData, error: childrenError } = await (
          supabase.from('transactions') as any
        )
          .insert(childRecords)
          .select()

        if (childrenError || !childrenData) {
          throw childrenError || new Error('Falha ao criar parcelas subsequentes')
        }

        const realChildren = childrenData.map(mapTransaction)
        const allReal = [realParent, ...realChildren]

        // Swap de tempIds por registros reais sem refetch
        setState({
          transactions: state.transactions.map((t) => {
            const idx = tempIds.indexOf(t.id)
            return idx >= 0 ? allReal[idx] : t
          }),
        })
      } catch (err) {
        // Rollback silencioso com toast.error
        setState({ transactions: state.transactions.filter((t) => !tempIds.includes(t.id)) })
        toast.error('Erro ao salvar parcelamento')
      }
      return
    }

    // CASO 2: RECORRÊNCIA EXISTENTE OU TRANSAÇÃO SIMPLES
    const months = tx.isRecurring ? Math.min(tx.recurrenceMonths || 1, 12) : 1
    const records: Record<string, unknown>[] = []
    let currentDate = tx.date

    for (let i = 0; i < months; i++) {
      records.push({
        user_id: session.user.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        subcategory: tx.subcategory ?? null,
        description: tx.description ?? null,
        date: currentDate,
        status: tx.status ?? 'pending',
        is_recurring: tx.isRecurring ?? false,
        recurrence_period: tx.recurrencePeriod ?? null,
        is_fixed: tx.isFixed ?? false,
        is_installment: false,
        payment_method_id: tx.paymentMethodId || null,
        bank_account_id: tx.bankAccountId || null,
      })
      if (tx.isRecurring) {
        currentDate = incrementMonth(currentDate)
      }
    }

    const tempIds: string[] = []
    const optimisticTx: Transaction[] = records.map((r) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      tempIds.push(tempId)
      return {
        id: tempId,
        type: r.type as string,
        amount: r.amount as number,
        category: r.category as string,
        subcategory: (r.subcategory as string) ?? null,
        description: (r.description as string) ?? null,
        date: r.date as string,
        status: r.status as string,
        isRecurring: r.is_recurring as boolean,
        recurrencePeriod: (r.recurrence_period as string) ?? null,
        parentId: null,
        isFixed: r.is_fixed as boolean,
        isInstallment: false,
        installmentNumber: null,
        totalInstallments: null,
        paymentMethodId: (r.payment_method_id as string) ?? null,
        bankAccountId: (r.bank_account_id as string) ?? null,
      }
    })

    setState({ transactions: [...optimisticTx, ...state.transactions] })

    const { data, error } = await (supabase as any).from('transactions').insert(records).select()

    if (error || !data) {
      setState({ transactions: state.transactions.filter((t) => !tempIds.includes(t.id)) })
      toast.error('Erro ao adicionar transação')
      return
    }

    const realTxs = data.map(mapTransaction)
    setState({
      transactions: state.transactions.map((t) => {
        const idx = tempIds.indexOf(t.id)
        return idx >= 0 ? realTxs[idx] : t
      }),
    })
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    const prev = state.transactions
    setState({
      transactions: prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })

    const dbUpdates: Record<string, unknown> = {}
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring
    if (updates.recurrencePeriod !== undefined)
      dbUpdates.recurrence_period = updates.recurrencePeriod
    if (updates.isFixed !== undefined) dbUpdates.is_fixed = updates.isFixed
    if (updates.paymentMethodId !== undefined) dbUpdates.payment_method_id = updates.paymentMethodId
    if (updates.bankAccountId !== undefined) dbUpdates.bank_account_id = updates.bankAccountId
    if (updates.isInstallment !== undefined) dbUpdates.is_installment = updates.isInstallment
    if (updates.installmentNumber !== undefined)
      dbUpdates.installment_number = updates.installmentNumber
    if (updates.totalInstallments !== undefined)
      dbUpdates.total_installments = updates.totalInstallments

    const { error } = await (supabase as any).from('transactions').update(dbUpdates).eq('id', id)

    if (error) {
      setState({ transactions: prev })
      toast.error('Erro ao atualizar transação')
    }
  },

  deleteTransaction: async (id: string) => {
    const prev = state.transactions
    setState({ transactions: prev.filter((t) => t.id !== id) })
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      setState({ transactions: prev })
      toast.error('Erro ao excluir transação')
    }
  },

  deleteInstallmentGroup: async (groupRootId: string) => {
    const prev = state.transactions
    // Exclui a raiz e todas as filhas que têm parent_id = groupRootId
    setState({
      transactions: prev.filter((t) => t.id !== groupRootId && t.parentId !== groupRootId),
    })

    const { error } = await supabase
      .from('transactions')
      .delete()
      .or(`id.eq.${groupRootId},parent_id.eq.${groupRootId}`)

    if (error) {
      setState({ transactions: prev })
      toast.error('Erro ao excluir grupo de parcelas')
    } else {
      toast.success('Todas as parcelas foram excluídas! 🗑️')
    }
  },

  toggleTransactionStatus: async (id: string) => {
    const tx = state.transactions.find((t) => t.id === id)
    if (!tx) return
    const newStatus = tx.status === 'paid' ? 'pending' : 'paid'
    const prev = state.transactions
    setState({
      transactions: prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    })
    const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', id)
    if (error) {
      setState({ transactions: prev })
      toast.error('Erro ao atualizar status')
    }
  },

  setFinanceDateRange: (range: Partial<FinanceDateRange>) => {
    setState({
      financeDateRange: { ...state.financeDateRange, ...range },
    })
  },

  addFinanceCategory: async (cat: {
    name: string
    icon: string
    color: string
    parentId: string | null
  }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('finance_categories')
      .insert({
        user_id: session.user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        parent_id: cat.parentId,
      })
      .select()
      .single()

    if (data) {
      setState({ financeCategories: [...state.financeCategories, mapCategory(data)] })
    } else if (error) {
      toast.error('Erro ao criar categoria')
    }
  },

  updateFinanceCategory: async (id: string, updates: Partial<FinanceCategory>) => {
    const prev = state.financeCategories
    setState({
      financeCategories: prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })

    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId

    const { error } = await (supabase.from('finance_categories') as any)
      .update(dbUpdates)
      .eq('id', id)

    if (error) {
      setState({ financeCategories: prev })
      toast.error('Erro ao atualizar categoria')
    }
  },

  deleteFinanceCategory: async (id: string) => {
    const prev = state.financeCategories
    setState({ financeCategories: prev.filter((c) => c.id !== id) })
    const { error } = await supabase.from('finance_categories').delete().eq('id', id)
    if (error) {
      setState({ financeCategories: prev })
      toast.error('Erro ao remover categoria')
    }
  },

  // CRUD Métodos de Pagamento (otimista)
  addPaymentMethod: async (pm: NewPaymentMethod) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const optimistic: PaymentMethod = {
      id: tempId,
      name: pm.name,
      type: pm.type,
      color: pm.color || '#1CB0F6',
      createdAt: new Date().toISOString(),
    }

    setState({ paymentMethods: [...state.paymentMethods, optimistic] })

    const { data, error } = await (supabase as any)
      .from('payment_methods')
      .insert({
        user_id: session.user.id,
        name: pm.name,
        type: pm.type,
        color: pm.color || '#1CB0F6',
      })
      .select()
      .single()

    if (error || !data) {
      setState({ paymentMethods: state.paymentMethods.filter((p) => p.id !== tempId) })
      toast.error('Erro ao adicionar método de pagamento')
      return
    }

    const real = mapPaymentMethod(data)
    setState({
      paymentMethods: state.paymentMethods.map((p) => (p.id === tempId ? real : p)),
    })
  },

  updatePaymentMethod: async (id: string, updates: Partial<PaymentMethod>) => {
    const prev = state.paymentMethods
    setState({
      paymentMethods: prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })

    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.color !== undefined) dbUpdates.color = updates.color

    const { error } = await (supabase as any).from('payment_methods').update(dbUpdates).eq('id', id)

    if (error) {
      setState({ paymentMethods: prev })
      toast.error('Erro ao atualizar método de pagamento')
    }
  },

  deletePaymentMethod: async (id: string) => {
    const prev = state.paymentMethods
    setState({ paymentMethods: prev.filter((p) => p.id !== id) })
    const { error } = await (supabase as any).from('payment_methods').delete().eq('id', id)
    if (error) {
      setState({ paymentMethods: prev })
      toast.error('Erro ao remover método de pagamento')
    }
  },

  // CRUD Contas Bancárias (otimista)
  addBankAccount: async (ba: NewBankAccount) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const optimistic: BankAccount = {
      id: tempId,
      name: ba.name,
      accountType: ba.accountType,
      initialBalance: Number(ba.initialBalance || 0),
      color: ba.color || '#58CC02',
      createdAt: new Date().toISOString(),
    }

    setState({ bankAccounts: [...state.bankAccounts, optimistic] })

    const { data, error } = await (supabase as any)
      .from('bank_accounts')
      .insert({
        user_id: session.user.id,
        name: ba.name,
        account_type: ba.accountType,
        initial_balance: ba.initialBalance,
        color: ba.color || '#58CC02',
      })
      .select()
      .single()

    if (error || !data) {
      setState({ bankAccounts: state.bankAccounts.filter((b) => b.id !== tempId) })
      toast.error('Erro ao adicionar conta bancária')
      return
    }

    const real = mapBankAccount(data)
    setState({
      bankAccounts: state.bankAccounts.map((b) => (b.id === tempId ? real : b)),
    })
  },

  updateBankAccount: async (id: string, updates: Partial<BankAccount>) => {
    const prev = state.bankAccounts
    setState({
      bankAccounts: prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })

    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.accountType !== undefined) dbUpdates.account_type = updates.accountType
    if (updates.initialBalance !== undefined) dbUpdates.initial_balance = updates.initialBalance
    if (updates.color !== undefined) dbUpdates.color = updates.color

    const { error } = await (supabase as any).from('bank_accounts').update(dbUpdates).eq('id', id)

    if (error) {
      setState({ bankAccounts: prev })
      toast.error('Erro ao atualizar conta bancária')
    }
  },

  deleteBankAccount: async (id: string) => {
    const prev = state.bankAccounts
    setState({ bankAccounts: prev.filter((b) => b.id !== id) })
    const { error } = await (supabase as any).from('bank_accounts').delete().eq('id', id)
    if (error) {
      setState({ bankAccounts: prev })
      toast.error('Erro ao remover conta bancária')
    }
  },

  // CRUD Investimentos (otimista)
  addInvestment: async (inv: NewInvestment) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const initial = Number(inv.initialAmount || 0)
    const optimistic: Investment = {
      id: tempId,
      name: inv.name,
      type: inv.type,
      initialAmount: initial,
      investedAmount: initial,
      currentAmount: initial,
      yieldRate: inv.yieldRate != null ? Number(inv.yieldRate) : null,
      yieldFrequency: inv.yieldFrequency || null,
      date: inv.date,
      bankAccountId: inv.bankAccountId || null,
      goalId: inv.goalId || null,
      notes: inv.notes || null,
      createdAt: new Date().toISOString(),
    }

    setState({ investments: [optimistic, ...state.investments] })

    const { data, error } = await (supabase as any)
      .from('investments')
      .insert({
        user_id: session.user.id,
        name: inv.name,
        type: inv.type,
        initial_amount: initial,
        invested_amount: initial,
        current_amount: initial,
        yield_rate: inv.yieldRate != null ? Number(inv.yieldRate) : null,
        yield_frequency: inv.yieldFrequency || null,
        date: inv.date,
        bank_account_id: inv.bankAccountId || null,
        goal_id: inv.goalId || null,
        notes: inv.notes || null,
      })
      .select()
      .single()

    if (error || !data) {
      setState({ investments: state.investments.filter((i) => i.id !== tempId) })
      toast.error('Erro ao registrar investimento')
      return
    }

    const real = computeDerivedInvestment(data, state.investmentTransactions)
    setState({
      investments: state.investments.map((i) => (i.id === tempId ? real : i)),
    })
  },

  updateInvestment: async (id: string, updates: Partial<Investment>) => {
    const prev = state.investments
    const target = prev.find((i) => i.id === id)
    if (!target) return

    const updatedItem = { ...target, ...updates }
    const derived = computeDerivedInvestment(updatedItem, state.investmentTransactions)

    setState({
      investments: prev.map((i) => (i.id === id ? derived : i)),
    })

    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.initialAmount !== undefined) {
      dbUpdates.initial_amount = updates.initialAmount
      dbUpdates.invested_amount = derived.investedAmount
      dbUpdates.current_amount = derived.currentAmount
    }
    if (updates.yieldRate !== undefined) dbUpdates.yield_rate = updates.yieldRate
    if (updates.yieldFrequency !== undefined) dbUpdates.yield_frequency = updates.yieldFrequency
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.bankAccountId !== undefined) dbUpdates.bank_account_id = updates.bankAccountId
    if (updates.goalId !== undefined) dbUpdates.goal_id = updates.goalId
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes

    const { error } = await (supabase as any).from('investments').update(dbUpdates).eq('id', id)

    if (error) {
      setState({ investments: prev })
      toast.error('Erro ao atualizar investimento')
    }
  },

  deleteInvestment: async (id: string) => {
    const prev = state.investments
    setState({ investments: prev.filter((i) => i.id !== id) })
    const { error } = await (supabase as any).from('investments').delete().eq('id', id)
    if (error) {
      setState({ investments: prev })
      toast.error('Erro ao remover investimento')
    }
  },

  // CRUD Metas de Investimento (otimista)
  addInvestmentGoal: async (goal: NewInvestmentGoal) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const initial = Number(goal.initialAmount || 0)
    const optimistic: InvestmentGoal = {
      id: tempId,
      name: goal.name,
      targetAmount: Number(goal.targetAmount),
      initialAmount: initial,
      currentAmount: initial,
      deadline: goal.deadline || null,
      createdAt: new Date().toISOString(),
    }

    setState({ investmentGoals: [...state.investmentGoals, optimistic] })

    const { data, error } = await (supabase as any)
      .from('investment_goals')
      .insert({
        user_id: session.user.id,
        name: goal.name,
        target_amount: goal.targetAmount,
        initial_amount: initial,
        current_amount: initial,
        deadline: goal.deadline || null,
      })
      .select()
      .single()

    if (error || !data) {
      setState({ investmentGoals: state.investmentGoals.filter((g) => g.id !== tempId) })
      toast.error('Erro ao registrar meta de investimento')
      return
    }

    const real = computeDerivedGoal(data, state.investmentTransactions)
    setState({
      investmentGoals: state.investmentGoals.map((g) => (g.id === tempId ? real : g)),
    })
  },

  updateInvestmentGoal: async (id: string, updates: Partial<InvestmentGoal>) => {
    const prev = state.investmentGoals
    const target = prev.find((g) => g.id === id)
    if (!target) return

    const updatedItem = { ...target, ...updates }
    const derived = computeDerivedGoal(updatedItem, state.investmentTransactions)

    setState({
      investmentGoals: prev.map((g) => (g.id === id ? derived : g)),
    })

    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount
    if (updates.initialAmount !== undefined) {
      dbUpdates.initial_amount = updates.initialAmount
      dbUpdates.current_amount = derived.currentAmount
    }
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline

    const { error } = await (supabase as any)
      .from('investment_goals')
      .update(dbUpdates)
      .eq('id', id)

    if (error) {
      setState({ investmentGoals: prev })
      toast.error('Erro ao atualizar meta de investimento')
    }
  },

  deleteInvestmentGoal: async (id: string) => {
    const prev = state.investmentGoals
    setState({ investmentGoals: prev.filter((g) => g.id !== id) })
    const { error } = await (supabase as any).from('investment_goals').delete().eq('id', id)
    if (error) {
      setState({ investmentGoals: prev })
      toast.error('Erro ao remover meta de investimento')
    }
  },
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useFinanceStore<U>(selector: (s: FinanceStoreState) => U): U {
  return useSyncExternalStore(subscribe, () => selector(state))
}
