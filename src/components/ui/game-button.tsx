import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'gold' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[#58CC02] text-white border-[#46A302]',
  secondary: 'bg-[#1CB0F6] text-white border-[#1899D6]',
  gold: 'bg-[#FFC800] text-[#374151] border-[#CCA000]',
  danger: 'bg-[#FF4B4B] text-white border-[#CC3C3C]',
  outline: 'bg-card text-[#1CB0F6] border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/50',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
}

export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const isOutline = variant === 'outline'
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'font-bold transition-all duration-100 select-none',
          variantStyles[variant],
          isOutline
            ? 'border-2 border-b-4 active:translate-y-0.5 active:border-b-2'
            : 'border-b-4 hover:brightness-105 active:translate-y-1 active:border-b-0',
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
GameButton.displayName = 'GameButton'
