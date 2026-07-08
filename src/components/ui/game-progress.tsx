import { cn } from '@/lib/utils'

type ProgressVariant = 'success' | 'blue' | 'gold' | 'danger'
type ProgressHeight = 'sm' | 'md' | 'lg'

interface GameProgressProps {
  value: number
  max?: number
  variant?: ProgressVariant
  height?: ProgressHeight
  className?: string
}

const variantFill: Record<ProgressVariant, string> = {
  success: 'bg-[#58CC02]',
  blue: 'bg-[#1CB0F6]',
  gold: 'bg-[#FFC800]',
  danger: 'bg-[#FF4B4B]',
}

const heightMap: Record<ProgressHeight, string> = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-5',
}

export function GameProgress({
  value,
  max = 100,
  variant = 'success',
  height = 'md',
  className,
}: GameProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className={cn('w-full rounded-full bg-muted overflow-hidden', heightMap[height], className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 progress-shine',
          variantFill[variant],
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
