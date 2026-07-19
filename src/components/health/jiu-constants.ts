export const BELT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  White: {
    bg: 'bg-white border-2 border-gray-300 dark:border-gray-600',
    text: 'text-gray-800 dark:text-gray-200',
    label: 'Branca',
  },
  Blue: { bg: 'bg-[#1CB0F6]', text: 'text-white', label: 'Azul' },
  Purple: { bg: 'bg-[#A560E8]', text: 'text-white', label: 'Roxa' },
  Brown: { bg: 'bg-[#8B5A2B]', text: 'text-white', label: 'Marrom' },
  Black: { bg: 'bg-[#2D2D2D]', text: 'text-white', label: 'Preta' },
}

export const CAT_COLORS: Record<string, string> = {
  Queda: '#FF4B4B',
  Passagem: '#1CB0F6',
  Raspagem: '#58CC02',
  Finalização: '#FF9600',
  Defesa: '#A560E8',
}

export const TECHNIQUE_CATEGORIES = ['Queda', 'Passagem', 'Raspagem', 'Finalização', 'Defesa']

export const PROFICIENCY_CONFIG: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: 'Aprendendo', color: 'bg-[#FF4B4B]/10 text-[#FF4B4B] border-[#FF4B4B]', emoji: '🔴' },
  2: {
    label: 'Aperfeiçoamento',
    color: 'bg-[#FF9600]/10 text-[#FF9600] border-[#FF9600]',
    emoji: '🟡',
  },
  3: { label: 'Dominado', color: 'bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]', emoji: '🟢' },
}
