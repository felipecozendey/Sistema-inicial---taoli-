import React from 'react'

interface StethoscopeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

export function StethoscopeIcon({ size = 20, className, ...props }: StethoscopeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4.5 3v5a5.5 5.5 0 0 0 11 0V3" />
      <path d="M3 3h3" />
      <path d="M14 3h3" />
      <path d="M10 13.5V18a4 4 0 0 0 4 4h1a3 3 0 0 0 3-3v-1.5" />
      <circle cx="18" cy="15.5" r="2.5" fill="currentColor" fillOpacity={0.2} />
    </svg>
  )
}
