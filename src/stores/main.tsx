import React, { createContext, useContext, useEffect, useState } from 'react'

export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  categoryId: string
  priority: Priority
  completed: boolean
  date: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface User {
  name: string
  dailyGoal: number
}

interface AppState {
  user: User
  tasks: Task[]
  categories: Category[]
}

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, 'id'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateUser: (user: Partial<User>) => void
}

const defaultCategories: Category[] = [
  {
    id: '1',
    name: 'Saúde',
    color: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    id: '2',
    name: 'Trabalho',
    color: 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  {
    id: '3',
    name: 'Estudo',
    color: 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  },
  {
    id: '4',
    name: 'Lazer',
    color: 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
]

const getTodayDateString = () => new Date().toISOString().split('T')[0]

const defaultTasks: Task[] = [
  {
    id: 't1',
    title: 'Meditação matinal (15 min)',
    categoryId: '1',
    priority: 'medium',
    completed: false,
    date: getTodayDateString(),
  },
  {
    id: 't2',
    title: 'Revisar PRs do projeto',
    categoryId: '2',
    priority: 'high',
    completed: true,
    date: getTodayDateString(),
  },
  {
    id: 't3',
    title: 'Ler 20 páginas',
    categoryId: '3',
    priority: 'low',
    completed: false,
    date: getTodayDateString(),
  },
]

const initialState: AppState = {
  user: { name: 'Visitante', dailyGoal: 5 },
  tasks: defaultTasks,
  categories: defaultCategories,
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('zenith_bloom_data')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return initialState
      }
    }
    return initialState
  })

  useEffect(() => {
    localStorage.setItem('zenith_bloom_data', JSON.stringify(state))
  }, [state])

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask = { ...taskData, id: Math.random().toString(36).substring(2, 9) }
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }))
  }

  const toggleTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }))
  }

  const deleteTask = (id: string) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
  }

  const updateUser = (userData: Partial<User>) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, ...userData } }))
  }

  const value = { ...state, addTask, toggleTask, deleteTask, updateUser }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppStore = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within AppProvider')
  return context
}
