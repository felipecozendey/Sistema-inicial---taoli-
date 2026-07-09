import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnergyIconProps {
  level: 1 | 2 | 3
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function EnergyIcon({ level, size = 'sm', showLabel = false }: EnergyIconProps) {
  const colors: Record<number, string> = {
    1: 'text-[#58CC02]',
    2: 'text-[#FFC800]',
    3: 'text-[#FF4B4B]',
  }
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Zap
          key={i}
          className={cn(iconSize, i < level ? colors[level] : 'text-muted-foreground/30')}
          strokeWidth={2.5}
          fill={i < level ? 'currentColor' : 'none'}
        />
      ))}
      {showLabel && (
        <span className="ml-1 text-xs font-bold text-muted-foreground">
          {level === 1 ? 'Baixa' : level === 2 ? 'Média' : 'Alta'}
        </span>
      )}
    </div>
  )
}
