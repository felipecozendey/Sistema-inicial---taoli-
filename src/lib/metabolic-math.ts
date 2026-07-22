import type { Gender } from '@/lib/metabolic-utils'

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

export type BMRInput = {
  weight: number
  height: number
  age: number
  gender: Gender
  leanMass?: number
  formula: CalcFormula
  paCoefficient?: number
}

export type MetActivityItem = {
  id: string
  item_name: string
  met_value: number
  duration_min: number
  frequency: number
  energy_kcal: number
}

export const CALC_FORMULA_LABELS: Record<CalcFormula, string> = {
  harris_1919: 'Harris-Benedict (1919)',
  harris_1984: 'Harris-Benedict Revisada (1984 - Roza & Shizgal)',
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

function validatePositive(v: number | undefined, name: string): number {
  if (v === undefined || v === null || v <= 0) {
    throw new Error(`${name} must be a positive number`)
  }
  return v
}

export function calculateBMR(input: BMRInput): number {
  const { weight, height, age, gender, leanMass, formula, paCoefficient } = input
  const w = validatePositive(weight, 'weight')
  const h = validatePositive(height, 'height')
  const a = validatePositive(age, 'age')

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
      if (gender === 'male') {
        return Math.round(22 * lw + 487)
      }
      return Math.round(22 * lw + 387)
    }

    case 'katch_mcardle': {
      const lm = validatePositive(leanMass, 'leanMass')
      return Math.round(370 + 21.6 * lm)
    }

    case 'cunningham': {
      const lm = validatePositive(leanMass, 'leanMass')
      return Math.round(500 + 22 * lm)
    }

    case 'tinsley_lean': {
      const lm = validatePositive(leanMass, 'leanMass')
      if (gender === 'male') {
        return Math.round(24.8 * lm + 373)
      }
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
        const eer = 662 - 9.53 * a + pa * (15.91 * w + 539.6 * (h / 100))
        return Math.round(eer)
      }
      const paF = paCoefficient ?? 1.0
      const eer = 354 - 6.91 * a + paF * (9.36 * w + 726 * (h / 100))
      return Math.round(eer)
    }

    case 'eer_2023': {
      const pa = paCoefficient ?? 1.0
      if (gender === 'male') {
        const eer = 655 + 9.91 * a * -1 + pa * (15.4 * w + 527 * (h / 100))
        return Math.round(eer)
      }
      const eer = 354 + 6.91 * a * -1 + pa * (9.36 * w + 726 * (h / 100))
      return Math.round(eer)
    }

    default:
      return 0
  }
}

export function calculateActivityBurn(
  metValue: number,
  weight: number,
  durationMin: number,
): number {
  if (!metValue || !weight || !durationMin) return 0
  return Math.round(metValue * weight * (durationMin / 60) * 10) / 10
}

export function calculateActivitiesTotal(activities: MetActivityItem[], weight: number): number {
  if (!activities.length || !weight) return 0
  const totalWeekly = activities.reduce((sum, a) => {
    const perSession = calculateActivityBurn(a.met_value, weight, a.duration_min)
    return sum + perSession * (a.frequency || 1)
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

export function buildMetActivityItem(
  itemName: string,
  metValue: number,
  durationMin: number,
  frequency: number,
  weight: number,
): MetActivityItem {
  return {
    id: Math.random().toString(36).substring(2, 11),
    item_name: itemName,
    met_value: metValue,
    duration_min: durationMin,
    frequency,
    energy_kcal: calculateActivityBurn(metValue, weight, durationMin),
  }
}
