import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'

export type Priority = 'low' | 'medium' | 'high'
export type FrequencyType = 'daily' | 'weekly'
export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type BowelType = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type HydrationLog = { id: string; date: string; amount: number; timestamp: string }
export type MoodLog = {
  id: string
  date: string
  moodLevel: MoodLevel
  note: string
  tagId: string
  timestamp: string
}
export type DigestionLog = {
  id: string
  date: string
  bristolType: BowelType
  note: string
  timestamp: string
}

export type HealthRecord = {
  date: string
  hydration: number
  mood: { level: MoodLevel; note?: string; tagId?: string }
  bowel: { type: BowelType | null }
}

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
  hydrationLogs: HydrationLog[]
  moodLogs: MoodLog[]
  digestionLogs: DigestionLog[]
  healthRecords: Record<string, HealthRecord>
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
  addHydrationLog: (date: string, amount: number) => void
  deleteHydrationLog: (id: string) => void
  addMoodLog: (date: string, moodLevel: MoodLevel, note: string, tagId: string) => void
  deleteMoodLog: (id: string) => void
  addDigestionLog: (date: string, bristolType: BowelType, note: string) => void
  deleteDigestionLog: (id: string) => void
  updateHealthRecord: (date: string, updates: Partial<HealthRecord>) => void
  getHealthRecord: (date: string) => HealthRecord
}

const AppStoreContext = createContext<AppState | undefined>(undefined)
const genId = () => Math.random().toString(36).substring(2, 9)
const todayStr = () => new Date().toISOString().split('T')[0]
const nowIso = () => new Date().toISOString()

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

function genHydrationMock(): HydrationLog[] {
  const logs: HydrationLog[] = []
  const amounts = [250, 500, 250, 500, 250]
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const count = 2 + Math.floor(Math.random() * 3)
    for (let j = 0; j < count; j++) {
      const ts = new Date(d)
      ts.setHours(8 + j * 3, Math.floor(Math.random() * 60), 0, 0)
      logs.push({
        id: `hl${i}${j}`,
        date: ds,
        amount: amounts[j % amounts.length],
        timestamp: ts.toISOString(),
      })
    }
  }
  return logs
}

function genMoodMock(): MoodLog[] {
  const logs: MoodLog[] = []
  const levels: MoodLevel[] = [4, 3, 5, 2, 4, 3, 4]
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const ts = new Date(d)
    ts.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0)
    logs.push({
      id: `ml${i}`,
      date: ds,
      moodLevel: levels[i],
      note: i < 2 ? 'Sentindo-se bem!' : '',
      tagId: i < 2 ? '1' : '',
      timestamp: ts.toISOString(),
    })
  }
  return logs
}

function genDigestionMock(): DigestionLog[] {
  const logs: DigestionLog[] = []
  const types: BowelType[] = [4, 3, 4, 5, 4, 3, 4]
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const ts = new Date(d)
    ts.setHours(8, 30, 0, 0)
    logs.push({
      id: `dl${i}`,
      date: ds,
      bristolType: types[i],
      note: '',
      timestamp: ts.toISOString(),
    })
  }
  return logs
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
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>(() => {
    const s = localStorage.getItem('vt_hydration_logs')
    return s ? JSON.parse(s) : genHydrationMock()
  })
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    const s = localStorage.getItem('vt_mood_logs')
    return s ? JSON.parse(s) : genMoodMock()
  })
  const [digestionLogs, setDigestionLogs] = useState<DigestionLog[]>(() => {
    const s = localStorage.getItem('vt_digestion_logs')
    return s ? JSON.parse(s) : genDigestionMock()
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
  useEffect(() => {
    localStorage.setItem('vt_hydration_logs', JSON.stringify(hydrationLogs))
  }, [hydrationLogs])
  useEffect(() => {
    localStorage.setItem('vt_mood_logs', JSON.stringify(moodLogs))
  }, [moodLogs])
  useEffect(() => {
    localStorage.setItem('vt_digestion_logs', JSON.stringify(digestionLogs))
  }, [digestionLogs])

  const healthRecords = useMemo(() => {
    const result: Record<string, HealthRecord> = {}
    const allDates = new Set<string>()
    hydrationLogs.forEach((l) => allDates.add(l.date))
    moodLogs.forEach((l) => allDates.add(l.date))
    digestionLogs.forEach((l) => allDates.add(l.date))
    allDates.forEach((date) => {
      const hyd = hydrationLogs.filter((l) => l.date === date).reduce((s, l) => s + l.amount, 0)
      const moods = moodLogs
        .filter((l) => l.date === date)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      const bowels = digestionLogs
        .filter((l) => l.date === date)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      result[date] = {
        date,
        hydration: hyd,
        mood: moods[0]
          ? { level: moods[0].moodLevel, note: moods[0].note, tagId: moods[0].tagId }
          : { level: 3 },
        bowel: { type: bowels[0]?.bristolType || null },
      }
    })
    return result
  }, [hydrationLogs, moodLogs, digestionLogs])

  const getHealthRecord = (date: string): HealthRecord =>
    healthRecords[date] || { date, hydration: 0, mood: { level: 3 }, bowel: { type: null } }

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

  const addHydrationLog = (date: string, amount: number) =>
    setHydrationLogs((p) => [...p, { id: genId(), date, amount, timestamp: nowIso() }])
  const deleteHydrationLog = (id: string) => setHydrationLogs((p) => p.filter((l) => l.id !== id))
  const addMoodLog = (date: string, moodLevel: MoodLevel, note: string, tagId: string) =>
    setMoodLogs((p) => [...p, { id: genId(), date, moodLevel, note, tagId, timestamp: nowIso() }])
  const deleteMoodLog = (id: string) => setMoodLogs((p) => p.filter((l) => l.id !== id))
  const addDigestionLog = (date: string, bristolType: BowelType, note: string) =>
    setDigestionLogs((p) => [...p, { id: genId(), date, bristolType, note, timestamp: nowIso() }])
  const deleteDigestionLog = (id: string) => setDigestionLogs((p) => p.filter((l) => l.id !== id))

  const updateHealthRecord = (date: string, updates: Partial<HealthRecord>) => {
    if (updates.hydration !== undefined) {
      setHydrationLogs((prev) => [
        ...prev.filter((l) => l.date !== date),
        { id: genId(), date, amount: updates.hydration!, timestamp: nowIso() },
      ])
    }
    if (updates.mood !== undefined) {
      setMoodLogs((prev) => [
        ...prev.filter((l) => l.date !== date),
        {
          id: genId(),
          date,
          moodLevel: updates.mood!.level,
          note: updates.mood!.note || '',
          tagId: updates.mood!.tagId || '',
          timestamp: nowIso(),
        },
      ])
    }
    if (updates.bowel !== undefined) {
      if (updates.bowel!.type === null) {
        setDigestionLogs((prev) => prev.filter((l) => l.date !== date))
      } else {
        setDigestionLogs((prev) => [
          ...prev.filter((l) => l.date !== date),
          { id: genId(), date, bristolType: updates.bowel!.type!, note: '', timestamp: nowIso() },
        ])
      }
    }
  }

  const value: AppState = {
    user,
    tags,
    tasks,
    habits,
    hydrationLogs,
    moodLogs,
    digestionLogs,
    healthRecords,
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
    addHydrationLog,
    deleteHydrationLog,
    addMoodLog,
    deleteMoodLog,
    addDigestionLog,
    deleteDigestionLog,
    updateHealthRecord,
    getHealthRecord,
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export const useAppStore = () => {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
