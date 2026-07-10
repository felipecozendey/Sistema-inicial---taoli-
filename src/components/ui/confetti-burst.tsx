import { useEffect, useRef, useState } from 'react'

const COLORS = ['#58CC02', '#FFC800', '#1CB0F6', '#FF4B4B', '#CE82FF']

export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const [show, setShow] = useState(false)
  const prevRef = useRef(trigger)

  useEffect(() => {
    if (trigger && !prevRef.current) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 3000)
      prevRef.current = trigger
      return () => clearTimeout(timer)
    }
    prevRef.current = trigger
  }, [trigger])

  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm animate-confetti-fall"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  )
}
