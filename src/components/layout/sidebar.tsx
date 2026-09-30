import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  Sparkles,
  HeartPulse,
  Wallet,
  ShieldCheck,
  Share2,
  GraduationCap,
  BarChart2,
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

// Mapeamento de rotas e featureKeys de cada item do usuário
const USER_NAV_META: Record<
  string,
  {
    path: string
    featureKey?: string
    isProOnly?: boolean
  }
> = {
  dashboard: { path: '/dashboard' },
  tasks: { path: '/tasks', featureKey: 'tasks' },
  social: { path: '/social' },
  health: { path: '/health', featureKey: 'health' },
  finance: { path: '/finance', featureKey: 'finance' },
  professional: { path: '/professional', isProOnly: true },
}

export function Sidebar() {
  const location = useLocation()
  const { isMaster, isProfessional } = useIsMaster()
  const isEnabled = useFeatureFlagsStore((s) => s.isEnabled)
  const settings = useSiteSettingsStore((s) => s.settings)
  const { brandName, proBrandName } = useBrandName()

  // Mescla customizações salvas com os defaults garantindo ordem e visibilidade
  const userCustomNav = mergeNavCustomization(DEFAULT_USER_NAV_ITEMS, settings.nav_customization)

  // Filtra itens visíveis respeitando:
  // 1. visible !== false (personalização de Sistema Ada)
  // 2. Feature Flags do item (se houver featureKey)
  // 3. Regra de papel para 'professional' (isProfessional)
  const visibleNavItems = userCustomNav.filter((item) => {
    if (!item.visible) return false
    const meta = USER_NAV_META[item.key]
    if (!meta) return true
    if (meta.isProOnly && !isProfessional) return false
    if (meta.featureKey && !isEnabled(meta.featureKey)) return false
    return true
  })

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r bg-card px-4 py-6 z-40 print:hidden overflow-hidden">
      <div className="flex items-center gap-3 px-2 mb-8 text-primary shrink-0">
        <Sparkles className="w-8 h-8 text-[#58CC02]" strokeWidth={1.5} />
        <span
          className="font-black text-xl tracking-tight text-foreground truncate"
          title={brandName}
        >
          {brandName}
        </span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
        {visibleNavItems.map((item) => {
          const meta = USER_NAV_META[item.key]
          const path = meta?.path || `/${item.key}`
          const isActive =
            location.pathname.startsWith(path) &&
            (path !== '/dashboard' || location.pathname === '/dashboard')
          const isProItem = item.key === 'professional'

          // Se for professional e o usuário customizou pro_brand_name, reflete aqui se o label for o padrão
          const displayLabel = isProItem
            ? item.label === 'Painel Pro'
              ? proBrandName
              : item.label
            : item.label

          const IconComponent =
            ICON_MAP[item.icon] || (isProItem ? StethoscopeIcon : LayoutDashboard)

          if (isProItem) {
            return (
              <div key={item.key} className="pt-1">
                <Link
                  to={path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-bold border-b-2',
                    isActive
                      ? 'bg-[#1CB0F6]/20 text-[#1CB0F6] border-[#1CB0F6]'
                      : 'text-[#1CB0F6] hover:bg-[#1CB0F6]/10 border-transparent',
                  )}
                >
                  <IconComponent className="w-5 h-5 shrink-0 text-[#1CB0F6]" />
                  <span className="truncate">{displayLabel}</span>
                </Link>
              </div>
            )
          }

          return (
            <div key={item.key}>
              <Link
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium',
                  isActive
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <IconComponent
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="truncate">{displayLabel}</span>
              </Link>
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
