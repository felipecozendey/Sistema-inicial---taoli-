export type DefaultFood = {
  name: string
  baseUnit: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
}

export const DEFAULT_FOODS: DefaultFood[] = [
  {
    name: 'Arroz Branco Cozido',
    baseUnit: '100g',
    calories: 130,
    carbsG: 28,
    proteinG: 2.7,
    fatG: 0.3,
  },
  {
    name: 'Arroz Integral Cozido',
    baseUnit: '100g',
    calories: 112,
    carbsG: 24,
    proteinG: 2.6,
    fatG: 0.9,
  },
  {
    name: 'Feijão Carioca Cozido',
    baseUnit: '100g',
    calories: 76,
    carbsG: 14,
    proteinG: 4.8,
    fatG: 0.5,
  },
  { name: 'Frango Grelhado', baseUnit: '100g', calories: 165, carbsG: 0, proteinG: 31, fatG: 3.6 },
  {
    name: 'Carne Bovina Magra',
    baseUnit: '100g',
    calories: 250,
    carbsG: 0,
    proteinG: 26,
    fatG: 17,
  },
  { name: 'Ovo Cozido', baseUnit: '1 unid', calories: 78, carbsG: 0.6, proteinG: 6.3, fatG: 5.3 },
  {
    name: 'Batata Doce Cozida',
    baseUnit: '100g',
    calories: 86,
    carbsG: 20,
    proteinG: 1.6,
    fatG: 0.1,
  },
  { name: 'Banana', baseUnit: '100g', calories: 89, carbsG: 23, proteinG: 1.1, fatG: 0.3 },
  { name: 'Maçã', baseUnit: '100g', calories: 52, carbsG: 14, proteinG: 0.3, fatG: 0.2 },
  { name: 'Aveia em Flocos', baseUnit: '100g', calories: 389, carbsG: 66, proteinG: 17, fatG: 7 },
  {
    name: 'Leite Integral',
    baseUnit: '200ml',
    calories: 122,
    carbsG: 9.6,
    proteinG: 6.4,
    fatG: 6.4,
  },
  { name: 'Iogurte Natural', baseUnit: '170g', calories: 100, carbsG: 12, proteinG: 17, fatG: 0.5 },
  { name: 'Pão Integral', baseUnit: '1 fatia', calories: 80, carbsG: 14, proteinG: 4, fatG: 1.5 },
  {
    name: 'Azeite Extra Virgem',
    baseUnit: '15ml',
    calories: 119,
    carbsG: 0,
    proteinG: 0,
    fatG: 14,
  },
  { name: 'Amendoim', baseUnit: '30g', calories: 170, carbsG: 5, proteinG: 7.7, fatG: 14 },
  { name: 'Salmão Grelhado', baseUnit: '100g', calories: 208, carbsG: 0, proteinG: 22, fatG: 13 },
  { name: 'Brócolis Cozido', baseUnit: '100g', calories: 35, carbsG: 7, proteinG: 2.4, fatG: 0.4 },
  {
    name: 'Queijo Mussarela',
    baseUnit: '30g',
    calories: 85,
    carbsG: 0.6,
    proteinG: 6.3,
    fatG: 6.3,
  },
  { name: 'Tofu', baseUnit: '100g', calories: 76, carbsG: 1.9, proteinG: 8, fatG: 4.8 },
  { name: 'Granola', baseUnit: '50g', calories: 200, carbsG: 32, proteinG: 5, fatG: 7 },
]
