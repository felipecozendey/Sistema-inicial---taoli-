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
import { toast } from 'sonner'

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

export type MealType = 'Café da Manhã' | 'Almoço' | 'Jantar' | 'Lanche'
export type MealLog = {
  id: string
  date: string
  mealType: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  adherence: string
  timestamp: string
  photoUrl?: string
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
export type BodyMetric = {
  id: string
  date: string
  weight: number
  bodyFatPercentage: number
  muscleMass: number
  measurements: Record<string, number>
  photoUrls: string[]
  heartRateRest?: number
  bloodPressure?: string
  sleepQuality?: number
  stressLevel?: number
  primaryGoal?: string
  gender?: string
  age?: number
  height?: number
  activityLevel?: string
  tmb?: number
  get?: number
  leanMass?: number
  fatMass?: number
  metActivities?: Array<{
    id: string
    name: string
    met: number
    duration: number
    weeklyFrequency: number
  }>
  methodologyUsed?: string
  injuryFactor?: number
  ventaTarget?: number
  targetWeight?: number
  daysForGoal?: number
}
export type PatientGoal = {
  targetWeight: number
  targetBodyFat: number
  targetLeanMass: number
  height: number
}
export type MedicalExam = {
  id: string
  date: string
  title: string
  fileUrl: string
}
export type NutritionMicroGoal = {
  id: string
  title: string
  isActive: boolean
  emoji?: string
}
export type FastingFeeling = 'good' | 'normal' | 'bad'
export type FastingLog = {
  id: string
  startTime: string
  endTime: string
  targetHours: number
  actualHours: number
  feeling: FastingFeeling
  completed: boolean
}
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
export type Password = {
  id: string
  title: string
  username: string
  password: string
  url: string
  category: string
}
export type FinanceCategory = {
  id: string
  name: string
  parentId: string | null
  icon: string
  color: string
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
  bodyMetrics: BodyMetric[]
  patientGoals: PatientGoal
  medicalExams: MedicalExam[]
  nutritionMicroGoals: NutritionMicroGoal[]
  focusRadar: FocusRadarSettings
  fastingLogs: FastingLog[]
  activeFastingStart: string | null
  selectedProtocol: number
  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  toggleTransactionStatus: (id: string) => void
  fetchTransactions: () => Promise<void>
  passwords: Password[]
  addPassword: (p: Omit<Password, 'id'>) => void
  updatePassword: (id: string, updates: Partial<Password>) => void
  deletePassword: (id: string) => void
  fetchPasswords: () => Promise<void>
  financeCategories: FinanceCategory[]
  addFinanceCategory: (c: Omit<FinanceCategory, 'id'>) => void
  updateFinanceCategory: (id: string, updates: Partial<FinanceCategory>) => void
  deleteFinanceCategory: (id: string) => void
  fetchFinanceCategories: () => Promise<void>
  financeDateRange: { startDate: string; endDate: string }
  setFinanceDateRange: (range: Partial<{ startDate: string; endDate: string }>) => void
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
  setSelectedProtocol: (hours: number) => void
  startFastingTimer: () => void
  endFastingTimer: (feeling: FastingFeeling) => void
  deleteFastingLog: (id: string) => void
  fetchFastingLogs: () => Promise<void>
  addMealLog: (data: {
    mealType: string
    description: string
    calories: number
    protein: number
    carbs: number
    fat: number
    adherence: string
    photoUrl?: string
  }) => Promise<void>
  deleteMealLog: (id: string) => Promise<void>
  fetchMealLogs: () => Promise<void>
  dailyChecklist: Record<string, boolean>
  fetchDailyChecklist: () => Promise<void>
  toggleChecklistItem: (key: string) => void
  addWorkoutRoutine: (title: string, exercises: WorkoutExercise[]) => void
  deleteWorkoutRoutine: (id: string) => void
  fetchWorkoutRoutines: () => Promise<void>
  addWorkoutHistory: (routineId: string, data: Record<string, any>) => void
  completeWorkoutSet: () => void
  updatePersonalRecords: (updates: Partial<PersonalRecord>) => void
  fetchBodyMetrics: () => Promise<void>
  addBodyMetric: (metric: Omit<BodyMetric, 'id'>) => void
  fetchPatientGoals: () => Promise<void>
  updatePatientGoals: (updates: Partial<PatientGoal>) => void
  fetchMedicalExams: () => Promise<void>
  addMedicalExam: (title: string, fileUrl: string) => void
  deleteMedicalExam: (id: string) => void
  fetchNutritionMicroGoals: () => Promise<void>
  addNutritionMicroGoal: (title: string) => Promise<void>
  updateNutritionMicroGoal: (
    id: string,
    updates: Partial<Pick<NutritionMicroGoal, 'title' | 'isActive'>>,
  ) => Promise<void>
  deleteNutritionMicroGoal: (id: string) => Promise<void>
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

const initialBodyMetrics: BodyMetric[] = [
  {
    id: 'bm1',
    date: '2026-06-10',
    weight: 85,
    bodyFatPercentage: 22,
    muscleMass: 62,
    measurements: { waist: 92, hip: 98, chest: 100 },
    photoUrls: [],
  },
  {
    id: 'bm2',
    date: '2026-06-20',
    weight: 83.5,
    bodyFatPercentage: 21,
    muscleMass: 63,
    measurements: { waist: 90, hip: 97, chest: 99 },
    photoUrls: [],
  },
  {
    id: 'bm3',
    date: '2026-06-30',
    weight: 82,
    bodyFatPercentage: 19.5,
    muscleMass: 64,
    measurements: { waist: 88, hip: 96, chest: 98 },
    photoUrls: ['https://img.usecurling.com/p/400/500?q=before%20fitness&dpr=2'],
  },
  {
    id: 'bm4',
    date: '2026-07-08',
    weight: 81,
    bodyFatPercentage: 18,
    muscleMass: 64.5,
    measurements: { waist: 86, hip: 95, chest: 97 },
    photoUrls: ['https://img.usecurling.com/p/400/500?q=after%20fitness&dpr=2'],
    gender: 'male',
    age: 30,
    height: 175,
    activityLevel: 'moderate',
    tmb: 1759,
    get: 2726,
    primaryGoal: 'Hipertrofia',
    heartRateRest: 65,
    bloodPressure: '120/80',
    sleepQuality: 4,
    stressLevel: 2,
    methodologyUsed: 'mifflin',
    injuryFactor: 1.0,
    ventaTarget: 3226,
    metActivities: [],
  },
]
const initialPatientGoals: PatientGoal = {
  targetWeight: 75,
  targetBodyFat: 15,
  targetLeanMass: 65,
  height: 175,
}
const initialMedicalExams: MedicalExam[] = [
  { id: 'me1', date: '2026-06-15', title: 'Hemograma Completo', fileUrl: '' },
  { id: 'me2', date: '2026-07-01', title: 'Check-up Cardiológico', fileUrl: '' },
]
const initialMicroGoals: NutritionMicroGoal[] = [
  { id: 'mg1', title: 'Bati a Proteína', isActive: true, emoji: '🥩' },
  { id: 'mg2', title: 'Zero Açúcar', isActive: true, emoji: '🚫' },
  { id: 'mg3', title: 'Vegetais no Prato', isActive: true, emoji: '🥦' },
  { id: 'mg4', title: '2L de Água', isActive: true, emoji: '💧' },
  { id: 'mg5', title: 'Sem Ultraprocessados', isActive: true, emoji: '⛔' },
  { id: 'mg6', title: 'Fibras no Prato', isActive: true, emoji: '🌾' },
]

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
  const [dailyChecklist, setDailyChecklist] = useState<Record<string, boolean>>(() => {
    const s = localStorage.getItem('vt_daily_checklist')
    return s ? JSON.parse(s) : {}
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
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>(() => {
    const s = localStorage.getItem('vt_body_metrics')
    return s ? JSON.parse(s) : initialBodyMetrics
  })
  const [patientGoals, setPatientGoals] = useState<PatientGoal>(() => {
    const s = localStorage.getItem('vt_patient_goals')
    return s ? JSON.parse(s) : initialPatientGoals
  })
  const [medicalExams, setMedicalExams] = useState<MedicalExam[]>(() => {
    const s = localStorage.getItem('vt_medical_exams')
    return s ? JSON.parse(s) : initialMedicalExams
  })
  const [nutritionMicroGoals, setNutritionMicroGoals] = useState<NutritionMicroGoal[]>(() => {
    const s = localStorage.getItem('vt_nutrition_micro_goals')
    return s ? JSON.parse(s) : initialMicroGoals
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
  const [fastingLogs, setFastingLogs] = useState<FastingLog[]>(() => {
    const s = localStorage.getItem('vt_fasting_logs')
    return s ? JSON.parse(s) : []
  })
  const [activeFastingStart, setActiveFastingStart] = useState<string | null>(() => {
    return localStorage.getItem('vt_active_fasting_start') || null
  })
  const [selectedProtocol, setSelectedProtocol] = useState<number>(() => {
    const s = localStorage.getItem('vt_selected_protocol')
    return s ? parseInt(s) : 16
  })
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const s = localStorage.getItem('vt_transactions')
    return s ? JSON.parse(s) : initialTransactions
  })
  const [passwords, setPasswords] = useState<Password[]>(() => {
    const s = localStorage.getItem('vt_passwords')
    return s ? JSON.parse(s) : []
  })
  const [financeCategories, setFinanceCategories] = useState<FinanceCategory[]>(() => {
    const s = localStorage.getItem('vt_finance_categories')
    return s ? JSON.parse(s) : initialFinanceCategories
  })
  const [financeDateRange, setFinanceDateRangeState] = useState<{
    startDate: string
    endDate: string
  }>(() => {
    const s = localStorage.getItem('vt_finance_date_range')
    if (s) return JSON.parse(s)
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    }
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
    localStorage.setItem('vt_daily_checklist', JSON.stringify(dailyChecklist))
  }, [dailyChecklist])
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
    localStorage.setItem('vt_body_metrics', JSON.stringify(bodyMetrics))
  }, [bodyMetrics])
  useEffect(() => {
    localStorage.setItem('vt_patient_goals', JSON.stringify(patientGoals))
  }, [patientGoals])
  useEffect(() => {
    localStorage.setItem('vt_medical_exams', JSON.stringify(medicalExams))
  }, [medicalExams])
  useEffect(() => {
    localStorage.setItem('vt_nutrition_micro_goals', JSON.stringify(nutritionMicroGoals))
  }, [nutritionMicroGoals])
  useEffect(() => {
    localStorage.setItem('vt_focus_radar', JSON.stringify(focusRadar))
  }, [focusRadar])
  useEffect(() => {
    localStorage.setItem('vt_offline_queue', JSON.stringify(offlineQueue))
  }, [offlineQueue])
  useEffect(() => {
    localStorage.setItem('vt_fasting_logs', JSON.stringify(fastingLogs))
  }, [fastingLogs])
  useEffect(() => {
    if (activeFastingStart) {
      localStorage.setItem('vt_active_fasting_start', activeFastingStart)
    } else {
      localStorage.removeItem('vt_active_fasting_start')
    }
  }, [activeFastingStart])
  useEffect(() => {
    localStorage.setItem('vt_selected_protocol', String(selectedProtocol))
  }, [selectedProtocol])
  useEffect(() => {
    localStorage.setItem('vt_transactions', JSON.stringify(transactions))
  }, [transactions])
  useEffect(() => {
    localStorage.setItem('vt_passwords', JSON.stringify(passwords))
  }, [passwords])
  useEffect(() => {
    localStorage.setItem('vt_finance_categories', JSON.stringify(financeCategories))
  }, [financeCategories])
  useEffect(() => {
    localStorage.setItem('vt_finance_date_range', JSON.stringify(financeDateRange))
  }, [financeDateRange])

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
  const setFinanceDateRange = (range: Partial<{ startDate: string; endDate: string }>) =>
    setFinanceDateRangeState((p) => ({ ...p, ...range }))
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
  const addMealLog = async (data: {
    mealType: string
    description: string
    calories: number
    protein: number
    carbs: number
    fat: number
    adherence: string
    photoUrl?: string
  }) => {
    const tempId = genId()
    const log: MealLog = {
      id: tempId,
      date: todayStr(),
      ...data,
      timestamp: nowIso(),
    }
    setMealLogs((p) => [log, ...p])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('meal_logs')
        .insert({
          meal_type: data.mealType,
          description: data.description,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          adherence: data.adherence,
          photo_url: data.photoUrl || null,
          user_id: u.id,
        })
        .then(({ error }: { error: any }) => {
          if (error) {
            setMealLogs((p) => p.filter((l) => l.id !== tempId))
            toast.error('Erro ao salvar refeição. Tente novamente.')
          } else {
            fetchMealLogs()
          }
        })
    })
  }
  const deleteMealLog = async (id: string) => {
    setMealLogs((p) => p.filter((l) => l.id !== id))
    await (supabase as any).from('meal_logs').delete().eq('id', id)
  }
  const fetchMealLogs = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('meal_logs')
      .select('*')
      .eq('user_id', authUser.id)
      .neq('meal_type', 'checklist')
      .order('created_at', { ascending: false })
    if (data)
      setMealLogs(
        data.map((d: any) => ({
          id: d.id,
          date: (d.created_at || '').split('T')[0],
          mealType: d.meal_type,
          description: d.description || '',
          calories: d.calories || 0,
          protein: d.protein || 0,
          carbs: d.carbs || 0,
          fat: d.fat || 0,
          adherence: d.adherence || 'perfect',
          timestamp: d.created_at,
          photoUrl: d.photo_url || undefined,
        })),
      )
  }
  const fetchDailyChecklist = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('meal_logs')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('meal_type', 'checklist')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.items) {
      setDailyChecklist(data.items as Record<string, boolean>)
    } else {
      setDailyChecklist({})
    }
  }
  const toggleChecklistItem = (key: string) => {
    setDailyChecklist((prev) => {
      const newChecklist = { ...prev, [key]: !prev[key] }
      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (!u) return
        ;(async () => {
          const { data: existing } = await (supabase as any)
            .from('meal_logs')
            .select('id')
            .eq('user_id', u.id)
            .eq('meal_type', 'checklist')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (existing) {
            await (supabase as any)
              .from('meal_logs')
              .update({ items: newChecklist })
              .eq('id', existing.id)
          } else {
            await (supabase as any).from('meal_logs').insert({
              meal_type: 'checklist',
              quality: 'checklist',
              items: newChecklist,
              user_id: u.id,
            })
          }
        })()
      })
      return newChecklist
    })
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
  const fetchBodyMetrics = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('body_metrics')
      .select('*')
      .eq('user_id', authUser.id)
      .order('date', { ascending: true })
    if (data)
      setBodyMetrics(
        data.map((d: any) => ({
          id: d.id,
          date: (d.date || '').split('T')[0],
          weight: d.weight || 0,
          bodyFatPercentage: d.body_fat_percentage || 0,
          muscleMass: d.muscle_mass || 0,
          measurements: d.measurements || {},
          photoUrls: d.photo_urls || [],
          heartRateRest: d.heart_rate_rest || undefined,
          bloodPressure: d.blood_pressure || undefined,
          sleepQuality: d.sleep_quality || undefined,
          stressLevel: d.stress_level || undefined,
          primaryGoal: d.primary_goal || undefined,
          gender: d.gender || undefined,
          age: d.age || undefined,
          height: d.height || undefined,
          activityLevel: d.activity_level || undefined,
          tmb: d.tmb || undefined,
          get: d.get || undefined,
          leanMass: d.lean_mass || undefined,
          fatMass: d.fat_mass || undefined,
          metActivities: d.met_activities || [],
          methodologyUsed: d.methodology_used || undefined,
          injuryFactor: d.injury_factor || undefined,
          ventaTarget: d.venta_target || undefined,
          targetWeight: d.target_weight || undefined,
          daysForGoal: d.days_for_goal || undefined,
        })),
      )
  }
  const addBodyMetric = (metric: Omit<BodyMetric, 'id'>) => {
    const tempId = genId()
    setBodyMetrics((p) => [...p, { ...metric, id: tempId }])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('body_metrics')
        .insert({
          date: metric.date,
          weight: metric.weight,
          body_fat_percentage: metric.bodyFatPercentage,
          muscle_mass: metric.muscleMass,
          measurements: metric.measurements,
          photo_urls: metric.photoUrls,
          heart_rate_rest: metric.heartRateRest || null,
          blood_pressure: metric.bloodPressure || null,
          sleep_quality: metric.sleepQuality || null,
          stress_level: metric.stressLevel || null,
          primary_goal: metric.primaryGoal || null,
          gender: metric.gender || null,
          age: metric.age || null,
          height: metric.height || null,
          activity_level: metric.activityLevel || null,
          tmb: metric.tmb || null,
          get: metric.get || null,
          lean_mass: metric.leanMass || null,
          fat_mass: metric.fatMass || null,
          met_activities: metric.metActivities || [],
          methodology_used: metric.methodologyUsed || null,
          injury_factor: metric.injuryFactor || 1.0,
          venta_target: metric.ventaTarget || null,
          target_weight: metric.targetWeight || null,
          days_for_goal: metric.daysForGoal || null,
          user_id: u.id,
        })
        .then(({ error }: { error: any }) => {
          if (error) {
            setBodyMetrics((p) => p.filter((m) => m.id !== tempId))
            toast.error('Erro ao salvar avaliação. Tente novamente.')
          }
        })
    })
  }
  const fetchPatientGoals = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('patient_goals')
      .select('*')
      .eq('user_id', authUser.id)
      .limit(1)
      .maybeSingle()
    if (data)
      setPatientGoals({
        targetWeight: data.target_weight || 0,
        targetBodyFat: data.target_body_fat || 0,
        targetLeanMass: data.target_lean_mass || 0,
        height: data.height || 0,
      })
  }
  const updatePatientGoals = (updates: Partial<PatientGoal>) => {
    setPatientGoals((p) => {
      const newGoals = { ...p, ...updates }
      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (u)
          (supabase as any)
            .from('patient_goals')
            .upsert(
              {
                target_weight: newGoals.targetWeight,
                target_body_fat: newGoals.targetBodyFat,
                target_lean_mass: newGoals.targetLeanMass,
                height: newGoals.height,
                user_id: u.id,
              },
              { onConflict: 'user_id' },
            )
            .then()
      })
      return newGoals
    })
  }
  const fetchMedicalExams = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('medical_exams')
      .select('*')
      .eq('user_id', authUser.id)
      .order('date', { ascending: false })
    if (data)
      setMedicalExams(
        data.map((d: any) => ({
          id: d.id,
          date: (d.date || '').split('T')[0],
          title: d.title || '',
          fileUrl: d.file_url || '',
        })),
      )
  }
  const addMedicalExam = (title: string, fileUrl: string) => {
    const exam: MedicalExam = { id: genId(), date: todayStr(), title, fileUrl }
    setMedicalExams((p) => [exam, ...p])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u)
        (supabase as any)
          .from('medical_exams')
          .insert({ title, file_url: fileUrl, user_id: u.id })
          .then()
    })
  }
  const deleteMedicalExam = (id: string) => {
    setMedicalExams((p) => p.filter((e) => e.id !== id))
    ;(supabase as any).from('medical_exams').delete().eq('id', id).then()
  }
  const fetchNutritionMicroGoals = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('nutrition_micro_goals')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: true })
    if (data)
      setNutritionMicroGoals(
        data.map((d: any) => ({ id: d.id, title: d.title, isActive: d.is_active, emoji: '✅' })),
      )
  }
  const addNutritionMicroGoal = async (title: string) => {
    const tempId = genId()
    setNutritionMicroGoals((p) => [...p, { id: tempId, title, isActive: true, emoji: '✅' }])
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    if (!u) return
    const { data } = await (supabase as any)
      .from('nutrition_micro_goals')
      .insert({ title, is_active: true, user_id: u.id })
      .select()
      .single()
    if (data)
      setNutritionMicroGoals((p) => p.map((g) => (g.id === tempId ? { ...g, id: data.id } : g)))
  }
  const updateNutritionMicroGoal = async (
    id: string,
    updates: Partial<Pick<NutritionMicroGoal, 'title' | 'isActive'>>,
  ) => {
    setNutritionMicroGoals((p) => p.map((g) => (g.id === id ? { ...g, ...updates } : g)))
    const dbUpdates: Record<string, any> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    ;(supabase as any).from('nutrition_micro_goals').update(dbUpdates).eq('id', id).then()
  }
  const deleteNutritionMicroGoal = async (id: string) => {
    setNutritionMicroGoals((p) => p.filter((g) => g.id !== id))
    ;(supabase as any).from('nutrition_micro_goals').delete().eq('id', id).then()
  }
  const updateFocusRadar = (settings: Partial<FocusRadarSettings>) =>
    setFocusRadar((p) => ({ ...p, ...settings }))
  const startFastingTimer = () => {
    const nowIso = new Date().toISOString()
    setActiveFastingStart(nowIso)
  }
  const endFastingTimer = (feeling: FastingFeeling) => {
    if (!activeFastingStart) return
    const startTime = new Date(activeFastingStart)
    const endTime = new Date()
    const actualHours = (endTime.getTime() - startTime.getTime()) / 3600000
    const completed = actualHours >= selectedProtocol
    const tempId = genId()
    const log: FastingLog = {
      id: tempId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      targetHours: selectedProtocol,
      actualHours: Math.round(actualHours * 10) / 10,
      feeling,
      completed,
    }
    setFastingLogs((p) => [log, ...p])
    setActiveFastingStart(null)
    if (completed) {
      addCoins(10)
    }
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('fasting_logs')
        .insert({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          target_hours: selectedProtocol,
          actual_hours: Math.round(actualHours * 10) / 10,
          feeling,
          completed,
          user_id: u.id,
        })
        .then(({ error }: { error: any }) => {
          if (error) {
            setFastingLogs((p) => p.filter((l) => l.id !== tempId))
            toast.error('Erro ao salvar jejum. Tente novamente.')
          } else {
            fetchFastingLogs()
          }
        })
    })
  }
  const deleteFastingLog = (id: string) => {
    setFastingLogs((p) => p.filter((l) => l.id !== id))
    ;(supabase as any).from('fasting_logs').delete().eq('id', id).then()
  }
  const fetchFastingLogs = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('fasting_logs')
      .select('*')
      .eq('user_id', authUser.id)
      .order('end_time', { ascending: false })
    if (data)
      setFastingLogs(
        data.map((d: any) => ({
          id: d.id,
          startTime: d.start_time,
          endTime: d.end_time,
          targetHours: d.target_hours,
          actualHours: d.actual_hours,
          feeling: d.feeling,
          completed: d.completed,
        })),
      )
  }
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const tempId = genId()
    setTransactions((p) => [{ ...t, id: tempId }, ...p])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('transactions')
        .insert({
          type: t.type,
          amount: t.amount,
          category: t.category,
          subcategory: t.subcategory || null,
          description: t.description,
          date: t.date,
          status: t.status,
          user_id: u.id,
        })
        .then(({ error }: { error: any }) => {
          if (error) {
            setTransactions((p) => p.filter((tr) => tr.id !== tempId))
            toast.error('Erro ao salvar transação. Tente novamente.')
          } else {
            fetchTransactions()
          }
        })
    })
  }
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((p) => p.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    ;(supabase as any).from('transactions').update(updates).eq('id', id).then()
  }
  const deleteTransaction = (id: string) => {
    setTransactions((p) => p.filter((t) => t.id !== id))
    ;(supabase as any).from('transactions').delete().eq('id', id).then()
  }
  const toggleTransactionStatus = (id: string) => {
    const transaction = transactions.find((t) => t.id === id)
    if (!transaction) return
    const newStatus = transaction.status === 'paid' ? 'pending' : 'paid'
    setTransactions((p) => p.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
    ;(supabase as any).from('transactions').update({ status: newStatus }).eq('id', id).then()
  }
  const fetchTransactions = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('transactions')
      .select('*')
      .eq('user_id', authUser.id)
      .order('date', { ascending: false })
    if (data)
      setTransactions(
        data.map((d: any) => ({
          id: d.id,
          type: d.type,
          amount: parseFloat(d.amount) || 0,
          category: d.category,
          description: d.description || '',
          subcategory: d.subcategory || '',
          date: (d.date || '').split('T')[0],
          status: d.status || 'pending',
        })),
      )
  }
  const fetchPasswords = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('passwords')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
    if (data)
      setPasswords(
        data.map((d: any) => ({
          id: d.id,
          title: d.title || '',
          username: d.username || '',
          password: d.password || '',
          url: d.url || '',
          category: d.category || 'other',
        })),
      )
  }
  const addPassword = (p: Omit<Password, 'id'>) => {
    const tempId = genId()
    setPasswords((prev) => [{ ...p, id: tempId }, ...prev])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('passwords')
        .insert({
          title: p.title,
          username: p.username,
          password: p.password,
          url: p.url,
          category: p.category,
          user_id: u.id,
        })
        .then(({ error }: { error: any }) => {
          if (error) {
            setPasswords((prev) => prev.filter((pw) => pw.id !== tempId))
            toast.error('Erro ao salvar senha. Tente novamente.')
          } else {
            fetchPasswords()
          }
        })
    })
  }
  const updatePassword = (id: string, updates: Partial<Password>) => {
    setPasswords((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    const dbUpdates: Record<string, any> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.username !== undefined) dbUpdates.username = updates.username
    if (updates.password !== undefined) dbUpdates.password = updates.password
    if (updates.url !== undefined) dbUpdates.url = updates.url
    if (updates.category !== undefined) dbUpdates.category = updates.category
    ;(supabase as any).from('passwords').update(dbUpdates).eq('id', id).then()
  }
  const deletePassword = (id: string) => {
    setPasswords((prev) => prev.filter((p) => p.id !== id))
    ;(supabase as any).from('passwords').delete().eq('id', id).then()
  }
  const fetchFinanceCategories = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return
    const { data } = await (supabase as any)
      .from('finance_categories')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: true })
    if (data)
      setFinanceCategories(
        data.map((d: any) => ({
          id: d.id,
          name: d.name || '',
          parentId: d.parent_id || null,
          icon: d.icon || '📦',
          color: d.color || '#1CB0F6',
        })),
      )
  }
  const addFinanceCategory = (c: Omit<FinanceCategory, 'id'>) => {
    const tempId = genId()
    setFinanceCategories((prev) => [...prev, { ...c, id: tempId }])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('finance_categories')
        .insert({
          name: c.name,
          parent_id: c.parentId,
          icon: c.icon,
          color: c.color,
          user_id: u.id,
        })
        .then(({ error }: { error: any }) => {
          if (error) {
            setFinanceCategories((prev) => prev.filter((fc) => fc.id !== tempId))
            toast.error('Erro ao salvar categoria. Tente novamente.')
          } else {
            fetchFinanceCategories()
          }
        })
    })
  }
  const updateFinanceCategory = (id: string, updates: Partial<FinanceCategory>) => {
    setFinanceCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    const dbUpdates: Record<string, any> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.color !== undefined) dbUpdates.color = updates.color
    ;(supabase as any).from('finance_categories').update(dbUpdates).eq('id', id).then()
  }
  const deleteFinanceCategory = (id: string) => {
    setFinanceCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id))
    ;(supabase as any).from('finance_categories').delete().eq('id', id).then()
  }
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
      (supabase as any)
        .from('body_metrics')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      (supabase as any)
        .from('patient_goals')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      (supabase as any)
        .from('medical_exams')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'),
      (supabase as any)
        .from('nutrition_micro_goals')
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
    bodyMetrics,
    patientGoals,
    medicalExams,
    nutritionMicroGoals,
    focusRadar,
    fastingLogs,
    activeFastingStart,
    selectedProtocol,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    toggleTransactionStatus,
    fetchTransactions,
    passwords,
    addPassword,
    updatePassword,
    deletePassword,
    fetchPasswords,
    financeCategories,
    addFinanceCategory,
    updateFinanceCategory,
    deleteFinanceCategory,
    fetchFinanceCategories,
    financeDateRange,
    setFinanceDateRange,
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
    setSelectedProtocol,
    startFastingTimer,
    endFastingTimer,
    deleteFastingLog,
    fetchFastingLogs,
    addMealLog,
    deleteMealLog,
    fetchMealLogs,
    dailyChecklist,
    fetchDailyChecklist,
    toggleChecklistItem,
    addWorkoutRoutine,
    deleteWorkoutRoutine,
    fetchWorkoutRoutines,
    addWorkoutHistory,
    completeWorkoutSet,
    updatePersonalRecords,
    fetchBodyMetrics,
    addBodyMetric,
    fetchPatientGoals,
    updatePatientGoals,
    fetchMedicalExams,
    addMedicalExam,
    deleteMedicalExam,
    fetchNutritionMicroGoals,
    addNutritionMicroGoal,
    updateNutritionMicroGoal,
    deleteNutritionMicroGoal,
    addCoins,
    offlineQueue,
    addToOfflineQueue,
    clearOfflineQueue,
    hardReset,
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppState
export function useAppStore<T>(selector: (s: AppState) => T): T
export function useAppStore<T>(selector?: (s: AppState) => T): T | AppState {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  if (selector) return selector(ctx)
  return ctx
}
