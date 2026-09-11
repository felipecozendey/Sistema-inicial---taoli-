import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  HeartPulse,
  UserCircle,
  GraduationCap,
  Wallet,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMaster } from '@/stores/useMasterStore'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'

interface BottomNavItem {
  icon: any
  label: string
  shortLabel?: string
  path: string
  featureKey?: string
}

export function BottomNav() {
  const location = useLocation()
  const { isMaster } = useIsMaster()
  const isEnabled = useFeatureFlagsStore((s) => s.isEnabled)

  const items: BottomNavItem[] = [
    { icon: LayoutDashboard, label: 'Início', shortLabel: 'Início', path: '/dashboard' },
    {
      icon: CheckSquare,
      label: 'Tarefas',
      shortLabel: 'Tarefas',
      path: '/tasks',
      featureKey: 'tasks',
    },
    {
      icon: HeartPulse,
      label: 'Saúde',
      shortLabel: 'Saúde',
      path: '/health',
      featureKey: 'health',
    },
    {
      icon: GraduationCap,
      label: 'Estudos',
      shortLabel: 'Estudos',
      path: '/studies',
      featureKey: 'studies',
    },
    {
      icon: Wallet,
      label: 'Finanças',
      shortLabel: 'Finanças',
      path: '/finance',
      featureKey: 'finance',
    },
    { icon: UserCircle, label: 'Perfil', shortLabel: 'Perfil', path: '/profile' },
    ...(isMaster
      ? [{ icon: ShieldCheck, label: 'Master', shortLabel: 'Master', path: '/master' }]
      : []),
    { icon: Settings, label: 'Ajustes', shortLabel: 'Ajustes', path: '/settings' },
  ]

  const visibleItems = items.filter((item) => {
    if (!item.featureKey) return true
    return isEnabled(item.featureKey)
  })
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-0.5 pb-safe z-40 print:hidden overflow-hidden">
      {visibleItems.map((item) => {
        const isActive =
          location.pathname.startsWith(item.path) &&
          (item.path !== '/dashboard' || location.pathname === '/dashboard')
        const isMasterTab = item.path === '/master'
        return (
          <Link
            key={item.path}
            to={item.path}
            title={item.label}
            aria-label={item.label}
            className={cn(
              'flex flex-col items-center justify-center flex-1 min-w-0 h-full px-0.5 space-y-0.5 transition-colors',
              isActive
                ? isMasterTab
                  ? 'text-amber-500 font-black'
                  : 'text-primary font-black'
                : isMasterTab
                  ? 'text-amber-600/70 dark:text-amber-400/70'
                  : 'text-muted-foreground',
            )}
          >
            <item.icon
              className={cn(
                'w-5 h-5 shrink-0 transition-transform',
                isActive && 'scale-110',
                isMasterTab && 'text-amber-500',
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[10px] leading-tight font-bold truncate max-w-full text-center">
              {item.shortLabel || item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
