export type Gender = 'male' | 'female'
export type ActivityLevel = 'none' | 'sedentary' | 'light' | 'moderate' | 'intense' | 'athlete'
export type Methodology = 'mifflin' | 'harris' | 'katch'
export type InjuryFactorType = 'healthy' | 'surgery' | 'trauma' | 'sepsis'

export type MetActivity = {
  id: string
  name: string
  met: number
  duration: number
  weeklyFrequency: number
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  none: 1.0,
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  intense: 1.725,
  athlete: 1.9,
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  none: 'Não utilizar / Apenas TMB (Fator 1.0)',
  sedentary: 'Sedentário',
  light: 'Levemente Ativo',
  moderate: 'Moderadamente Ativo',
  intense: 'Muito Ativo',
  athlete: 'Atleta',
}

export const METHODOLOGY_ACTIVITY_FACTORS: Record<Methodology, Record<ActivityLevel, number>> = {
  mifflin: {
    none: 1.0,
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    intense: 1.725,
    athlete: 1.9,
  },
  harris: { none: 1.0, sedentary: 1.2, light: 1.3, moderate: 1.5, intense: 1.7, athlete: 1.9 },
  katch: { none: 1.0, sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725, athlete: 1.9 },
}

export const METHODOLOGY_ACTIVITY_LABELS: Record<Methodology, Record<ActivityLevel, string>> = {
  mifflin: {
    none: 'Não utilizar / Apenas TMB (1.0)',
    sedentary: 'Sedentário (1.2)',
    light: 'Levemente Ativo (1.375)',
    moderate: 'Moderadamente Ativo (1.55)',
    intense: 'Muito Ativo (1.725)',
    athlete: 'Atleta (1.9)',
  },
  harris: {
    none: 'Não utilizar / Apenas TMB (1.0)',
    sedentary: 'Sedentário (1.2)',
    light: 'Levemente Ativo (1.3)',
    moderate: 'Moderadamente Ativo (1.5)',
    intense: 'Muito Ativo (1.7)',
    athlete: 'Atleta (1.9)',
  },
  katch: {
    none: 'Não utilizar / Apenas TMB (1.0)',
    sedentary: 'Sedentário (1.2)',
    light: 'Levemente Ativo (1.375)',
    moderate: 'Moderadamente Ativo (1.55)',
    intense: 'Muito Ativo (1.725)',
    athlete: 'Atleta (1.9)',
  },
}

export function getActivityOptions(
  methodology: Methodology,
): { value: ActivityLevel; label: string }[] {
  const labels = METHODOLOGY_ACTIVITY_LABELS[methodology]
  return (Object.keys(labels) as ActivityLevel[]).map((key) => ({
    value: key,
    label: labels[key],
  }))
}

export function getActivityFactor(methodology: Methodology, level: ActivityLevel): number {
  return METHODOLOGY_ACTIVITY_FACTORS[methodology]?.[level] ?? 1.0
}

export const INJURY_FACTORS: Record<InjuryFactorType, number> = {
  healthy: 1.0,
  surgery: 1.2,
  trauma: 1.35,
  sepsis: 1.6,
}

export const INJURY_LABELS: Record<InjuryFactorType, string> = {
  healthy: 'Nenhum / Paciente Saudável (Fator 1.0)',
  surgery: 'Cirurgia Eletiva (1.2)',
  trauma: 'Trauma (1.35)',
  sepsis: 'Sepse (1.6)',
}

export const METHODOLOGY_LABELS: Record<Methodology, string> = {
  mifflin: 'Mifflin-St Jeor (1990)',
  harris: 'Harris-Benedict (1919)',
  katch: 'Katch-McArdle',
}

export function calculateTMB(gender: Gender, weight: number, height: number, age: number): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

export function calculateTMBByMethod(
  methodology: Methodology,
  gender: Gender,
  weight: number,
  height: number,
  age: number,
  leanMass?: number,
): number {
  switch (methodology) {
    case 'mifflin': {
      const base = 10 * weight + 6.25 * height - 5 * age
      return Math.round(gender === 'male' ? base + 5 : base - 161)
    }
    case 'harris': {
      if (gender === 'male') {
        return Math.round(66.5 + 13.75 * weight + 5.003 * height - 6.775 * age)
      }
      return Math.round(655.1 + 9.563 * weight + 1.85 * height - 4.676 * age)
    }
    case 'katch': {
      if (!leanMass || leanMass <= 0) return 0
      return Math.round(370 + 21.6 * leanMass)
    }
    default:
      return calculateTMB(gender, weight, height, age)
  }
}

export function calculateGET(tmb: number, activityLevel: ActivityLevel): number {
  return Math.round(tmb * ACTIVITY_FACTORS[activityLevel])
}

export function calculateGETAdvanced(
  tmb: number,
  activityFactor: number,
  injuryFactor: number,
  metDailyExpenditure: number,
): number {
  return Math.round(tmb * activityFactor * injuryFactor + metDailyExpenditure)
}

export function calculateMetExpenditure(
  met: number,
  weight: number,
  durationMinutes: number,
): number {
  return ((met * 3.5 * weight) / 200) * durationMinutes
}

export function calculateDailyMetExpenditure(activities: MetActivity[], weight: number): number {
  if (!activities.length || !weight) return 0
  const totalWeekly = activities.reduce((sum, a) => {
    const perSession = calculateMetExpenditure(a.met, weight, a.duration)
    return sum + perSession * a.weeklyFrequency
  }, 0)
  return Math.round((totalWeekly / 7) * 10) / 10
}

export function calculateVENTA(
  get: number,
  targetWeight?: number,
  currentWeight?: number,
  daysForGoal?: number,
): number {
  if (!targetWeight || !currentWeight || !daysForGoal || daysForGoal <= 0) {
    return Math.round(get)
  }
  const dailyDeficitSurplus = ((targetWeight - currentWeight) * 7700) / daysForGoal
  return Math.round(get + dailyDeficitSurplus)
}

export function calculateCaloricGoals(get: number) {
  return {
    deficit: Math.round(get - 500),
    maintenance: Math.round(get),
    surplus: Math.round(get + 300),
  }
}

export function calculateBolsoRange(
  weight: number,
  goal: string,
): { min: number; max: number; label: string } {
  if (goal === 'Emagrecimento') {
    return {
      min: Math.round(weight * 20),
      max: Math.round(weight * 25),
      label: '20-25 kcal/kg',
    }
  }
  if (goal === 'Hipertrofia') {
    return {
      min: Math.round(weight * 30),
      max: Math.round(weight * 35),
      label: '30-35 kcal/kg',
    }
  }
  return {
    min: Math.round(weight * 25),
    max: Math.round(weight * 30),
    label: '25-30 kcal/kg',
  }
}
