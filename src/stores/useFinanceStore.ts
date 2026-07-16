import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export type Transaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  subcategory?: string
  description: string
  date: string
  status: 'paid' | 'pending'
}

export type FinanceCategory = {
  id: string
  name: string
  parentId: string | null
  icon: string
  color: string
}

export type PasswordEntry = {
  id: string
  title: string
  username: string
  password: string
  url: string
  category: string
}

export type FinanceDateRange = { startDate: string; endDate: string }

const genId = () => Math.random().toString(36).substring(2, 9)
const todayStr = () => new Date().toISOString().split('T')[0]

const initialTransactions: Transaction[] = [
  {
    id: 'tr1',
    type: 'income',
    amount: 5000,
    category: '💰 Salário',
    description: 'Salário mensal',
    date: todayStr(),
    status: 'paid',
  },
  {
    id: 'tr2',
    type: 'expense',
    amount: 1200,
    category: '🏠 Casa',
    description: 'Aluguel',
    date: todayStr(),
    status: 'paid',
  },
  {
    id: 'tr3',
    type: 'expense',
    amount: 450,
    category: '🍔 Alimentação',
    description: 'Supermercado',
    date: todayStr(),
    status: 'pending',
  },
  {
    id: 'tr4',
    type: 'expense',
    amount: 200,
    category: '🚗 Transporte',
    description: 'Combustível',
    date: todayStr(),
    status: 'pending',
  },
  {
    id: 'tr5',
    type: 'income',
    amount: 800,
    category: '💼 Freelance',
    description: 'Projeto extra',
    date: todayStr(),
    status: 'pending',
  },
  {
    id: 'tr6',
    type: 'expense',
    amount: 89.9,
    category: '📺 Streaming',
    description: 'Netflix + Spotify',
    date: todayStr(),
    status: 'paid',
  },
  {
    id: 'tr7',
    type: 'expense',
    amount: 150,
    category: '🎮 Lazer',
    description: 'Cinema e jantar',
    date: todayStr(),
    status: 'pending',
  },
]

const initialFinanceCategories: FinanceCategory[] = [
  { id: 'fc1', name: 'Casa', parentId: null, icon: '🏠', color: '#1CB0F6' },
  { id: 'fc2', name: 'Alimentação', parentId: null, icon: '🍔', color: '#FF9600' },
  { id: 'fc3', name: 'Transporte', parentId: null, icon: '🚗', color: '#82D936' },
  { id: 'fc4', name: 'Salário', parentId: null, icon: '💰', color: '#58CC02' },
  { id: 'fc5', name: 'Freelance', parentId: null, icon: '💼', color: '#CE82FF' },
  { id: 'fc6', name: 'Streaming', parentId: null, icon: '📺', color: '#FF4B4B' },
  { id: 'fc7', name: 'Academia', parentId: null, icon: '🏋️', color: '#FFC800' },
  { id: 'fc8', name: 'Saúde', parentId: null, icon: '💊', color: '#FF4B4B' },
  { id: 'fc9', name: 'Educação', parentId: null, icon: '📚', color: '#1CB0F6' },
  { id: 'fc10', name: 'Lazer', parentId: null, icon: '🎮', color: '#CE82FF' },
  { id: 'fc11', name: 'Compras', parentId: null, icon: '🛒', color: '#FF9600' },
  { id: 'fc12', name: 'Outros', parentId: null, icon: '📦', color: '#AFAFAF' },
]

function getDefaultDateRange(): FinanceDateRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { startDate: start.toISOString().split('T')[0], endDate: now.toISOString().split('T')[0] }
}

interface FinanceState {
  transactions: Transaction[]
  financeCategories: FinanceCategory[]
  passwords: PasswordEntry[]
  financeDateRange: FinanceDateRange
  setFinanceDateRange: (range: Partial<FinanceDateRange>) => void
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  toggleTransactionStatus: (id: string) => void
  fetchTransactions: () => Promise<void>
  addPassword: (p: Omit<PasswordEntry, 'id'>) => void
  updatePassword: (id: string, updates: Partial<PasswordEntry>) => void
  deletePassword: (id: string) => void
  fetchPasswords: () => Promise<void>
  addFinanceCategory: (c: Omit<FinanceCategory, 'id'>) => void
  updateFinanceCategory: (id: string, updates: Partial<FinanceCategory>) => void
  deleteFinanceCategory: (id: string) => void
  fetchFinanceCategories: () => Promise<void>
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: initialTransactions,
      financeCategories: initialFinanceCategories,
      passwords: [],
      financeDateRange: getDefaultDateRange(),

      setFinanceDateRange: (range) =>
        set((s) => ({ financeDateRange: { ...s.financeDateRange, ...range } })),

      addTransaction: (t) => {
        const tempId = genId()
        set((s) => ({ transactions: [{ ...t, id: tempId }, ...s.transactions] }))
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user)
            return supabase
              .from('transactions')
              .insert({
                type: t.type,
                amount: t.amount,
                category: t.category,
                subcategory: t.subcategory || null,
                description: t.description,
                date: t.date,
                status: t.status,
                user_id: user.id,
              })
              .then(({ error }) => {
                if (error) {
                  set((s) => ({ transactions: s.transactions.filter((tr) => tr.id !== tempId) }))
                  toast.error('Erro ao salvar transação. Tente novamente.')
                } else {
                  get().fetchTransactions()
                }
              })
        })
      },

      updateTransaction: (id, updates) => {
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
        const dbUpdates: Record<string, any> = {}
        if (updates.type !== undefined) dbUpdates.type = updates.type
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount
        if (updates.category !== undefined) dbUpdates.category = updates.category
        if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory
        if (updates.description !== undefined) dbUpdates.description = updates.description
        if (updates.date !== undefined) dbUpdates.date = updates.date
        if (updates.status !== undefined) dbUpdates.status = updates.status
        supabase.from('transactions').update(dbUpdates).eq('id', id).then()
      },

      deleteTransaction: (id) => {
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
        supabase.from('transactions').delete().eq('id', id).then()
      },

      toggleTransactionStatus: (id) => {
        const tx = get().transactions.find((t) => t.id === id)
        if (!tx) return
        const newStatus = tx.status === 'paid' ? 'pending' : 'paid'
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
        }))
        supabase.from('transactions').update({ status: newStatus }).eq('id', id).then()
      },

      fetchTransactions: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
        if (data)
          set({
            transactions: data.map((d: any) => ({
              id: d.id,
              type: d.type,
              amount: parseFloat(d.amount) || 0,
              category: d.category,
              description: d.description || '',
              subcategory: d.subcategory || '',
              date: (d.date || '').split('T')[0],
              status: d.status || 'pending',
            })),
          })
      },

      addPassword: (p) => {
        const tempId = genId()
        set((s) => ({ passwords: [{ ...p, id: tempId }, ...s.passwords] }))
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user)
            return supabase
              .from('passwords')
              .insert({
                title: p.title,
                username: p.username,
                password: p.password,
                url: p.url,
                category: p.category,
                user_id: user.id,
              })
              .then(({ error }) => {
                if (error) {
                  set((s) => ({ passwords: s.passwords.filter((pw) => pw.id !== tempId) }))
                  toast.error('Erro ao salvar senha. Tente novamente.')
                } else {
                  get().fetchPasswords()
                }
              })
        })
      },

      updatePassword: (id, updates) => {
        set((s) => ({
          passwords: s.passwords.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
        const dbUpdates: Record<string, any> = {}
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.username !== undefined) dbUpdates.username = updates.username
        if (updates.password !== undefined) dbUpdates.password = updates.password
        if (updates.url !== undefined) dbUpdates.url = updates.url
        if (updates.category !== undefined) dbUpdates.category = updates.category
        supabase.from('passwords').update(dbUpdates).eq('id', id).then()
      },

      deletePassword: (id) => {
        set((s) => ({ passwords: s.passwords.filter((p) => p.id !== id) }))
        supabase.from('passwords').delete().eq('id', id).then()
      },

      fetchPasswords: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('passwords')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (data)
          set({
            passwords: data.map((d: any) => ({
              id: d.id,
              title: d.title || '',
              username: d.username || '',
              password: d.password || '',
              url: d.url || '',
              category: d.category || 'other',
            })),
          })
      },

      addFinanceCategory: (c) => {
        const tempId = genId()
        set((s) => ({ financeCategories: [...s.financeCategories, { ...c, id: tempId }] }))
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user)
            return supabase
              .from('finance_categories')
              .insert({
                name: c.name,
                parent_id: c.parentId,
                icon: c.icon,
                color: c.color,
                user_id: user.id,
              })
              .then(({ error }) => {
                if (error) {
                  set((s) => ({
                    financeCategories: s.financeCategories.filter((fc) => fc.id !== tempId),
                  }))
                  toast.error('Erro ao salvar categoria. Tente novamente.')
                } else {
                  get().fetchFinanceCategories()
                }
              })
        })
      },

      updateFinanceCategory: (id, updates) => {
        set((s) => ({
          financeCategories: s.financeCategories.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }))
        const dbUpdates: Record<string, any> = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon
        if (updates.color !== undefined) dbUpdates.color = updates.color
        supabase.from('finance_categories').update(dbUpdates).eq('id', id).then()
      },

      deleteFinanceCategory: (id) => {
        set((s) => ({
          financeCategories: s.financeCategories.filter((c) => c.id !== id && c.parentId !== id),
        }))
        supabase.from('finance_categories').delete().eq('id', id).then()
      },

      fetchFinanceCategories: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('finance_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
        if (data)
          set({
            financeCategories: data.map((d: any) => ({
              id: d.id,
              name: d.name || '',
              parentId: d.parent_id || null,
              icon: d.icon || '📦',
              color: d.color || '#1CB0F6',
            })),
          })
      },
    }),
    {
      name: 'vt-finance-storage',
      partialize: (s) => ({
        financeDateRange: s.financeDateRange,
      }),
    },
  ),
)
