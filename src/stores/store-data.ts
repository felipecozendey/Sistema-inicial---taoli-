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
export type FocusPhase = 'focus' | 'short' | 'long'
export type FocusMode = 'pomodoro' | 'radar'

export type AdaFocusSettings = {
  enabled: boolean // padrão false
  intervalMinutes: number // 1–180, padrão 30
  message: string // padrão "Ainda focado? 👀"
  soundProfile: SoundProfile // 'ding' | 'pop' | 'tibetan'
  autoDismissSeconds: number // 0 = até fechar manualmente; 10/30/60/300; padrão 30
  onlyDuringFocus: boolean // disparar só durante a fase focus do Pomodoro; padrão false
}

export type FocusRadarSettings = {
  enabled: boolean
  interval: number
  message: string
  soundProfile: SoundProfile
  // Novos campos Pomodoro / Gerenciador de Produtividade Humana
  mode: FocusMode
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
  autoStartNext: boolean
  currentCycle: number
  phase: FocusPhase
  // Bloco Ada Focus independente
  adaFocus: AdaFocusSettings
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
  fibersG?: number
  sodiumMg?: number
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
  created_by?: string | null
}
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
  created_by?: string | null
}
export type PatientGoal = {
  targetWeight: number
  targetBodyFat: number
  targetLeanMass?: number
  height: number
}
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
  created_by?: string | null
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
  created_by?: string | null
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
export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
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

export const defaultAdaFocus: AdaFocusSettings = {
  enabled: false,
  intervalMinutes: 30,
  message: 'Ainda focado? 👀',
  soundProfile: 'ding',
  autoDismissSeconds: 30,
  onlyDuringFocus: false,
}

export const defaultFocusRadar: FocusRadarSettings = {
  enabled: false,
  interval: 30,
  message: 'Ainda focado? 👀',
  soundProfile: 'ding' as SoundProfile,
  mode: 'pomodoro',
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: false,
  currentCycle: 1,
  phase: 'focus',
  adaFocus: defaultAdaFocus,
}

export const initialTags: Tag[] = []
export const initialTasks: Task[] = []
export const initialHabits: Habit[] = []
export const initialBodyMetrics: BodyMetric[] = []

export const initialPatientGoals: PatientGoal = {
  targetWeight: 0,
  targetBodyFat: 0,
  targetLeanMass: 0,
  height: 0,
}

export const initialMedicalExams: MedicalExam[] = []
export const initialMicroGoals: NutritionMicroGoal[] = []
