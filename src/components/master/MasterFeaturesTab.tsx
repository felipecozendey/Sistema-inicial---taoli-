import { useMasterStore } from '@/stores/useMasterStore'
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore'
import {
  ToggleLeft,
  CheckSquare,
  HeartPulse,
  GraduationCap,
  Wallet,
  BarChart2,
  Sliders,
  AlertTriangle,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'

export function MasterFeaturesTab() {
  const { featureFlags, toggleFeature } = useMasterStore()
  const loadFlags = useFeatureFlagsStore((s) => s.loadFlags)

  const getModuleIcon = (key: string) => {
    switch (key) {
      case 'tasks':
        return CheckSquare
      case 'health':
        return HeartPulse
      case 'studies':
        return GraduationCap
      case 'finance':
        return Wallet
      case 'analytics':
        return BarChart2
      default:
        return Sliders
    }
  }

  const getModuleAccent = (key: string) => {
    switch (key) {
      case 'tasks':
        return 'text-[#1CB0F6] bg-[#1CB0F6]/10 border-[#1CB0F6]/30'
      case 'health':
        return 'text-[#FF4B4B] bg-[#FF4B4B]/10 border-[#FF4B4B]/30'
      case 'studies':
        return 'text-[#FFC800] bg-[#FFC800]/10 border-[#FFC800]/30'
      case 'finance':
        return 'text-[#58CC02] bg-[#58CC02]/10 border-[#58CC02]/30'
      case 'analytics':
        return 'text-[#CE82FF] bg-[#CE82FF]/10 border-[#CE82FF]/30'
      default:
        return 'text-primary bg-primary/10 border-primary/30'
    }
  }

  const handleToggle = async (key: string, current: boolean) => {
    const success = await toggleFeature(key, !current)
    if (success) {
      // Refresh global app flags
      loadFlags()
    }
  }

  return (
    <div className="space-y-6">
      {/* Notice */}
      <div className="bg-primary/10 border-2 border-primary/20 rounded-3xl p-4 sm:p-5 flex items-start gap-3">
        <Sliders className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-foreground text-sm">
            Controle de Módulos Globais (Feature Flags)
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Ao desativar um módulo abaixo, o item correspondente será ocultado da navegação de todos
            os usuários do sistema. Caso um usuário tente acessar a rota diretamente via URL, será
            redirecionado para a tela inicial. Configurações e Perfil são permanentes e nunca podem
            ser desativados.
          </p>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featureFlags.map((flag) => {
          const Icon = getModuleIcon(flag.key)
          const accentClass = getModuleAccent(flag.key)

          return (
            <Card
              key={flag.key}
              className={`rounded-3xl border-2 p-5 bg-card transition-all flex flex-col justify-between ${
                flag.enabled
                  ? 'border-b-4 border-b-primary/40 shadow-sm'
                  : 'border-dashed opacity-75 bg-muted/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${accentClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      {flag.label}
                      <span className="text-[10px] font-mono font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                        /{flag.key}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {flag.description || 'Controle operacional do módulo'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag.key, flag.enabled)}
                    className="data-[state=checked]:bg-[#58CC02]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground text-[11px]">Status para usuários:</span>
                {flag.enabled ? (
                  <span className="text-[#58CC02] flex items-center gap-1 text-[11px] font-black">
                    <span className="w-2 h-2 rounded-full bg-[#58CC02]" /> Ativo no Menu
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" /> Oculto e Bloqueado
                  </span>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
