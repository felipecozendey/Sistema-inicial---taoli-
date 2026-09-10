import {
  CheckSquare,
  HeartPulse,
  GraduationCap,
  Wallet,
  BarChart2,
  Sliders,
  Sparkles,
  Flame,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

const ICON_MAP: Record<string, any> = {
  CheckSquare,
  HeartPulse,
  GraduationCap,
  Wallet,
  BarChart2,
  Sliders,
  Sparkles,
  Flame,
  Zap,
}

export function LandingFeatures() {
  const { settings } = useSiteSettingsStore()
  const features = settings.features || []

  return (
    <section className="py-16 sm:py-24 border-b bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1CB0F6]/15 text-[#1CB0F6] text-xs font-black">
            <span>Funcionalidades Integradas</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Tudo o que você precisa em uma única plataforma
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">
            Sem alternar entre dezenas de aplicativos desconexos. O VibeCoding conecta seus pilares
            de produtividade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((item) => {
            const Icon = ICON_MAP[item.icon] || Sparkles
            const color = item.color || '#58CC02'

            return (
              <Card
                key={item.id}
                className="rounded-3xl border-2 border-b-4 p-6 bg-card transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between space-y-4"
                style={{ borderBottomColor: color }}
              >
                <div className="space-y-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm"
                    style={{
                      backgroundColor: `${color}18`,
                      borderColor: `${color}35`,
                      color: color,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-foreground">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
