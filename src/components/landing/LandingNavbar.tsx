import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, User } from 'lucide-react'
import { GameButton } from '@/components/ui/game-button'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

export function LandingNavbar() {
  const { user } = useAuth()
  const { settings } = useSiteSettingsStore()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center transition-transform group-hover:scale-105">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#58CC02]" />
          </div>
          <span className="font-black text-lg sm:text-xl tracking-tight text-foreground">
            {settings.app_name || 'VibeCoding Tarefas'}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <GameButton
                variant="primary"
                size="sm"
                className="flex items-center gap-2 rounded-2xl px-4 py-2 font-black text-xs sm:text-sm"
              >
                <span>Abrir App</span>
                <ArrowRight className="w-4 h-4" />
              </GameButton>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <GameButton
                  variant="outline"
                  size="sm"
                  className="rounded-2xl px-4 py-2 font-black text-xs sm:text-sm flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>{settings.cta_primary_label || 'Entrar'}</span>
                </GameButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
