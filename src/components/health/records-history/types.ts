import type { BowelType } from '@/stores/useAppStore'

export type HealthMetricCategory =
  | 'heart_rate'
  | 'blood_pressure'
  | 'glucose'
  | 'weight'
  | 'height'
  | 'hydration'
  | 'urine'
  | 'digestion'

export interface HealthMetricOption {
  id: HealthMetricCategory
  label: string
  emoji: string
  color: string
  description: string
  unit: string
}

export const HEALTH_METRIC_OPTIONS: HealthMetricOption[] = [
  {
    id: 'heart_rate',
    label: 'Frequência Cardíaca',
    emoji: '❤️',
    color: '#FF4B4B',
    description: 'Frequência cardíaca em repouso',
    unit: 'bpm',
  },
  {
    id: 'blood_pressure',
    label: 'Pressão Arterial',
    emoji: '🩺',
    color: '#0E8FCC',
    description: 'Pressão sistólica e diastólica',
    unit: 'mmHg',
  },
  {
    id: 'glucose',
    label: 'Glicose',
    emoji: '🩸',
    color: '#CE82FF',
    description: 'Nível de glicemia capilar',
    unit: 'mg/dL',
  },
  {
    id: 'weight',
    label: 'Peso',
    emoji: '⚖️',
    color: '#58CC02',
    description: 'Peso corporal',
    unit: 'kg',
  },
  {
    id: 'height',
    label: 'Altura',
    emoji: '📏',
    color: '#1CB0F6',
    description: 'Estatura aferida',
    unit: 'cm',
  },
  {
    id: 'hydration',
    label: 'Hidratação',
    emoji: '💧',
    color: '#1CB0F6',
    description: 'Consumo diário de água',
    unit: 'ml',
  },
  {
    id: 'urine',
    label: 'Urina',
    emoji: '🟡',
    color: '#FFC800',
    description: 'Escala de coloração urinária (1 a 6)',
    unit: 'escala',
  },
  {
    id: 'digestion',
    label: 'Digestão',
    emoji: '🚽',
    color: '#FF9600',
    description: 'Escala de Bristol fecal (1 a 7)',
    unit: 'escala',
  },
]

export const BRISTOL_SCALE: {
  type: BowelType
  label: string
  color: string
  description: string
}[] = [
  {
    type: 1,
    label: 'Tipo 1',
    color: '#FF4B4B',
    description: 'Pélotas duras separadas (como nozes)',
  },
  { type: 2, label: 'Tipo 2', color: '#FF9600', description: 'Formato de salsicha granular' },
  {
    type: 3,
    label: 'Tipo 3',
    color: '#58CC02',
    description: 'Salsicha com rachaduras na superfície',
  },
  { type: 4, label: 'Tipo 4', color: '#58CC02', description: 'Salsicha lisa e macia (Ideal)' },
  { type: 5, label: 'Tipo 5', color: '#FFC800', description: 'Gotas macias com bordas nítidas' },
  {
    type: 6,
    label: 'Tipo 6',
    color: '#FF9600',
    description: 'Pedaços esfarrapados (Diarreia leve)',
  },
  { type: 7, label: 'Tipo 7', color: '#FF4B4B', description: 'Aquoso sem sólidos (Diarreia)' },
]

export const URINE_SCALE: { type: number; label: string; color: string; description: string }[] = [
  { type: 1, label: 'Transparente', color: '#FFF9C4', description: 'Excelente hidratação' },
  { type: 2, label: 'Am. Claro', color: '#FFF176', description: 'Hidratação adequada' },
  { type: 3, label: 'Amarelo', color: '#FFEE58', description: 'Hidratação moderada' },
  { type: 4, label: 'Am. Escuro', color: '#FBC02D', description: 'Beba mais água' },
  { type: 5, label: 'Âmbar', color: '#EF6C00', description: 'Desidratação moderada' },
  { type: 6, label: 'Marrom', color: '#6D4C41', description: 'Alerta de desidratação severa' },
]

export interface UnifiedHistoryEntry {
  id: string
  date: string // YYYY-MM-DD ou ISO
  timestamp: string // ISO completo
  category: HealthMetricCategory
  title: string
  value: string
  numericValue?: number
  unit?: string
  badge: string
  color: string
  details?: string
}

export interface UnifiedChartPoint {
  date: string
  rawDate: string
  hydration?: number
  urineColor?: number
  urineLabel?: string
  bristolType?: number
  bristolLabel?: string
  weight?: number
  height?: number
  heartRate?: number
  glucose?: number
  systolic?: number
  diastolic?: number
}
