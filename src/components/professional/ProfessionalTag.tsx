import { useEffect, useState } from 'react'
import { StethoscopeIcon } from './StethoscopeIcon'
import { useProfessionalStore } from '@/stores/useProfessionalStore'
import { cn } from '@/lib/utils'

interface ProfessionalTagProps {
  createdBy?: string | null
  className?: string
  fallbackName?: string
}

export function ProfessionalTag({ createdBy, className, fallbackName }: ProfessionalTagProps) {
  const getProfessionalNames = useProfessionalStore((s) => s.getProfessionalNames)
  const cache = useProfessionalStore((s) => s.professionalNamesCache)
  const [name, setName] = useState<string>(() => {
    if (!createdBy) return ''
    return cache.get(createdBy) || fallbackName || 'Profissional'
  })

  useEffect(() => {
    if (!createdBy) return
    const cached = cache.get(createdBy)
    if (cached) {
      setName(cached)
      return
    }
    let isMounted = true
    getProfessionalNames([createdBy]).then((res) => {
      if (isMounted) {
        setName(res.get(createdBy) || fallbackName || 'Profissional')
      }
    })
    return () => {
      isMounted = false
    }
  }, [createdBy, cache, getProfessionalNames, fallbackName])

  if (!createdBy) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-[#1CB0F6] shadow-sm select-none shrink-0',
        className,
      )}
      title={`Criado por ${name}`}
    >
      <StethoscopeIcon size={12} className="shrink-0 stroke-[2.5]" />
      <span className="truncate max-w-[140px]">{name}</span>
    </span>
  )
}
