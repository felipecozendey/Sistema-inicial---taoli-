export function parseBase(unit: string): number {
  const m = unit.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : 1
}

export function calcMacrosForAmount(
  baseUnit: string,
  amount: string,
  macros: { calories: number; carbsG: number; proteinG: number; fatG: number },
) {
  const base = parseBase(baseUnit)
  const qty = parseFloat(amount) || 0
  const factor = base > 0 ? qty / base : 0
  return {
    calories: Math.round(macros.calories * factor),
    carbsG: +(macros.carbsG * factor).toFixed(1),
    proteinG: +(macros.proteinG * factor).toFixed(1),
    fatG: +(macros.fatG * factor).toFixed(1),
  }
}

export const FOOD_TAG_PRESETS = [
  'Sem Glúten',
  'Alta Proteína',
  'Vegano',
  'Vegetariano',
  'Low Carb',
  'Lacticínio',
  'Fruta',
  'Grão',
  'Carne',
  'Legume',
] as const
