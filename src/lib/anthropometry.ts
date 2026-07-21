export type Gender = 'male' | 'female'

export type SkinfoldKey =
  | 'triceps'
  | 'chest'
  | 'subscapular'
  | 'midaxillary'
  | 'suprailiac'
  | 'abdominal'
  | 'thigh'

export type Skinfolds = Partial<Record<SkinfoldKey, number>>

export function calculateIMC(weight: number, heightCm: number): number {
  if (!weight || !heightCm) return 0
  const heightM = heightCm / 100
  return Math.round((weight / (heightM * heightM)) * 10) / 10
}

export function calculateRCQ(waist: number, hip: number): number {
  if (!waist || !hip) return 0
  return Math.round((waist / hip) * 100) / 100
}

export function getRCQStatus(rcq: number, gender: Gender): { isRisk: boolean; label: string } {
  if (!rcq) return { isRisk: false, label: '' }
  const threshold = gender === 'male' ? 0.9 : 0.85
  return rcq > threshold
    ? { isRisk: true, label: 'Risco Elevado' }
    : { isRisk: false, label: 'Saudável' }
}

export function getIMCStatus(imc: number): { label: string; color: string } {
  if (!imc) return { label: '', color: '' }
  if (imc < 18.5) return { label: 'Abaixo do peso', color: '#FF9600' }
  if (imc < 25) return { label: 'Peso normal', color: '#58CC02' }
  if (imc < 30) return { label: 'Sobrepeso', color: '#FF9600' }
  return { label: 'Obesidade', color: '#FF4B4B' }
}

export function calculateBodyDensity7(gender: Gender, age: number, sf: Skinfolds): number {
  const sum =
    (sf.triceps || 0) +
    (sf.chest || 0) +
    (sf.subscapular || 0) +
    (sf.midaxillary || 0) +
    (sf.suprailiac || 0) +
    (sf.abdominal || 0) +
    (sf.thigh || 0)
  if (sum === 0) return 0
  const sum2 = sum * sum
  if (gender === 'male') {
    return 1.112 - 0.00043499 * sum + 0.00000055 * sum2 - 0.00028826 * age
  }
  return 1.097 - 0.00046971 * sum + 0.00000056 * sum2 - 0.00012828 * age
}

export function calculateFatFromDensity(density: number): number {
  if (!density) return 0
  return Math.round((4.95 / density - 4.5) * 100 * 10) / 10
}

export function calculateFatMass(weight: number, fatPercent: number): number {
  if (!weight || !fatPercent) return 0
  return Math.round(weight * (fatPercent / 100) * 10) / 10
}

export function calculateBodyDensity3(gender: Gender, age: number, sum: number): number {
  if (sum === 0) return 0
  const sum2 = sum * sum
  if (gender === 'male') {
    return 1.10938 - 0.0008267 * sum + 0.0000016 * sum2 - 0.0002574 * age
  }
  return 1.0994921 - 0.0009929 * sum + 0.0000023 * sum2 - 0.0001392 * age
}

export function calculateLeanMass(weight: number, fatMass: number): number {
  if (!weight) return 0
  return Math.round((weight - fatMass) * 10) / 10
}
