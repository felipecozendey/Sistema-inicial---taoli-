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
  path: string
  featureKey?: string
}

export function BottomNav() {
  const location = useLocation()
  const { isMaster } = useIsMaster()
  const isEnabled = useFeatureFlagsStore((s) => s.isEnabled)

  const items: BottomNavItem[] = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: CheckSquare, label: 'Tarefas', path: '/tasks', featureKey: 'tasks' },
    { icon: HeartPulse, label: 'Saúde', path: '/health', featureKey: 'health' },
    { icon: GraduationCap, label: 'Estudos', path: '/studies', featureKey: 'studies' },
    { icon: Wallet, label: 'Finanças', path: '/finance', featureKey: 'finance' },
    { icon: UserCircle, label: 'Perfil', path: '/profile' },
    ...(isMaster ? [{ icon: ShieldCheck, label: 'Master', path: '/master' }] : []),
    { icon: Settings, label: 'Ajustes', path: '/settings' },
  ]

  const visibleItems = items.filter((item) => {
    if (!item.featureKey) return true
    return isEnabled(item.featureKey)
  })
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-1 pb-safe z-40 print:hidden overflow-x-auto">
      {visibleItems.map((item) => {
        const isActive =
          location.pathname.startsWith(item.path) &&
          (item.path !== '/dashboard' || location.pathname === '/dashboard')
        const isMasterTab = item.path === '/master'
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center min-w-[48px] flex-1 h-full space-y-1 transition-colors',
              isActive
                ? isMasterTab
                  ? 'text-amber-500 font-bold'
                  : 'text-primary font-bold'
                : isMasterTab
                  ? 'text-amber-600/70 dark:text-amber-400/70'
                  : 'text-muted-foreground',
            )}
          >
            <item.icon
              className={cn(
                'w-5 h-5 transition-transform',
                isActive && 'scale-110',
                isMasterTab && 'text-amber-500',
              )}
            />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
