import { useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getMonthsAgoDate, getTodayDate } from '@/lib/finance-utils'
import { toast } from 'sonner'

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
  isVirtual?: boolean
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
}

interface FinanceStoreState {
  transactions: Transaction[]
  passwords: Password[]
  financeCategories: FinanceCategory[]
  financeDateRange: FinanceDateRange
  fetchTransactions: () => Promise<void>
  fetchPasswords: () => Promise<void>
  fetchFinanceCategories: () => Promise<void>
  addTransaction: (tx: NewTransaction) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  toggleTransactionStatus: (id: string) => Promise<void>
  setFinanceDateRange: (range: Partial<FinanceDateRange>) => void
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

function emit() {
  listeners.forEach((l) => l())
}

function setState(partial: Partial<FinanceStoreState>) {
  state = { ...state, ...partial }
  emit()
}

let state: FinanceStoreState = {
  transactions: [],
  passwords: [],
  financeCategories: [],
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

  addTransaction: async (tx: NewTransaction) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: Transaction = {
      id: tempId,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      subcategory: tx.subcategory ?? null,
      description: tx.description ?? null,
      date: tx.date,
      status: tx.status ?? 'pending',
      isRecurring: tx.isRecurring ?? false,
      recurrencePeriod: tx.recurrencePeriod ?? null,
      parentId: null,
    }
    setState({ transactions: [...state.transactions, optimistic] })

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        subcategory: tx.subcategory ?? null,
        description: tx.description ?? null,
        date: tx.date,
        status: tx.status ?? 'pending',
        is_recurring: tx.isRecurring ?? false,
        recurrence_period: tx.recurrencePeriod ?? null,
      })
      .select()
      .single()

    if (error || !data) {
      setState({ transactions: state.transactions.filter((t) => t.id !== tempId) })
      toast.error('Erro ao adicionar transação')
      return
    }

    const real = mapTransaction(data)
    setState({
      transactions: state.transactions.map((t) => (t.id === tempId ? real : t)),
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

    const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id)

    if (error) {
      setState({ transactions: prev })
      toast.error('Erro ao atualizar transação')
    }
  },

  deleteTransaction: async (id: string) => {
    const prev = state.transactions
    setState({ transactions: prev.filter((t) => t.id !== id) })
    await supabase.from('transactions').delete().eq('id', id)
  },

  toggleTransactionStatus: async (id: string) => {
    const tx = state.transactions.find((t) => t.id === id)
    if (!tx) return
    const newStatus = tx.status === 'paid' ? 'pending' : 'paid'
    const prev = state.transactions
    setState({
      transactions: prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    })
    await supabase.from('transactions').update({ status: newStatus }).eq('id', id)
  },

  setFinanceDateRange: (range: Partial<FinanceDateRange>) => {
    setState({
      financeDateRange: { ...state.financeDateRange, ...range },
    })
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
