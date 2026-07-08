import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 12,
  className,
  children,
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    // Animate to value on mount/change
    const timer = setTimeout(() => setProgress(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">{children}</div>
    </div>
  )
}
