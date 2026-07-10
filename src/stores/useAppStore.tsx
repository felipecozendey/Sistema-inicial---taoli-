import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'

export type Priority = 'low' | 'medium' | 'high'
export type EnergyLevel = 1 | 2 | 3
export type FrequencyType = 'daily' | 'weekly'
export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type BowelType = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type SoundProfile = 'ding' | 'pop' | 'tibetan'

export type Subtask = { id: string; title: string; completed: boolean }
export type OfflineAction = {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, any>
}
export type FocusRadarSettings = {
  enabled: boolean
  interval: number
  message: string
  soundProfile: SoundProfile
}

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
export type UrineLog = {
  id: string
  date: string
  colorType: number
  note: string
  timestamp: string
}
export type HealthRecord = {
  date: string
  hydration: number
  mood: { level: MoodLevel; note?: string; tagId?: string }
  bowel: { type: BowelType | null }
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type MealQuality = 'clean' | 'balanced' | 'cheat'
export type MealLog = {
  id: string
  date: string
  mealType: MealType
  quality: MealQuality
  items: Record<string, boolean>
  timestamp: string
}
export type WorkoutExercise = {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
}
export type WorkoutRoutine = {
  id: string
  title: string
  exercises: WorkoutExercise[]
}
export type WorkoutHistory = {
  id: string
  routineId: string
  completedAt: string
  data: Record<string, any>
}
export type PersonalRecord = {
  benchPress: string
  squat: string
  runTime: string
}
export type Tag = { id: string; name: string; color: string }
export type Task = {
  id: string
  title: string
  dueDate: string
  scheduledDate?: string
  energyLevel: EnergyLevel
  priority: Priority
  estimatedTime: number
  tagId: string
  tagIds: string[]
  completed: boolean
  subtasks: Subtask[]
}
export type NewTask = {
  title: string
  dueDate: string
  scheduledDate?: string
  energyLevel: EnergyLevel
  estimatedTime: number
  tagId: string
  tagIds?: string[]
  subtasks?: Subtask[]
}
export type Habit = {
  id: string
  title: string
  frequency: FrequencyType
  weekDays: number[]
  weeklyGoal: number
  targetCompletions?: number
  tagId: string
  completions: string[]
  escudos: number
  frozenDates: string[]
}
export type NewHabit = {
  title: string
  frequency: FrequencyType
  weekDays: number[]
  weeklyGoal: number
  targetCompletions?: number
  tagId: string
}
export type SocialLink = { id: string; platform: string; url: string }
export type User = {
  name: string
  avatar: string
  dailyGoal: number
  waterGoal: number
  handle: string
  bio: string
  socialLinks: SocialLink[]
  coins: number
}

interface AppState {
  user: User
  tags: Tag[]
  tasks: Task[]
  habits: Habit[]
  hydrationLogs: HydrationLog[]
  moodLogs: MoodLog[]
  digestionLogs: DigestionLog[]
  urineLogs: UrineLog[]
  healthRecords: Record<string, HealthRecord>
  mealLogs: MealLog[]
  workoutRoutines: WorkoutRoutine[]
  workoutHistory: WorkoutHistory[]
  personalRecords: PersonalRecord
  focusRadar: FocusRadarSettings
  updateUser: (u: Partial<User>) => void
  addTag: (name: string, color: string) => void
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => void
  deleteTag: (id: string) => void
  addTask: (t: NewTask) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<NewTask>) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addHabit: (h: NewHabit) => void
  toggleHabitCompletion: (id: string, date: string) => void
  deleteHabit: (id: string) => void
  updateHabit: (id: string, updates: Partial<NewHabit>) => void
  addHydrationLog: (date: string, amount: number) => void
  deleteHydrationLog: (id: string) => void
  updateHydrationLog: (id: string, updates: Partial<Pick<HydrationLog, 'amount' | 'date'>>) => void
  addMoodLog: (date: string, moodLevel: MoodLevel, note: string, tagId: string) => void
  deleteMoodLog: (id: string) => void
  updateMoodLog: (
    id: string,
    updates: Partial<Pick<MoodLog, 'moodLevel' | 'note' | 'tagId' | 'date'>>,
  ) => void
  addDigestionLog: (date: string, bristolType: BowelType, note: string) => void
  deleteDigestionLog: (id: string) => void
  updateDigestionLog: (
    id: string,
    updates: Partial<Pick<DigestionLog, 'bristolType' | 'note' | 'date'>>,
  ) => void
  addUrineLog: (date: string, colorType: number, note: string) => void
  deleteUrineLog: (id: string) => void
  updateUrineLog: (
    id: string,
    updates: Partial<Pick<UrineLog, 'colorType' | 'note' | 'date'>>,
  ) => void
  setWaterGoal: (goal: number) => void
  updateHealthRecord: (date: string, updates: Partial<HealthRecord>) => void
  getHealthRecord: (date: string) => HealthRecord
  updateFocusRadar: (settings: Partial<FocusRadarSettings>) => void
  addMealLog: (
    date: string,
    mealType: MealType,
    quality: MealQuality,
    items: Record<string, boolean>,
  ) => void
  deleteMealLog: (id: string) => void
  fetchMealLogs: () => Promise<void>
  addWorkoutRoutine: (title: string, exercises: WorkoutExercise[]) => void
  deleteWorkoutRoutine: (id: string) => void
  fetchWorkoutRoutines: () => Promise<void>
  addWorkoutHistory: (routineId: string, data: Record<string, any>) => void
  completeWorkoutSet: () => void
  updatePersonalRecords: (updates: Partial<PersonalRecord>) => void
  addCoins: (amount: number) => void
  offlineQueue: OfflineAction[]
  addToOfflineQueue: (action: OfflineAction) => void
  clearOfflineQueue: () => void
  hardReset: () => Promise<void>
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

function genUrineMock(): UrineLog[] {
  const logs: UrineLog[] = []
  const types = [2, 2, 3, 1, 2, 3, 2]
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const ts = new Date(d)
    ts.setHours(10, 0, 0, 0)
    logs.push({
      id: `ul${i}`,
      date: ds,
      colorType: types[i],
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
    energyLevel: 1,
    priority: 'low',
    estimatedTime: 10,
    tagId: '1',
    tagIds: ['1'],
    completed: false,
    subtasks: [],
  },
  {
    id: 't2',
    title: 'Avançar no Projeto Principal',
    dueDate: todayStr(),
    energyLevel: 3,
    priority: 'high',
    estimatedTime: 120,
    tagId: '2',
    tagIds: ['2'],
    completed: false,
    subtasks: [
      { id: 'st1', title: 'Definir escopo do sprint', completed: true },
      { id: 'st2', title: 'Criar protótipo inicial', completed: true },
      { id: 'st3', title: 'Revisar com a equipe', completed: false },
      { id: 'st4', title: 'Documentar decisões', completed: false },
      { id: 'st5', title: 'Preparar demo', completed: false },
    ],
  },
  {
    id: 't3',
    title: 'Ler documentação técnica',
    dueDate: todayStr(),
    energyLevel: 2,
    priority: 'medium',
    estimatedTime: 30,
    tagId: '3',
    tagIds: ['3'],
    completed: true,
    subtasks: [],
  },
  {
    id: 't4',
    title: 'Revisar código do colega',
    dueDate: todayStr(),
    energyLevel: 2,
    priority: 'medium',
    estimatedTime: 45,
    tagId: '2',
    tagIds: ['2'],
    completed: false,
    subtasks: [
      { id: 'st6', title: 'Clonar branch', completed: true },
      { id: 'st7', title: 'Rodar testes locais', completed: false },
    ],
  },
]

const initialHabits: Habit[] = [
  {
    id: 'h1',
    title: 'Beber 2L de água',
    frequency: 'daily',
    weekDays: [],
    weeklyGoal: 0,
    tagId: '1',
    completions: genCompletions(0.8),
    escudos: 2,
    frozenDates: [],
  },
  {
    id: 'h2',
    title: 'Exercícios matinais',
    frequency: 'weekly',
    weekDays: [1, 3, 5],
    weeklyGoal: 0,
    tagId: '1',
    completions: genCompletions(0.6),
    escudos: 1,
    frozenDates: [],
  },
  {
    id: 'h3',
    title: 'Leitura noturna',
    frequency: 'daily',
    weekDays: [],
    weeklyGoal: 0,
    tagId: '3',
    completions: genCompletions(0.5),
    escudos: 2,
    frozenDates: [],
  },
  {
    id: 'h4',
    title: 'Caminhada ao ar livre',
    frequency: 'weekly',
    weekDays: [2, 4, 6],
    weeklyGoal: 3,
    tagId: '4',
    completions: genCompletions(0.4),
    escudos: 2,
    frozenDates: [],
  },
]

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(() => {
    const defaults: User = {
      name: 'Viajante',
      avatar: '',
      dailyGoal: 5,
      waterGoal: 2000,
      handle: '@viajante',
      bio: 'Em busca de evolução contínua 🌱',
      socialLinks: [],
      coins: 0,
    }
    const s = localStorage.getItem('vt_user')
    return s ? { ...defaults, ...JSON.parse(s) } : defaults
  })
  const [tags, setTags] = useState<Tag[]>(() => {
    const s = localStorage.getItem('vt_tags')
    return s ? JSON.parse(s) : initialTags
  })
  const [tasks, setTasks] = useState<Task[]>(() => {
    const s = localStorage.getItem('vt_tasks')
    if (s) {
      const parsed = JSON.parse(s)
      return parsed.map((t: any) => ({
        ...t,
        energyLevel: t.energyLevel || (t.priority === 'high' ? 3 : t.priority === 'medium' ? 2 : 1),
        priority:
          t.priority || (t.energyLevel === 3 ? 'high' : t.energyLevel === 2 ? 'medium' : 'low'),
        subtasks: t.subtasks || [],
        tagIds: t.tagIds || (t.tagId ? [t.tagId] : []),
      }))
    }
    return initialTasks
  })
  const [habits, setHabits] = useState<Habit[]>(() => {
    const s = localStorage.getItem('vt_habits')
    if (s) {
      const parsed = JSON.parse(s)
      return parsed.map((h: any) => ({
        ...h,
        escudos: h.escudos !== undefined ? h.escudos : 2,
        frozenDates: h.frozenDates || [],
        weeklyGoal: h.weeklyGoal || 0,
      }))
    }
    return initialHabits
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
  const [urineLogs, setUrineLogs] = useState<UrineLog[]>(() => {
    const s = localStorage.getItem('vt_urine_logs')
    return s ? JSON.parse(s) : genUrineMock()
  })
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const s = localStorage.getItem('vt_meal_logs')
    return s ? JSON.parse(s) : []
  })
  const [workoutRoutines, setWorkoutRoutines] = useState<WorkoutRoutine[]>(() => {
    const s = localStorage.getItem('vt_workout_routines')
    return s ? JSON.parse(s) : []
  })
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>(() => {
    const s = localStorage.getItem('vt_workout_history')
    return s ? JSON.parse(s) : []
  })
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord>(() => {
    const s = localStorage.getItem('vt_personal_records')
    return s ? JSON.parse(s) : { benchPress: '', squat: '', runTime: '' }
  })
  const [focusRadar, setFocusRadar] = useState<FocusRadarSettings>(() => {
    const s = localStorage.getItem('vt_focus_radar')
    return s
      ? JSON.parse(s)
      : {
          enabled: false,
          interval: 30,
          message: 'Ainda focado? 👀',
          soundProfile: 'ding' as SoundProfile,
        }
  })
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() => {
    const s = localStorage.getItem('vt_offline_queue')
    return s ? JSON.parse(s) : []
  })

  const escudoCheckRef = useRef(false)

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
  useEffect(() => {
    localStorage.setItem('vt_urine_logs', JSON.stringify(urineLogs))
  }, [urineLogs])
  useEffect(() => {
    localStorage.setItem('vt_meal_logs', JSON.stringify(mealLogs))
  }, [mealLogs])
  useEffect(() => {
    localStorage.setItem('vt_workout_routines', JSON.stringify(workoutRoutines))
  }, [workoutRoutines])
  useEffect(() => {
    localStorage.setItem('vt_workout_history', JSON.stringify(workoutHistory))
  }, [workoutHistory])
  useEffect(() => {
    localStorage.setItem('vt_personal_records', JSON.stringify(personalRecords))
  }, [personalRecords])
  useEffect(() => {
    localStorage.setItem('vt_focus_radar', JSON.stringify(focusRadar))
  }, [focusRadar])
  useEffect(() => {
    localStorage.setItem('vt_offline_queue', JSON.stringify(offlineQueue))
  }, [offlineQueue])

  useEffect(() => {
    if (escudoCheckRef.current) return
    escudoCheckRef.current = true
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    setHabits((prev) =>
      prev.map((h) => {
        if (h.escudos <= 0) return h
        if (h.completions.includes(yesterdayStr)) return h
        if (h.frozenDates?.includes(yesterdayStr)) return h
        const isScheduled =
          h.frequency === 'daily' ||
          (h.weeklyGoal && h.weeklyGoal > 0) ||
          h.weekDays.includes(yesterday.getDay())
        if (!isScheduled) return h
        return {
          ...h,
          escudos: h.escudos - 1,
          frozenDates: [...(h.frozenDates || []), yesterdayStr],
        }
      }),
    )
  }, [])

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
  const addTask = (t: NewTask) => {
    const priority: Priority = t.energyLevel === 1 ? 'low' : t.energyLevel === 2 ? 'medium' : 'high'
    const subtasks: Subtask[] = (t.subtasks || []).map((s) => ({
      id: s.id || genId(),
      title: s.title,
      completed: s.completed || false,
    }))
    const tagIds = t.tagIds || (t.tagId ? [t.tagId] : [])
    setTasks((p) => [
      ...p,
      {
        id: genId(),
        title: t.title,
        dueDate: t.dueDate,
        scheduledDate: t.scheduledDate || t.dueDate,
        energyLevel: t.energyLevel,
        priority,
        estimatedTime: t.estimatedTime,
        tagId: tagIds[0] || '',
        tagIds,
        completed: false,
        subtasks,
      },
    ])
  }
  const toggleTask = (id: string) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  const deleteTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id))
  const updateTask = (id: string, updates: Partial<NewTask>) =>
    setTasks((p) =>
      p.map((t) => {
        if (t.id !== id) return t
        const energyLevel = updates.energyLevel ?? t.energyLevel
        const priority: Priority = energyLevel === 1 ? 'low' : energyLevel === 2 ? 'medium' : 'high'
        const subtasks = updates.subtasks
          ? updates.subtasks.map((s) => ({
              id: s.id || genId(),
              title: s.title,
              completed: s.completed || false,
            }))
          : t.subtasks
        const tagIds = updates.tagIds ?? t.tagIds
        return { ...t, ...updates, energyLevel, priority, subtasks, tagIds, tagId: tagIds[0] || '' }
      }),
    )
  const toggleSubtask = (taskId: string, subtaskId: string) =>
    setTasks((p) =>
      p.map((t) =>
        t.id !== taskId
          ? t
          : {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s,
              ),
            },
      ),
    )
  const addHabit = (h: NewHabit) =>
    setHabits((p) => [...p, { ...h, id: genId(), completions: [], escudos: 2, frozenDates: [] }])
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
  const updateHabit = (id: string, updates: Partial<NewHabit>) =>
    setHabits((p) => p.map((h) => (h.id === id ? { ...h, ...updates } : h)))
  const addHydrationLog = (date: string, amount: number) =>
    setHydrationLogs((p) => [...p, { id: genId(), date, amount, timestamp: nowIso() }])
  const deleteHydrationLog = (id: string) => setHydrationLogs((p) => p.filter((l) => l.id !== id))
  const updateHydrationLog = (
    id: string,
    updates: Partial<Pick<HydrationLog, 'amount' | 'date'>>,
  ) => setHydrationLogs((p) => p.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  const addMoodLog = (date: string, moodLevel: MoodLevel, note: string, tagId: string) =>
    setMoodLogs((p) => [...p, { id: genId(), date, moodLevel, note, tagId, timestamp: nowIso() }])
  const deleteMoodLog = (id: string) => setMoodLogs((p) => p.filter((l) => l.id !== id))
  const updateMoodLog = (
    id: string,
    updates: Partial<Pick<MoodLog, 'moodLevel' | 'note' | 'tagId' | 'date'>>,
  ) => setMoodLogs((p) => p.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  const addDigestionLog = (date: string, bristolType: BowelType, note: string) =>
    setDigestionLogs((p) => [...p, { id: genId(), date, bristolType, note, timestamp: nowIso() }])
  const deleteDigestionLog = (id: string) => setDigestionLogs((p) => p.filter((l) => l.id !== id))
  const updateDigestionLog = (
    id: string,
    updates: Partial<Pick<DigestionLog, 'bristolType' | 'note' | 'date'>>,
  ) => setDigestionLogs((p) => p.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  const addUrineLog = (date: string, colorType: number, note: string) =>
    setUrineLogs((p) => [...p, { id: genId(), date, colorType, note, timestamp: nowIso() }])
  const deleteUrineLog = (id: string) => setUrineLogs((p) => p.filter((l) => l.id !== id))
  const updateUrineLog = (
    id: string,
    updates: Partial<Pick<UrineLog, 'colorType' | 'note' | 'date'>>,
  ) => setUrineLogs((p) => p.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  const setWaterGoal = (goal: number) => setUser((p) => ({ ...p, waterGoal: goal }))
  const addCoins = (amount: number) => setUser((p) => ({ ...p, coins: (p.coins || 0) + amount }))
  const addMealLog = (
    date: string,
    mealType: MealType,
    quality: MealQuality,
    items: Record<string, boolean>,
  ) => {
    const log: MealLog = { id: genId(), date, mealType, quality, items, timestamp: nowIso() }
    setMealLogs((p) => [...p.filter((l) => !(l.date === date && l.mealType === mealType)), log])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u)
        (supabase as any)
          .from('meal_logs')
          .insert({ meal_type: mealType, quality, items, user_id: u.id })
          .then()
    })
  }
  const deleteMealLog = (id: string) => setMealLogs((p) => p.filter((l) => l.id !== id))
  const fetchMealLogs = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('meal_logs')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
    if (data)
      setMealLogs(
        data.map((d: any) => ({
          id: d.id,
          date: (d.created_at || '').split('T')[0],
          mealType: d.meal_type,
          quality: d.quality,
          items: d.items || {},
          timestamp: d.created_at,
        })),
      )
  }
  const addWorkoutRoutine = (title: string, exercises: WorkoutExercise[]) => {
    const routine: WorkoutRoutine = { id: genId(), title, exercises }
    setWorkoutRoutines((p) => [...p, routine])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u)
        (supabase as any)
          .from('workout_routines')
          .insert({ title, exercises, user_id: u.id })
          .then()
    })
  }
  const deleteWorkoutRoutine = (id: string) =>
    setWorkoutRoutines((p) => p.filter((r) => r.id !== id))
  const fetchWorkoutRoutines = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('workout_routines')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
    if (data)
      setWorkoutRoutines(
        data.map((d: any) => ({
          id: d.id,
          title: d.title,
          exercises: d.exercises || [],
        })),
      )
  }
  const addWorkoutHistory = (routineId: string, sessionData: Record<string, any>) => {
    setWorkoutHistory((p) => [
      ...p,
      { id: genId(), routineId, completedAt: nowIso(), data: sessionData },
    ])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u)
        (supabase as any)
          .from('workout_history')
          .insert({ routine_id: routineId, data: sessionData, user_id: u.id })
          .then()
    })
  }
  const completeWorkoutSet = () => addCoins(2)
  const updatePersonalRecords = (updates: Partial<PersonalRecord>) =>
    setPersonalRecords((p) => ({ ...p, ...updates }))
  const updateFocusRadar = (settings: Partial<FocusRadarSettings>) =>
    setFocusRadar((p) => ({ ...p, ...settings }))
  const addToOfflineQueue = (action: OfflineAction) => setOfflineQueue((p) => [...p, action])
  const clearOfflineQueue = () => setOfflineQueue([])
  const hardReset = async () => {
    await Promise.allSettled([
      supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('habits').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('flashcards').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('decks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      (supabase as any)
        .from('meal_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      (supabase as any)
        .from('workout_routines')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      (supabase as any)
        .from('workout_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      (supabase as any)
        .from('personal_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
    ])
    localStorage.clear()
    window.location.href = '/'
  }
  const updateHealthRecord = (date: string, updates: Partial<HealthRecord>) => {
    if (updates.hydration !== undefined)
      setHydrationLogs((prev) => [
        ...prev.filter((l) => l.date !== date),
        { id: genId(), date, amount: updates.hydration!, timestamp: nowIso() },
      ])
    if (updates.mood !== undefined)
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
    if (updates.bowel !== undefined) {
      if (updates.bowel!.type === null)
        setDigestionLogs((prev) => prev.filter((l) => l.date !== date))
      else
        setDigestionLogs((prev) => [
          ...prev.filter((l) => l.date !== date),
          { id: genId(), date, bristolType: updates.bowel!.type!, note: '', timestamp: nowIso() },
        ])
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
    urineLogs,
    healthRecords,
    mealLogs,
    workoutRoutines,
    workoutHistory,
    personalRecords,
    focusRadar,
    updateUser,
    addTag,
    updateTag,
    deleteTag,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    toggleSubtask,
    addHabit,
    toggleHabitCompletion,
    deleteHabit,
    updateHabit,
    addHydrationLog,
    deleteHydrationLog,
    updateHydrationLog,
    addMoodLog,
    deleteMoodLog,
    updateMoodLog,
    addDigestionLog,
    deleteDigestionLog,
    updateDigestionLog,
    addUrineLog,
    deleteUrineLog,
    updateUrineLog,
    setWaterGoal,
    updateHealthRecord,
    getHealthRecord,
    updateFocusRadar,
    addMealLog,
    deleteMealLog,
    fetchMealLogs,
    addWorkoutRoutine,
    deleteWorkoutRoutine,
    fetchWorkoutRoutines,
    addWorkoutHistory,
    completeWorkoutSet,
    updatePersonalRecords,
    addCoins,
    offlineQueue,
    addToOfflineQueue,
    clearOfflineQueue,
    hardReset,
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export const useAppStore = () => {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
