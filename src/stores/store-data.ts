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
export type WorkoutRoutine = { id: string; title: string; exercises: WorkoutExercise[] }
export type WorkoutHistory = {
  id: string
  routineId: string
  completedAt: string
  data: Record<string, any>
}
export type PersonalRecord = { benchPress: string; squat: string; runTime: string }
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
}
export type PatientGoal = { targetWeight: number; targetBodyFat: number; height: number }
export type MedicalExam = { id: string; date: string; title: string; fileUrl: string }
export type NutritionMicroGoal = { id: string; title: string; isActive: boolean; emoji?: string }
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

export const genId = () => Math.random().toString(36).substring(2, 9)
export const todayStr = () => new Date().toISOString().split('T')[0]
export const nowIso = () => new Date().toISOString()

export const lsGet = <T>(key: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch {
    return fallback
  }
}

export const lsSet = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* intentionally ignored */
  }
}

export function computeHealthRecords(
  hydrationLogs: HydrationLog[],
  moodLogs: MoodLog[],
  digestionLogs: DigestionLog[],
): Record<string, HealthRecord> {
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
}

export function migrateTask(t: any): Task {
  return {
    ...t,
    energyLevel: t.energyLevel || (t.priority === 'high' ? 3 : t.priority === 'medium' ? 2 : 1),
    priority: t.priority || (t.energyLevel === 3 ? 'high' : t.energyLevel === 2 ? 'medium' : 'low'),
    subtasks: t.subtasks || [],
    tagIds: t.tagIds || (t.tagId ? [t.tagId] : []),
  }
}

export function migrateHabit(h: any): Habit {
  return {
    ...h,
    escudos: h.escudos !== undefined ? h.escudos : 2,
    frozenDates: h.frozenDates || [],
    weeklyGoal: h.weeklyGoal || 0,
  }
}

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

export const defaultUser: User = {
  name: 'Viajante',
  avatar: '',
  dailyGoal: 5,
  waterGoal: 2000,
  handle: '@viajante',
  bio: 'Em busca de evolução contínua 🌱',
  socialLinks: [],
  coins: 0,
}

export const defaultFocusRadar: FocusRadarSettings = {
  enabled: false,
  interval: 30,
  message: 'Ainda focado? 👀',
  soundProfile: 'ding' as SoundProfile,
}

export const initialTags: Tag[] = [
  { id: '1', name: 'Saúde', color: '#10b981' },
  { id: '2', name: 'Trabalho', color: '#3b82f6' },
  { id: '3', name: 'Estudo', color: '#8b5cf6' },
  { id: '4', name: 'Lazer', color: '#f59e0b' },
]

export const initialTasks: Task[] = [
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

export const initialHabits: Habit[] = [
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

export const initialBodyMetrics: BodyMetric[] = [
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
  },
]

export const initialPatientGoals: PatientGoal = { targetWeight: 75, targetBodyFat: 15, height: 175 }

export const initialMedicalExams: MedicalExam[] = [
  { id: 'me1', date: '2026-06-15', title: 'Hemograma Completo', fileUrl: '' },
  { id: 'me2', date: '2026-07-01', title: 'Check-up Cardiológico', fileUrl: '' },
]

export const initialMicroGoals: NutritionMicroGoal[] = [
  { id: 'mg1', title: 'Bati a Proteína', isActive: true, emoji: '🥩' },
  { id: 'mg2', title: 'Zero Açúcar', isActive: true, emoji: '🚫' },
  { id: 'mg3', title: 'Vegetais no Prato', isActive: true, emoji: '🥦' },
  { id: 'mg4', title: '2L de Água', isActive: true, emoji: '💧' },
  { id: 'mg5', title: 'Sem Ultraprocessados', isActive: true, emoji: '⛔' },
  { id: 'mg6', title: 'Fibras no Prato', isActive: true, emoji: '🌾' },
]

export const genHydrationMockData = genHydrationMock
export const genMoodMockData = genMoodMock
export const genDigestionMockData = genDigestionMock
export const genUrineMockData = genUrineMock
