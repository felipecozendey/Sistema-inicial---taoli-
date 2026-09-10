import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { GameButton } from '@/components/ui/game-button'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

export function LandingFinalCta() {
  const { user } = useAuth()
  const { settings, flags } = useSiteSettingsStore()

  return (
    <section className="py-16 sm:py-24 border-b bg-gradient-to-br from-[#58CC02]/10 via-background to-[#1CB0F6]/10 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-6 sm:space-y-8 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-8 h-8 text-[#58CC02]" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
          {settings.final_cta_title || 'Pronto para elevar seu ritmo diário?'}
        </h2>

        <p className="text-muted-foreground text-sm sm:text-lg font-semibold max-w-xl mx-auto leading-relaxed">
          {settings.final_cta_subtitle ||
            'Comece agora mesmo a centralizar suas tarefas, hábitos, saúde e estudos com o ecossistema VibeCoding.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <GameButton
                variant="primary"
                size="lg"
                className="w-full sm:w-auto rounded-3xl font-black text-base px-8 py-4 shadow-lg flex items-center justify-center gap-2"
              >
                <span>Abrir App</span>
                <ArrowRight className="w-5 h-5" />
              </GameButton>
            </Link>
          ) : (
            <>
              <Link to="/login" className="w-full sm:w-auto">
                <GameButton
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto rounded-3xl font-black text-base px-8 py-4 shadow-lg flex items-center justify-center gap-2"
                >
                  <span>{settings.cta_primary_label || 'Entrar'}</span>
                  <ArrowRight className="w-5 h-5" />
                </GameButton>
              </Link>

              {flags.public_signup && (
                <Link to="/login" className="w-full sm:w-auto">
                  <GameButton
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto rounded-3xl font-black text-base px-8 py-4 flex items-center justify-center gap-2"
                  >
                    <span>{settings.cta_secondary_label || 'Criar conta'}</span>
                  </GameButton>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
