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

export type FastingProtocol = {
  hours: number
  label: string
  description: string
}

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  { hours: 12, label: 'Leve', description: '12h' },
  { hours: 14, label: 'Moderado', description: '14h' },
  { hours: 16, label: 'Padrão', description: '16h' },
  { hours: 18, label: 'Avançado', description: '18h' },
  { hours: 20, label: 'Guerreiro', description: '20h' },
]

export function getMetabolicStage(elapsedHours: number): { text: string; color: string } {
  if (elapsedHours < 4) {
    return {
      text: 'Digestão ativa. Seu corpo está quebrando a última refeição. 🍏',
      color: '#58CC02',
    }
  }
  if (elapsedHours < 12) {
    return {
      text: 'Níveis de insulina caindo. Seu corpo começa a se preparar para usar gordura como energia. ⚡',
      color: '#FFC800',
    }
  }
  if (elapsedHours < 16) {
    return {
      text: 'Lipólise ativa! Seu corpo entrou em estado de queima de gordura otimizada. 🔥',
      color: '#FF9600',
    }
  }
  return {
    text: 'Autofagia iniciada. Suas células começaram um processo de auto-limpeza e renovação celular. 🧠',
    color: '#CE82FF',
  }
}
