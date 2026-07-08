import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Priority = 'low' | 'medium' | 'high'
export type FrequencyType = 'daily' | 'weekly'

export type Tag = { id: string; name: string; color: string }
export type Task = {
  id: string
  title: string
  dueDate: string
  priority: Priority
  estimatedTime: number
  tagId: string
  completed: boolean
}
export type Habit = {
  id: string
  title: string
  frequency: FrequencyType
  weekDays: number[]
  tagId: string
  completions: string[]
}
export type User = { name: string; avatar: string; dailyGoal: number }

interface AppState {
  user: User
  tags: Tag[]
  tasks: Task[]
  habits: Habit[]
  updateUser: (u: Partial<User>) => void
  addTag: (name: string, color: string) => void
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => void
  deleteTag: (id: string) => void
  addTask: (t: Omit<Task, 'id' | 'completed'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addHabit: (h: Omit<Habit, 'id' | 'completions'>) => void
  toggleHabitCompletion: (id: string, date: string) => void
  deleteHabit: (id: string) => void
}

const AppStoreContext = createContext<AppState | undefined>(undefined)
const genId = () => Math.random().toString(36).substring(2, 9)
const todayStr = () => new Date().toISOString().split('T')[0]

function genCompletions(prob: number): string[] {
  const result: string[] = []
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    if (Math.random() < prob) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      result.push(d.toISOString().split('T')[0])
    }
  }
  return result
}

const initialTags: Tag[] = [
  { id: '1', name: 'Saúde', color: '#10b981' },
  { id: '2', name: 'Trabalho', color: '#3b82f6' },
  { id: '3', name: 'Estudo', color: '#8b5cf6' },
  { id: '4', name: 'Lazer', color: '#f59e0b' },
]

const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Meditação Matinal (10 min)',
    dueDate: todayStr(),
    priority: 'medium',
    estimatedTime: 10,
    tagId: '1',
    completed: false,
  },
  {
    id: 't2',
    title: 'Avançar no Projeto Principal',
    dueDate: todayStr(),
    priority: 'high',
    estimatedTime: 120,
    tagId: '2',
    completed: false,
  },
  {
    id: 't3',
    title: 'Ler documentação técnica',
    dueDate: todayStr(),
    priority: 'low',
    estimatedTime: 30,
    tagId: '3',
    completed: true,
  },
]

const initialHabits: Habit[] = [
  {
    id: 'h1',
    title: 'Beber 2L de água',
    frequency: 'daily',
    weekDays: [],
    tagId: '1',
    completions: genCompletions(0.8),
  },
  {
    id: 'h2',
    title: 'Exercícios matinais',
    frequency: 'weekly',
    weekDays: [1, 3, 5],
    tagId: '1',
    completions: genCompletions(0.6),
  },
  {
    id: 'h3',
    title: 'Leitura noturna',
    frequency: 'daily',
    weekDays: [],
    tagId: '3',
    completions: genCompletions(0.5),
  },
]

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(() => {
    const s = localStorage.getItem('vt_user')
    return s ? JSON.parse(s) : { name: 'Viajante', avatar: '', dailyGoal: 5 }
  })
  const [tags, setTags] = useState<Tag[]>(() => {
    const s = localStorage.getItem('vt_tags')
    return s ? JSON.parse(s) : initialTags
  })
  const [tasks, setTasks] = useState<Task[]>(() => {
    const s = localStorage.getItem('vt_tasks')
    return s ? JSON.parse(s) : initialTasks
  })
  const [habits, setHabits] = useState<Habit[]>(() => {
    const s = localStorage.getItem('vt_habits')
    return s ? JSON.parse(s) : initialHabits
  })

  useEffect(() => {
    localStorage.setItem('vt_user', JSON.stringify(user))
  }, [user])
  useEffect(() => {
    localStorage.setItem('vt_tags', JSON.stringify(tags))
  }, [tags])
  useEffect(() => {
    localStorage.setItem('vt_tasks', JSON.stringify(tasks))
  }, [tasks])
  useEffect(() => {
    localStorage.setItem('vt_habits', JSON.stringify(habits))
  }, [habits])

  const updateUser = (u: Partial<User>) => setUser((p) => ({ ...p, ...u }))
  const addTag = (name: string, color: string) =>
    setTags((p) => [...p, { id: genId(), name, color }])
  const updateTag = (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) =>
    setTags((p) => p.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  const deleteTag = (id: string) => setTags((p) => p.filter((t) => t.id !== id))
  const addTask = (t: Omit<Task, 'id' | 'completed'>) =>
    setTasks((p) => [...p, { ...t, id: genId(), completed: false }])
  const toggleTask = (id: string) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  const deleteTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id))
  const addHabit = (h: Omit<Habit, 'id' | 'completions'>) =>
    setHabits((p) => [...p, { ...h, id: genId(), completions: [] }])
  const toggleHabitCompletion = (id: string, date: string) =>
    setHabits((p) =>
      p.map((h) => {
        if (h.id !== id) return h
        const has = h.completions.includes(date)
        return {
          ...h,
          completions: has ? h.completions.filter((d) => d !== date) : [...h.completions, date],
        }
      }),
    )
  const deleteHabit = (id: string) => setHabits((p) => p.filter((h) => h.id !== id))

  const value: AppState = {
    user,
    tags,
    tasks,
    habits,
    updateUser,
    addTag,
    updateTag,
    deleteTag,
    addTask,
    toggleTask,
    deleteTask,
    addHabit,
    toggleHabitCompletion,
    deleteHabit,
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export const useAppStore = () => {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
