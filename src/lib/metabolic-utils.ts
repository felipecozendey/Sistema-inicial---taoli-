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

export type CalcFormula =
  | 'harris_1919'
  | 'harris_1984'
  | 'mifflin'
  | 'henry_2005'
  | 'tinsley_weight'
  | 'katch_mcardle'
  | 'cunningham'
  | 'tinsley_lean'
  | 'fao_who'
  | 'eer_2005'
  | 'eer_2023'

export type PatientProfile = 'patient' | 'athlete' | 'pregnant' | 'child'

export const CALC_FORMULA_LABELS: Record<CalcFormula, string> = {
  harris_1919: 'Harris-Benedict (1919)',
  harris_1984: 'Harris-Benedict Revisada (1984)',
  mifflin: 'Mifflin-St Jeor (1990)',
  henry_2005: 'Henry/Oxford (2005)',
  tinsley_weight: 'Tinsley (2018) - Peso',
  katch_mcardle: 'Katch-McArdle',
  cunningham: 'Cunningham (1991)',
  tinsley_lean: 'Tinsley (2018) - Massa Magra',
  fao_who: 'FAO/WHO (2004)',
  eer_2005: 'EER - IOM (2005)',
  eer_2023: 'EER - IOM Atualizada (2023)',
}

export const PATIENT_PROFILE_LABELS: Record<PatientProfile, string> = {
  patient: 'Paciente',
  athlete: 'Atleta',
  pregnant: 'Gestante',
  child: 'Criança',
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

export type BMRInput = {
  weight: number
  height: number
  age: number
  gender: Gender
  leanMass?: number
  formula: CalcFormula
  paCoefficient?: number
}

export function calculateBMR(input: BMRInput): number {
  const { weight, height, age, gender, leanMass, formula, paCoefficient } = input
  const w = weight > 0 ? weight : 0
  const h = height > 0 ? height : 0
  const a = age > 0 ? age : 0

  switch (formula) {
    case 'harris_1919': {
      if (gender === 'male') {
        return Math.round(66.5 + 13.75 * w + 5.003 * h - 6.775 * a)
      }
      return Math.round(655.1 + 9.563 * w + 1.85 * h - 4.676 * a)
    }
    case 'harris_1984': {
      if (gender === 'male') {
        return Math.round(88.362 + 13.397 * w + 4.799 * h - 5.677 * a)
      }
      return Math.round(447.593 + 9.247 * w + 3.098 * h - 4.33 * a)
    }
    case 'mifflin': {
      const base = 10 * w + 6.25 * h - 5 * a
      return Math.round(gender === 'male' ? base + 5 : base - 161)
    }
    case 'henry_2005': {
      if (gender === 'male') {
        if (a >= 10 && a <= 18) return Math.round(16.25 * w + 1.373 * h + 515.8)
        if (a >= 19 && a <= 30) return Math.round(15.057 * w + 1.354 * h + 699)
        if (a >= 31 && a <= 60) return Math.round(14.074 * w + 1.897 * h + 659)
        return Math.round(13.194 * w + 2.955 * h + 696)
      }
      if (a >= 10 && a <= 18) return Math.round(8.365 * w + 4.65 * h + 200)
      if (a >= 19 && a <= 30) return Math.round(13.923 * w + 1.547 * h + 249)
      if (a >= 31 && a <= 60) return Math.round(13.297 * w + 867)
      return Math.round(10.098 * w + 1.792 * h + 625)
    }
    case 'tinsley_weight': {
      const lw = leanMass && leanMass > 0 ? leanMass : w
      if (gender === 'male') return Math.round(22 * lw + 487)
      return Math.round(22 * lw + 387)
    }
    case 'katch_mcardle': {
      const lm = leanMass && leanMass > 0 ? leanMass : 0
      return Math.round(370 + 21.6 * lm)
    }
    case 'cunningham': {
      const lm = leanMass && leanMass > 0 ? leanMass : 0
      return Math.round(500 + 22 * lm)
    }
    case 'tinsley_lean': {
      const lm = leanMass && leanMass > 0 ? leanMass : 0
      if (gender === 'male') return Math.round(24.8 * lm + 373)
      return Math.round(24.8 * lm + 273)
    }
    case 'fao_who': {
      if (gender === 'male') {
        if (a >= 18 && a <= 30) return Math.round(15.3 * w + 679)
        if (a >= 31 && a <= 60) return Math.round(11.6 * w + 879)
        return Math.round(13.5 * w + 487)
      }
      if (a >= 18 && a <= 30) return Math.round(14.7 * w + 496)
      if (a >= 31 && a <= 60) return Math.round(8.7 * w + 829)
      return Math.round(10.5 * w + 596)
    }
    case 'eer_2005': {
      const pa = paCoefficient ?? 1.0
      if (gender === 'male') {
        return Math.round(662 - 9.53 * a + pa * (15.91 * w + 539.6 * (h / 100)))
      }
      return Math.round(354 - 6.91 * a + pa * (9.36 * w + 726 * (h / 100)))
    }
    case 'eer_2023': {
      const pa = paCoefficient ?? 1.0
      if (gender === 'male') {
        return Math.round(655 - 9.91 * a + pa * (15.4 * w + 527 * (h / 100)))
      }
      return Math.round(354 - 6.91 * a + pa * (9.36 * w + 726 * (h / 100)))
    }
    default:
      return 0
  }
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

export function calculateActivityBurnKcal(
  metValue: number,
  weight: number,
  durationMin: number,
): number {
  if (!metValue || !weight || !durationMin) return 0
  return Math.round(metValue * weight * (durationMin / 60) * 10) / 10
}

export function calculateDailyMetExpenditure(activities: MetActivity[], weight: number): number {
  if (!activities.length || !weight) return 0
  const totalWeekly = activities.reduce((sum, a) => {
    const perSession = calculateActivityBurnKcal(a.met, weight, a.duration)
    return sum + perSession * a.weeklyFrequency
  }, 0)
  return Math.round((totalWeekly / 7) * 10) / 10
}

export function calculateVENTA(
  bmr: number,
  activityMultiplier: number,
  injuryFactor: number,
  physicalActivitiesTotalKcal: number,
): number {
  const safeInjury = injuryFactor || 1.0
  return Math.round(bmr * activityMultiplier * safeInjury + physicalActivitiesTotalKcal)
}

export function calculateVENTALegacy(
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

export type FormulaGroup = 'A' | 'B' | 'C'

export function getFormulaGroup(formula: string): FormulaGroup {
  if (formula === 'fao_who') return 'B'
  if (formula === 'eer_2005' || formula === 'eer_2023') return 'C'
  return 'A'
}

export type GroupActivity = {
  value: string
  label: string
  factor: number
}

export const GROUP_A_ACTIVITIES: GroupActivity[] = [
  { value: '1.2', label: 'Sedentário (1.2)', factor: 1.2 },
  { value: '1.375', label: 'Leve (1.375)', factor: 1.375 },
  { value: '1.55', label: 'Moderado (1.55)', factor: 1.55 },
  { value: '1.725', label: 'Muito Ativo (1.725)', factor: 1.725 },
  { value: '1.9', label: 'Extremamente Ativo (1.9)', factor: 1.9 },
]

export const GROUP_B_ACTIVITIES: GroupActivity[] = [
  { value: '1.4', label: 'Leve/Sedentário (1.4)', factor: 1.4 },
  { value: '1.7', label: 'Moderado (1.7)', factor: 1.7 },
  { value: '2.0', label: 'Intenso (2.0)', factor: 2.0 },
]

export const GROUP_C_ACTIVITIES: GroupActivity[] = [
  { value: '1.0', label: 'Sedentário (1.0)', factor: 1.0 },
  { value: '1.11', label: 'Pouco Ativo (1.11)', factor: 1.11 },
  { value: '1.25', label: 'Ativo (1.25)', factor: 1.25 },
  { value: '1.48', label: 'Muito Ativo (1.48)', factor: 1.48 },
]

export function getGroupActivities(group: FormulaGroup): GroupActivity[] {
  switch (group) {
    case 'B':
      return GROUP_B_ACTIVITIES
    case 'C':
      return GROUP_C_ACTIVITIES
    default:
      return GROUP_A_ACTIVITIES
  }
}

export type ClinicalCondition = {
  id: string
  label: string
  type: 'fixed' | 'range'
  value?: number
  min?: number
  max?: number
}

export const CLINICAL_CONDITIONS: ClinicalCondition[] = [
  { id: 'healthy', label: 'Manutenção/Saudável', type: 'fixed', value: 1.0 },
  { id: 'surgery', label: 'Cirurgia Eletiva', type: 'range', min: 1.0, max: 1.1 },
  { id: 'malnutrition', label: 'Desnutrição Grave', type: 'fixed', value: 1.5 },
  { id: 'trauma', label: 'Trauma Múltiplo', type: 'fixed', value: 1.35 },
  { id: 'cancer', label: 'Câncer', type: 'range', min: 1.1, max: 1.45 },
  { id: 'sepsis', label: 'Sepse Grave', type: 'fixed', value: 1.6 },
  { id: 'burns_low', label: 'Queimadura < 20%', type: 'range', min: 1.0, max: 1.5 },
  { id: 'burns_mid', label: 'Queimadura 20-40%', type: 'range', min: 1.5, max: 1.85 },
  { id: 'burns_high', label: 'Queimadura > 40%', type: 'range', min: 1.85, max: 2.0 },
]

export function getClinicalCondition(id: string): ClinicalCondition | undefined {
  return CLINICAL_CONDITIONS.find((c) => c.id === id)
}

export function inferClinicalCondition(injuryFactor: number): string {
  const fixed = CLINICAL_CONDITIONS.find((c) => c.type === 'fixed' && c.value === injuryFactor)
  if (fixed) return fixed.id
  const range = CLINICAL_CONDITIONS.find(
    (c) =>
      c.type === 'range' &&
      c.min !== undefined &&
      c.max !== undefined &&
      injuryFactor >= c.min &&
      injuryFactor <= c.max,
  )
  if (range) return range.id
  return 'healthy'
}
