import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  HeartPulse,
  Wallet,
  ShieldCheck,
  Share2,
  GraduationCap,
  BarChart2,
  Sparkles,
  Flame,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMaster } from '@/stores/useMasterStore'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'
import {
  useSiteSettingsStore,
  useBrandName,
  DEFAULT_USER_NAV_ITEMS,
  mergeNavCustomization,
} from '@/stores/useSiteSettingsStore'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  CheckSquare,
  Share2,
  HeartPulse,
  Wallet,
  StethoscopeIcon,
  GraduationCap,
  BarChart2,
  Sparkles,
  Flame,
  Zap,
}

const USER_NAV_META: Record<
  string,
  {
    path: string
    featureKey?: string
    isProOnly?: boolean
    shortLabel?: string
  }
> = {
  dashboard: { path: '/dashboard', shortLabel: 'Início' },
  tasks: { path: '/tasks', featureKey: 'tasks', shortLabel: 'Perf.' },
  social: { path: '/social', shortLabel: 'Social' },
  health: { path: '/health', featureKey: 'health', shortLabel: 'Saúde' },
  finance: { path: '/finance', featureKey: 'finance', shortLabel: 'Finanças' },
  professional: { path: '/professional', isProOnly: true, shortLabel: 'Pro' },
}

export function BottomNav() {
  const location = useLocation()
  const { isMaster, isProfessional } = useIsMaster()
  const isEnabled = useFeatureFlagsStore((s) => s.isEnabled)
  const settings = useSiteSettingsStore((s) => s.settings)
  const { proBrandName } = useBrandName()

  // Mescla customizações com os itens default
  const userCustomNav = mergeNavCustomization(DEFAULT_USER_NAV_ITEMS, settings.nav_customization)

  // Itens dinâmicos configurados em Sistema Ada
  const dynamicItems = userCustomNav
    .filter((item) => {
      if (!item.visible) return false
      const meta = USER_NAV_META[item.key]
      if (!meta) return true
      if (meta.isProOnly && !isProfessional) return false
      if (meta.featureKey && !isEnabled(meta.featureKey)) return false
      return true
    })
    .map((item) => {
      const meta = USER_NAV_META[item.key]
      const isProItem = item.key === 'professional'
      const label = isProItem
        ? item.label === 'Painel Pro'
          ? proBrandName
          : item.label
        : item.label
      const IconComponent = ICON_MAP[item.icon] || (isProItem ? StethoscopeIcon : LayoutDashboard)

      return {
        key: item.key,
        icon: IconComponent,
        label,
        shortLabel: meta?.shortLabel || label,
        path: meta?.path || `/${item.key}`,
      }
    })

  // Itens fixos do sistema (não configuráveis)
  const fixedItems = [
    ...(isMaster
      ? [
          {
            key: 'master',
            icon: ShieldCheck,
            label: 'Master',
            shortLabel: 'Master',
            path: '/master',
          },
        ]
      : []),
    { key: 'settings', icon: Settings, label: 'Ajustes', shortLabel: 'Ajustes', path: '/settings' },
  ]

  const visibleItems = [...dynamicItems, ...fixedItems]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-0.5 pb-safe z-40 print:hidden overflow-hidden">
      {visibleItems.map((item) => {
        const isActive =
          location.pathname.startsWith(item.path) &&
          (item.path !== '/dashboard' || location.pathname === '/dashboard')
        const isMasterTab = item.path === '/master'
        const isProTab = item.path === '/professional'
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
                  : isProTab
                    ? 'text-[#1CB0F6] font-black'
                    : 'text-primary font-black'
                : isMasterTab
                  ? 'text-amber-600/70 dark:text-amber-400/70'
                  : isProTab
                    ? 'text-[#1CB0F6]/80'
                    : 'text-muted-foreground',
            )}
          >
            <item.icon
              className={cn(
                'w-5 h-5 shrink-0 transition-transform',
                isActive && 'scale-110',
                isMasterTab && 'text-amber-500',
                isProTab && 'text-[#1CB0F6]',
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
