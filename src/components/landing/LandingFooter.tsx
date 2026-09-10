import { Sparkles } from 'lucide-react'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

export function LandingFooter() {
  const { settings } = useSiteSettingsStore()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-12 bg-card border-t">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#58CC02]" />
          </div>
          <div>
            <span className="font-black text-base text-foreground">
              {settings.app_name || 'VibeCoding Tarefas'}
            </span>
            <p className="text-xs text-muted-foreground font-semibold">
              {settings.footer_message ||
                'Desenvolvido com foco em alta performance e simplicidade.'}
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-muted-foreground">
          © {currentYear} {settings.app_name || 'VibeCoding Tarefas'}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
