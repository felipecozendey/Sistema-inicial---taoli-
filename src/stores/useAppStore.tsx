import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Category = { id: string; name: string; color: string }
export type Priority = 'low' | 'medium' | 'high'
export type Task = {
  id: string
  title: string
  date: string
  categoryId: string
  priority: Priority
  completed: boolean
  isRoutine: boolean
  streak?: number
}

export type User = {
  name: string
  avatar: string
  dailyGoal: number
}

type AppState = {
  user: User
  categories: Category[]
  tasks: Task[]
  updateUser: (u: Partial<User>) => void
  addTask: (t: Omit<Task, 'id' | 'completed'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
}

const AppStoreContext = createContext<AppState | undefined>(undefined)

const initialCategories: Category[] = [
  { id: '1', name: 'Saúde', color: '#10b981' },
  { id: '2', name: 'Trabalho', color: '#3b82f6' },
  { id: '3', name: 'Estudo', color: '#8b5cf6' },
  { id: '4', name: 'Lazer', color: '#f59e0b' },
]

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(() => {
    const s = localStorage.getItem('zb_user')
    return s ? JSON.parse(s) : { name: 'Viajante', avatar: '', dailyGoal: 5 }
  })

  const [categories] = useState<Category[]>(initialCategories)

  const [tasks, setTasks] = useState<Task[]>(() => {
    const s = localStorage.getItem('zb_tasks')
    const today = new Date().toISOString().split('T')[0]
    return s
      ? JSON.parse(s)
      : [
          {
            id: '1',
            title: 'Meditação Matinal (10 min)',
            date: today,
            categoryId: '1',
            priority: 'medium',
            completed: false,
            isRoutine: true,
            streak: 5,
          },
          {
            id: '2',
            title: 'Avançar no Projeto Principal',
            date: today,
            categoryId: '2',
            priority: 'high',
            completed: false,
            isRoutine: false,
          },
          {
            id: '3',
            title: 'Ler documentação',
            date: today,
            categoryId: '3',
            priority: 'low',
            completed: true,
            isRoutine: true,
            streak: 12,
          },
        ]
  })

  useEffect(() => {
    localStorage.setItem('zb_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    localStorage.setItem('zb_tasks', JSON.stringify(tasks))
  }, [tasks])

  const updateUser = (u: Partial<User>) => setUser((p) => ({ ...p, ...u }))
  const addTask = (t: Omit<Task, 'id' | 'completed'>) =>
    setTasks((p) => [...p, { ...t, id: Math.random().toString(36).substring(7), completed: false }])
  const toggleTask = (id: string) =>
    setTasks((p) =>
      p.map((t) => {
        if (t.id === id) {
          const isCompletedNow = !t.completed
          return {
            ...t,
            completed: isCompletedNow,
            streak: t.isRoutine
              ? isCompletedNow
                ? (t.streak || 0) + 1
                : Math.max(0, (t.streak || 1) - 1)
              : undefined,
          }
        }
        return t
      }),
    )
  const deleteTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id))

  return (
    <AppStoreContext.Provider
      value={{ user, categories, tasks, updateUser, addTask, toggleTask, deleteTask }}
    >
      {children}
    </AppStoreContext.Provider>
  )
}

export const useAppStore = () => {
  const context = useContext(AppStoreContext)
  if (!context) throw new Error('useAppStore must be used within AppStoreProvider')
  return context
}
