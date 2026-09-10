import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, CheckCircle2, Flame, ShieldCheck, Zap } from 'lucide-react'
import { GameButton } from '@/components/ui/game-button'
import { useAuth } from '@/hooks/use-auth'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

export function LandingHero() {
  const { user } = useAuth()
  const { settings, flags } = useSiteSettingsStore()

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b">
      {/* Background decoration dots/gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#58CC02]/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-6 sm:space-y-8 animate-fade-in-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#58CC02]/15 border-2 border-[#58CC02]/30 text-[#58CC02] text-xs sm:text-sm font-black shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>Produtividade Gamificada com Filosofia Duolingo</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
          {settings.hero_title || 'Organize sua vida com o poder do VibeCoding'}
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-sm sm:text-lg md:text-xl font-semibold max-w-2xl mx-auto leading-relaxed">
          {settings.hero_subtitle ||
            'Tarefas, hábitos, saúde física e mental, estudos e finanças pessoais em um ecossistema gamificado e ultra-rápido.'}
        </p>

        {/* Action Buttons */}
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

        {/* Quick Highlights Duolingo Chips */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-black text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-card border-2 rounded-2xl px-3 py-1.5 shadow-sm">
            <Zap className="w-4 h-4 text-[#FFC800]" />
            <span>Zero Lag & Offline-Ready</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card border-2 rounded-2xl px-3 py-1.5 shadow-sm">
            <Flame className="w-4 h-4 text-[#FF4B4B]" />
            <span>Streaks Diários</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card border-2 rounded-2xl px-3 py-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#58CC02]" />
            <span>Privacidade Total</span>
          </div>
        </div>
      </div>
    </section>
  )
}
