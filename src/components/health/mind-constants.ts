export const MOODS = [
  { level: 1, emoji: '😩', label: 'Péssimo', color: '#FF4B4B' },
  { level: 2, emoji: '😕', label: 'Ruim', color: '#FF9600' },
  { level: 3, emoji: '😐', label: 'Neutro', color: '#FFC800' },
  { level: 4, emoji: '🙂', label: 'Bom', color: '#1CB0F6' },
  { level: 5, emoji: '😄', label: 'Excelente', color: '#58CC02' },
]

export const METRIC_CONFIG: Record<string, { labels: string[]; colors: string[] }> = {
  stress: {
    labels: ['Esgotado', 'Alto', 'Moderado', 'Leve', 'Calmo'],
    colors: ['#FF4B4B', '#FF9600', '#FFC800', '#1CB0F6', '#58CC02'],
  },
  anxiety: {
    labels: ['Crítico', 'Elevado', 'Moderado', 'Leve', 'Tranquilo'],
    colors: ['#FF4B4B', '#FF9600', '#FFC800', '#1CB0F6', '#58CC02'],
  },
  sleep: {
    labels: ['Péssima', 'Ruim', 'Regular', 'Boa', 'Revigorante'],
    colors: ['#FF4B4B', '#FF9600', '#FFC800', '#1CB0F6', '#58CC02'],
  },
  sadness: {
    labels: ['Profunda', 'Grave', 'Moderada', 'Leve', 'Alegre'],
    colors: ['#FF4B4B', '#FF9600', '#FFC800', '#1CB0F6', '#58CC02'],
  },
}

export const SCORE_METRICS = [
  { key: 'mood', label: 'Humor', color: '#58CC02' },
  { key: 'stress', label: 'Estresse', color: '#FF9600' },
  { key: 'anxiety', label: 'Ansiedade', color: '#FF4B4B' },
  { key: 'sleep', label: 'Sono', color: '#1CB0F6' },
  { key: 'sadness', label: 'Tristeza', color: '#CE82FF' },
]

export function getColorForScore(score: number): string {
  const colors = ['#FF4B4B', '#FF9600', '#FFC800', '#1CB0F6', '#58CC02']
  return colors[Math.max(0, Math.min(4, score - 1))]
}
