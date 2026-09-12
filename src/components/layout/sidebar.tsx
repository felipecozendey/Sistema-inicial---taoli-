import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  BarChart2,
  Settings,
  Sparkles,
  HeartPulse,
  UserCircle,
  GraduationCap,
  Wallet,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMaster } from '@/stores/useMasterStore'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'

interface NavItem {
  icon: any
  label: string
  path: string
  featureKey?: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CheckSquare, label: 'Hábitos e Tarefas', path: '/tasks', featureKey: 'tasks' },
  { icon: HeartPulse, label: 'Saúde', path: '/health', featureKey: 'health' },
  { icon: GraduationCap, label: 'Estudos', path: '/studies', featureKey: 'studies' },
  { icon: Wallet, label: 'Finanças', path: '/finance', featureKey: 'finance' },
  { icon: BarChart2, label: 'Relatórios', path: '/analytics', featureKey: 'analytics' },
  { icon: UserCircle, label: 'Perfil', path: '/profile' },
]

export function Sidebar() {
  const location = useLocation()
  const { isMaster, isProfessional } = useIsMaster()
  const isEnabled = useFeatureFlagsStore((s) => s.isEnabled)

  const visibleNavItems = navItems.filter((item) => {
    if (!item.featureKey) return true
    return isEnabled(item.featureKey)
  })

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r bg-card px-4 py-6 z-40 print:hidden overflow-hidden">
      <div className="flex items-center gap-3 px-2 mb-8 text-primary shrink-0">
        <Sparkles className="w-8 h-8" strokeWidth={1.5} />
        <span className="font-bold text-xl tracking-tight text-foreground">Zenith</span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <div key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium',
                  isActive
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
              {/* Item no sidebar e bottom-nav abaixo de "Perfil", visível somente quando is_professional = true */}
              {item.path === '/profile' && isProfessional && (
                <Link
                  to="/professional"
                  className={cn(
                    'mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-bold border-b-2',
                    location.pathname.startsWith('/professional')
                      ? 'bg-[#1CB0F6]/20 text-[#1CB0F6] border-[#1CB0F6]'
                      : 'text-[#1CB0F6] hover:bg-[#1CB0F6]/10 border-transparent',
                  )}
                >
                  <StethoscopeIcon className="w-5 h-5 shrink-0 text-[#1CB0F6]" />
                  <span className="truncate">Painel Pro</span>
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t space-y-2 shrink-0">
        {isMaster && (
          <Link
            to="/master"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium',
              location.pathname.startsWith('/master')
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border-b-2 border-amber-500'
                : 'text-amber-600/90 dark:text-amber-400/90 hover:bg-amber-500/10 hover:text-amber-600',
            )}
          >
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="truncate">Masterização</span>
          </Link>
        )}

        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
            location.pathname === '/settings'
              ? 'bg-primary/20 text-primary font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="truncate">Configurações</span>
        </Link>
      </div>
    </aside>
  )
}
