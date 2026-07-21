export type Gender = 'male' | 'female'

export type CompositionMethod = 'skinfolds' | 'bioimpedance'

export type CalcProtocol =
  | 'none'
  | 'durnin'
  | 'pollock_7'
  | 'pollock_3'
  | 'petroski'
  | 'guedes'
  | 'faulkner'

export type Skinfolds = {
  biceps?: number
  triceps?: number
  subscapular?: number
  chest?: number
  midaxillary?: number
  suprailiac?: number
  supraspinal?: number
  abdominal?: number
  thigh?: number
  calf?: number
}

export type Circumferences = {
  armRelaxedLeft?: number
  armRelaxedRight?: number
  armContractedLeft?: number
  armContractedRight?: number
  forearmLeft?: number
  forearmRight?: number
  wristCircLeft?: number
  wristCircRight?: number
  neck?: number
  shoulder?: number
  chest?: number
  waist?: number
  abdomen?: number
  hip?: number
  calfLeft?: number
  calfRight?: number
  thighLeft?: number
  thighRight?: number
  proximalThighLeft?: number
  proximalThighRight?: number
}

export type BoneDiameters = {
  wrist?: number
  femur?: number
  humerus?: number
}

export type IMCResult = {
  value: number
  classification: string
}

export type RCQResult = {
  index: number
  riskClassification: string
}

export type CompartmentResult = {
  kg: number
  percent: number
}

export type FourCompartmentModel = {
  adiposo: CompartmentResult
  residual: CompartmentResult
  osseo: CompartmentResult
  muscular: CompartmentResult
}

export function calculateIMC(weight: number, heightCm: number): IMCResult {
  if (!weight || !heightCm) return { value: 0, classification: '' }
  const heightM = heightCm / 100
  const value = Math.round((weight / (heightM * heightM)) * 10) / 10

  let classification: string
  if (value < 18.5) classification = 'Baixo peso'
  else if (value < 25) classification = 'Normal'
  else if (value < 30) classification = 'Sobrepeso'
  else if (value < 35) classification = 'Obesidade I'
  else if (value < 40) classification = 'Obesidade II'
  else classification = 'Obesidade III'

  return { value, classification }
}

export function calculateRCQ(waist: number, hip: number, gender: Gender): RCQResult {
  if (!waist || !hip) return { index: 0, riskClassification: '' }
  const index = Math.round((waist / hip) * 100) / 100
  const threshold = gender === 'male' ? 0.9 : 0.85
  const riskClassification = index > threshold ? 'Risco Elevado' : 'Saudável'
  return { index, riskClassification }
}

function densityToBodyFatSiri(density: number): number {
  if (!density || density <= 0) return 0
  return Math.round((4.95 / density - 4.5) * 100 * 10) / 10
}

export function calculateBodyFat(
  skinfolds: Skinfolds,
  protocol: CalcProtocol,
  age: number,
  gender: Gender,
): number {
  if (protocol === 'none') return 0

  const sf = skinfolds
  const sum = (v?: number) => v || 0

  switch (protocol) {
    case 'pollock_7': {
      const s7 =
        sum(sf.chest) +
        sum(sf.midaxillary) +
        sum(sf.triceps) +
        sum(sf.subscapular) +
        sum(sf.abdominal) +
        sum(sf.suprailiac) +
        sum(sf.thigh)
      if (s7 === 0) return 0
      const s7sq = s7 * s7
      let density: number
      if (gender === 'male') {
        density = 1.112 - 0.00043499 * s7 + 0.00000055 * s7sq - 0.00028826 * age
      } else {
        density = 1.097 - 0.00046971 * s7 + 0.00000056 * s7sq - 0.00012828 * age
      }
      return densityToBodyFatSiri(density)
    }

    case 'pollock_3': {
      let s3: number
      if (gender === 'male') {
        s3 = sum(sf.chest) + sum(sf.abdominal) + sum(sf.thigh)
      } else {
        s3 = sum(sf.triceps) + sum(sf.suprailiac) + sum(sf.thigh)
      }
      if (s3 === 0) return 0
      const s3sq = s3 * s3
      let density: number
      if (gender === 'male') {
        density = 1.10938 - 0.0008267 * s3 + 0.0000016 * s3sq - 0.0002574 * age
      } else {
        density = 1.0994921 - 0.0009929 * s3 + 0.0000023 * s3sq - 0.0001392 * age
      }
      return densityToBodyFatSiri(density)
    }

    case 'durnin': {
      const s4 = sum(sf.biceps) + sum(sf.triceps) + sum(sf.subscapular) + sum(sf.suprailiac)
      if (s4 === 0) return 0
      const logSum = Math.log10(s4)
      let density: number
      if (gender === 'male') {
        if (age <= 19) density = 1.162 - 0.063 * logSum
        else if (age <= 29) density = 1.1631 - 0.0632 * logSum
        else if (age <= 39) density = 1.1422 - 0.0544 * logSum
        else if (age <= 49) density = 1.162 - 0.07 * logSum
        else density = 1.1715 - 0.0779 * logSum
      } else {
        if (age <= 19) density = 1.1549 - 0.0678 * logSum
        else if (age <= 29) density = 1.1599 - 0.0717 * logSum
        else if (age <= 39) density = 1.1423 - 0.0632 * logSum
        else if (age <= 49) density = 1.1333 - 0.0612 * logSum
        else density = 1.1339 - 0.0645 * logSum
      }
      return densityToBodyFatSiri(density)
    }

    case 'petroski': {
      let s5: number
      if (gender === 'male') {
        s5 =
          sum(sf.triceps) +
          sum(sf.subscapular) +
          sum(sf.suprailiac) +
          sum(sf.abdominal) +
          sum(sf.thigh)
        if (s5 === 0) return 0
        const s5sq = s5 * s5
        const density = 1.10726863 - 0.00081201 * s5 + 0.00000212 * s5sq - 0.00018857 * age
        return densityToBodyFatSiri(density)
      } else {
        s5 =
          sum(sf.triceps) +
          sum(sf.subscapular) +
          sum(sf.suprailiac) +
          sum(sf.abdominal) +
          sum(sf.calf)
        if (s5 === 0) return 0
        const s5sq = s5 * s5
        const density = 1.09593519 - 0.00070208 * s5 + 0.00000289 * s5sq - 0.00011055 * age
        return densityToBodyFatSiri(density)
      }
    }

    case 'guedes': {
      let s3: number
      let density: number
      if (gender === 'male') {
        s3 = sum(sf.triceps) + sum(sf.suprailiac) + sum(sf.abdominal)
        if (s3 === 0) return 0
        density = 1.17136 - 0.06706 * Math.log10(s3)
      } else {
        s3 = sum(sf.triceps) + sum(sf.suprailiac) + sum(sf.thigh)
        if (s3 === 0) return 0
        density = 1.16649 - 0.0687 * Math.log10(s3)
      }
      return densityToBodyFatSiri(density)
    }

    case 'faulkner': {
      const s4 = sum(sf.triceps) + sum(sf.subscapular) + sum(sf.suprailiac) + sum(sf.abdominal)
      if (s4 === 0) return 0
      const density = 1.0867 - 0.00081 * s4
      return densityToBodyFatSiri(density)
    }

    default:
      return 0
  }
}

export function calculateVonDobelnBoneMass(
  heightCm: number,
  wristDiameter: number,
  femurDiameter: number,
): number {
  if (!heightCm || !wristDiameter || !femurDiameter) return 0
  const heightM = heightCm / 100
  const boneMass =
    3.02 * Math.pow(heightM * heightM * wristDiameter * femurDiameter * 0.0001, 0.712)
  return Math.round(boneMass * 100) / 100
}

export function calculate4CompartmentModel(
  weight: number,
  heightCm: number,
  wristDiameter: number,
  femurDiameter: number,
  bodyFatPct: number,
  gender: Gender,
): FourCompartmentModel {
  if (!weight) {
    return {
      adiposo: { kg: 0, percent: 0 },
      residual: { kg: 0, percent: 0 },
      osseo: { kg: 0, percent: 0 },
      muscular: { kg: 0, percent: 0 },
    }
  }

  const adiposoKg = Math.round(weight * (bodyFatPct / 100) * 100) / 100
  const residualFactor = gender === 'male' ? 0.24 : 0.21
  const residualKg = Math.round(weight * residualFactor * 100) / 100
  const osseoKg = calculateVonDobelnBoneMass(heightCm, wristDiameter, femurDiameter)
  const muscularKg = Math.round((weight - (adiposoKg + residualKg + osseoKg)) * 100) / 100

  return {
    adiposo: {
      kg: adiposoKg,
      percent: Math.round((adiposoKg / weight) * 100 * 10) / 10,
    },
    residual: {
      kg: residualKg,
      percent: Math.round((residualKg / weight) * 100 * 10) / 10,
    },
    osseo: {
      kg: osseoKg,
      percent: Math.round((osseoKg / weight) * 100 * 10) / 10,
    },
    muscular: {
      kg: muscularKg,
      percent: Math.round((muscularKg / weight) * 100 * 10) / 10,
    },
  }
}
