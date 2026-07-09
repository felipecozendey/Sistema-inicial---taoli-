import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, Settings, HeartPulse, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
  { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
  { icon: HeartPulse, label: 'Saúde', path: '/health' },
  { icon: UserCircle, label: 'Perfil', path: '/profile' },
  { icon: Settings, label: 'Ajustes', path: '/settings' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-1 pb-safe z-40 print:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <item.icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
